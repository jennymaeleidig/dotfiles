/**
 * herdr-subagent — delegate work to pi children running in real herdr shell
 * panes beside this session.
 *
 * A spawn is fire-and-forget: the tool opens one pane per task and returns an
 * acknowledgement, then a detached watcher notices each child's report and
 * delivers the batch back to this session as a steer message.
 *
 * The pane is a real login shell (herdr `pane split` + `pane run`), so the child
 * inherits the environment a human would get — rc files, direnv, mise, PATH —
 * and pi loads that host's normal settings, extensions and tools. Nothing about
 * the launch is herdr-plugin machinery.
 *
 * Registered only when this pi is itself inside herdr: outside there is no pane
 * to split.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { Type } from "typebox"
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  currentPaneId,
  isInsideHerdr,
  paneClose,
  paneExists,
  paneForegroundArgv,
  paneRename,
  paneRun,
  paneSplit,
  paneWaitReady,
} from "./herdr.ts"
import { buildChildArgv, buildChildCommand, childPaths, defaultBaseDir, runId } from "./spawn.ts"
import { argvRunsChild, formatBatch, readTextOrNull, watchChild } from "./watch.ts"

/** The child hook, passed as `-e` to every child. */
const CHILD_EXTENSION = fileURLToPath(new URL("./child.ts", import.meta.url))
const MAX_TASKS = 4

function piBin(): string {
  return process.env.PI_HERDR_PI_BIN || "pi"
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface SpawnedChild {
  name: string
  paneId: string
  sessionFile: string
  reportFile: string
}

export default function (pi: ExtensionAPI) {
  if (!isInsideHerdr()) return

  /** Watchers still running, so a shutdown can end them. */
  const watchers = new Set<AbortController>()
  pi.on("session_shutdown", () => {
    for (const watcher of watchers) watcher.abort()
    watchers.clear()
  })

  pi.registerTool({
    name: "subagent",
    label: "Spawn subagent panes",
    description:
      "Delegate one or more fully self-contained tasks to fresh pi subagents running in herdr " +
      "panes beside this session. Each child has its own context window and cannot see this " +
      "conversation, so every task must stand alone. Children run in parallel. This is " +
      "fire-and-forget: it returns as soon as the panes are open, and one message with every " +
      "child's result arrives later. Do not wait or poll after calling it. A child that ends " +
      "without reporting keeps its pane open and holds the batch.",
    promptSnippet: "Delegate self-contained tasks to parallel pi subagents in herdr panes",
    promptGuidelines: [
      "Use subagent for work that is self-contained and can run in parallel; the child cannot see this conversation, so include everything it needs in the task.",
    ],
    parameters: Type.Object({
      tasks: Type.Array(
        Type.Object({
          task: Type.String({
            description:
              "A complete, self-contained brief. The child cannot see this conversation and cannot ask follow-up questions.",
          }),
          name: Type.Optional(Type.String({ description: "Label for the pane and the result. Defaults to subagent-N." })),
          model: Type.Optional(
            Type.String({ description: 'Model override for this child, as "provider/id". Defaults to this session\'s model.' }),
          ),
          thinking: Type.Optional(
            Type.String({ description: "Thinking level override: off, minimal, low, medium, high, xhigh, max. Defaults to this session's level." }),
          ),
          cwd: Type.Optional(Type.String({ description: "Working directory for this child. Defaults to this session's cwd." })),
        }),
        { description: "One or more tasks to run in parallel.", minItems: 1, maxItems: MAX_TASKS },
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const spawned: SpawnedChild[] = []
      const failures: string[] = []

      for (const [index, item] of params.tasks.entries()) {
        const name = item.name?.trim() || `subagent-${index + 1}`
        const cwd = item.cwd || ctx.cwd
        const id = runId()
        const paths = childPaths(defaultBaseDir(), id)
        const previous = spawned.at(-1)
        let paneId: string | null = null
        try {
          mkdirSync(paths.dir, { recursive: true })
          const argv = buildChildArgv({
            piBin: piBin(),
            sessionFile: paths.sessionFile,
            extensionPath: CHILD_EXTENSION,
            task: item.task,
            model: item.model ?? null,
            thinking: item.thinking ?? null,
          })
          const command = buildChildCommand({ argv, reportFile: paths.reportFile, id })
          paneId = await paneSplit({
            cwd,
            targetPaneId: previous?.paneId ?? currentPaneId(),
            direction: previous ? "down" : "right",
          })
          // A fresh pane's shell is not reading yet; a `pane run` sent now would
          // be lost. Wait for it before typing the child command.
          if (!(await paneWaitReady(paneId))) {
            throw new Error("the pane's shell never became ready")
          }
          await paneRun(paneId, command)
          void paneRename(paneId, name)
          spawned.push({ name, paneId, sessionFile: paths.sessionFile, reportFile: paths.reportFile })
        } catch (error) {
          // A pane we opened but never started would otherwise sit there with no
          // watcher to close it.
          if (paneId) void paneClose(paneId)
          failures.push(`${name}: ${message(error)}`)
        }
      }

      if (spawned.length > 0) {
        const controller = new AbortController()
        watchers.add(controller)
        void collect(pi, spawned, controller).finally(() => watchers.delete(controller))
      }

      const lines = spawned.map((child, index) => `${index + 1}. ${child.name} → pane ${child.paneId}`)
      if (failures.length > 0) lines.push(`Could not spawn: ${failures.join("; ")}`)
      return {
        content: [{ type: "text", text: `Spawned ${spawned.length} subagent(s).\n${lines.join("\n")}` }],
        details: { ok: failures.length === 0, panes: spawned.map((child) => child.paneId), failures },
      }
    },
  })
}

/** Wait for every child in a batch, close the reported ones, then deliver once. */
async function collect(pi: ExtensionAPI, children: SpawnedChild[], controller: AbortController): Promise<void> {
  const entries = await Promise.all(
    children.map(async (child) => {
      const outcome = await watchChild(
        {
          readReport: () => readTextOrNull(child.reportFile),
          paneExists: () => paneExists(child.paneId),
          childRunning: async () => {
            const argv = await paneForegroundArgv(child.paneId)
            return argv === null ? true : argvRunsChild(argv, child.sessionFile)
          },
        },
        controller.signal,
      )
      // A reported child is finished: close its pane. A failed or unreported one
      // keeps its pane so the user can read or steer it.
      if (outcome.kind === "done") void paneClose(child.paneId)
      return { name: child.name, outcome }
    }),
  )
  if (controller.signal.aborted) return
  pi.sendUserMessage(formatBatch(entries), { deliverAs: "steer" })
}
