/**
 * End-to-end test with a REAL pi child (not the stand-in). Costs one model turn.
 * Needs a live herdr session and working credentials.
 *
 *   node e2e.ts
 *
 * It creates a throwaway tab, splits a real shell pane, launches `pi` in it with
 * the child extension and a task that must call `subagent_report`, then drives
 * the real watcher. The tab is closed in a finally.
 */

import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync } from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import {
  herdrBin,
  paneClose,
  paneExists,
  paneForegroundArgv,
  paneRun,
  paneSplit,
  paneWaitReady,
} from "../../../dot_pi/agent/extensions/herdr-subagent/herdr.ts"
import { buildChildArgv, buildChildCommand, childPaths } from "../../../dot_pi/agent/extensions/herdr-subagent/spawn.ts"
import { argvRunsChild, readTextOrNull, watchChild } from "../../../dot_pi/agent/extensions/herdr-subagent/watch.ts"

function herdrJson(args: string[]): Record<string, unknown> {
  return JSON.parse(execFileSync(herdrBin(), args, { encoding: "utf8" })) as Record<string, unknown>
}

const childExtension = fileURLToPath(new URL("../../../dot_pi/agent/extensions/herdr-subagent/child.ts", import.meta.url))
const create = herdrJson(["tab", "create", "--label", "herdr-subagent-e2e", "--no-focus", "--cwd", process.cwd()])
const result = create.result as Record<string, unknown>
const tabId = (result.tab as Record<string, string>).tab_id
const rootPane = (result.root_pane as Record<string, string>).pane_id
const base = mkdtempSync(path.join(os.tmpdir(), "hsa-e2e-"))
const paths = childPaths(base, "real")
let paneId: string | null = null

try {
  mkdirSync(paths.dir, { recursive: true })
  const task =
    "Call the subagent_report tool exactly once with result set to the single word PONG. " +
    "Use no other tool. After the tool call, stop."
  const argv = buildChildArgv({ piBin: "pi", sessionFile: paths.sessionFile, extensionPath: childExtension, task })
  paneId = await paneSplit({ cwd: base, targetPaneId: rootPane, direction: "right" })
  await paneWaitReady(paneId)
  await paneRun(paneId, buildChildCommand({ argv, reportFile: paths.reportFile, id: "real" }))

  const outcome = await watchChild(
    {
      readReport: () => readTextOrNull(paths.reportFile),
      paneExists: () => paneExists(paneId as string),
      childRunning: async () => {
        const argv = await paneForegroundArgv(paneId as string)
        return argv === null ? true : argvRunsChild(argv, paths.sessionFile)
      },
      pollIntervalMs: 1000,
      startupGraceMs: 5000,
    },
    AbortSignal.timeout(180_000),
  )

  console.log("outcome:", JSON.stringify(outcome))
  if (outcome.kind !== "done" || !outcome.result.toUpperCase().includes("PONG")) {
    console.error("e2e FAILED")
    if (paneId) {
      console.error(execFileSync(herdrBin(), ["pane", "read", paneId, "--source", "recent-unwrapped", "--lines", "60"], { encoding: "utf8" }))
    }
    process.exitCode = 1
  } else {
    await paneClose(paneId)
    console.log("e2e passed")
  }
} finally {
  if (paneId) await paneClose(paneId)
  try {
    execFileSync(herdrBin(), ["tab", "close", tabId], { encoding: "utf8" })
  } catch {
    // already gone
  }
}
