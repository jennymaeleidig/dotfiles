/**
 * Integration smoke for the herdr-subagent transport. Needs a live herdr
 * session (HERDR_ENV=1). Run from this directory:
 *
 *   node smoke.ts
 *
 * It creates a throwaway tab, splits a real shell pane off it, runs a stand-in
 * child through `buildChildCommand`, and drives the real watcher. Nothing in the
 * user's current tab is touched; the tab is closed in a finally.
 */

import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import {
  herdrBin,
  paneClose,
  paneExists,
  paneRun,
  paneRunsAgent,
  paneSplit,
  paneWaitReady,
} from "../../../dot_pi/agent/extensions/herdr-subagent/herdr.ts"
import { buildChildArgv, buildChildCommand, childPaths } from "../../../dot_pi/agent/extensions/herdr-subagent/spawn.ts"
import { readTextOrNull, watchChild } from "../../../dot_pi/agent/extensions/herdr-subagent/watch.ts"

function herdrJson(args: string[]): Record<string, unknown> {
  return JSON.parse(execFileSync(herdrBin(), args, { encoding: "utf8" })) as Record<string, unknown>
}

function check(condition: boolean, label: string): void {
  if (!condition) throw new Error(`smoke failed: ${label}`)
  console.log(`  ok  ${label}`)
}

const create = herdrJson(["tab", "create", "--label", "herdr-subagent-smoke", "--no-focus", "--cwd", process.cwd()])
const result = create.result as Record<string, unknown>
const tabId = (result.tab as Record<string, string>).tab_id
const rootPane = (result.root_pane as Record<string, string>).pane_id
const fake = fileURLToPath(new URL("./fake-child.sh", import.meta.url))
const base = mkdtempSync(path.join(os.tmpdir(), "hsa-smoke-"))
const panes: string[] = []

const watchDeps = (paneId: string, sessionFile: string) => ({
  readReport: () => readTextOrNull(pathsFor(sessionFile).reportFile),
  paneExists: () => paneExists(paneId),
  childRunning: () => paneRunsAgent(paneId),
  pollIntervalMs: 100,
  startupGraceMs: 500,
})

/** report file is `session.jsonl`'s sibling `report.json`. */
function pathsFor(sessionFile: string) {
  const dir = path.dirname(sessionFile)
  return { reportFile: path.join(dir, "report.json") }
}

try {
  // ── A reporting child, handed a multi-line task with hostile characters ──
  const task = "line one\nit's got 'quotes' and \"doubles\"\n$VARS `backticks` \\slash\nlast line\n" + "abcdefghij".repeat(400)
  const pathsA = childPaths(base, "a")
  mkdirSync(pathsA.dir, { recursive: true })
  const argvA = buildChildArgv({
    piBin: fake,
    sessionFile: pathsA.sessionFile,
    extensionPath: fake,
    task,
  })
  const paneA = await paneSplit({ cwd: base, targetPaneId: rootPane, direction: "right" })
  panes.push(paneA)
  await paneWaitReady(paneA)
  await paneRun(paneA, buildChildCommand({ argv: argvA, reportFile: pathsA.reportFile, id: "a" }))

  const outcomeA = await watchChild(watchDeps(paneA, pathsA.sessionFile), AbortSignal.timeout(15_000))
  check(outcomeA.kind === "done", `reporting child classified as done (got ${outcomeA.kind})`)
  check(outcomeA.kind === "done" && outcomeA.result === "smoke ok", "report payload round-tripped")
  check(readFileSync(`${pathsA.reportFile}.task`, "utf8") === task, "multi-line task arrived byte-identical")
  await paneClose(paneA)
  check(!(await paneExists(paneA)), "reported pane was closed")

  // ── A child that exits without reporting ────────────────────────────────
  const pathsB = childPaths(base, "b")
  mkdirSync(pathsB.dir, { recursive: true })
  const argvB = buildChildArgv({ piBin: "true", sessionFile: pathsB.sessionFile, extensionPath: fake, task: "silent" })
  const paneB = await paneSplit({ cwd: base, targetPaneId: rootPane, direction: "down" })
  panes.push(paneB)
  await paneWaitReady(paneB)
  await paneRun(paneB, buildChildCommand({ argv: argvB, reportFile: pathsB.reportFile, id: "b" }))

  const outcomeB = await watchChild(watchDeps(paneB, pathsB.sessionFile), AbortSignal.timeout(15_000))
  check(outcomeB.kind === "failed", `silent child classified as failed (got ${outcomeB.kind})`)
  check(await paneExists(paneB), "failed pane was left open for inspection")

  console.log("smoke passed")
} finally {
  for (const pane of panes) await paneClose(pane)
  try {
    execFileSync(herdrBin(), ["tab", "close", tabId], { encoding: "utf8" })
  } catch {
    // The tab is already gone if herdr closed it with its last pane.
  }
}
