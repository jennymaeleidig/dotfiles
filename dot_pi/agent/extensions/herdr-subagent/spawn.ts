/**
 * The launch recipe: artifact paths, the child's argv, shell quoting, and the
 * exact command a child pane runs.
 *
 * Pure — no herdr and no pi imports — so it can be exercised on its own, and so
 * the one subtle part (quoting a task that may contain newlines) has a test.
 */

import * as os from "node:os"
import * as path from "node:path"

export interface ChildPaths {
  /** Per-child directory, holding the session file and the report sidecar. */
  dir: string
  /** Passed to the child as `--session`. */
  sessionFile: string
  /** Where the child's `subagent_report` writes its result. */
  reportFile: string
}

export function childPaths(baseDir: string, id: string): ChildPaths {
  const dir = path.join(baseDir, id)
  return {
    dir,
    sessionFile: path.join(dir, "session.jsonl"),
    reportFile: path.join(dir, "report.json"),
  }
}

/** Sortable, collision-resistant id for one child run. */
export function runId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0x1000000).toString(36)}`
}

/**
 * Quote one word for the child pane's shell.
 *
 * A raw newline, carriage return or tab would be read as Enter by the pane's
 * terminal and submit the command early, so those force bash's `$'…'` form and
 * are transmitted as backslash escapes. Everything else uses plain single
 * quotes. The task is deliberately left visible on the command line (`ps`).
 */
export function shellQuote(value: string): string {
  if (/[\n\r\t]/.test(value)) {
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
    return `$'${escaped}'`
  }
  return `'${value.replace(/'/g, "'\\''")}'`
}

export interface ChildArgvOptions {
  piBin: string
  sessionFile: string
  extensionPath: string
  task: string
  model?: string | null
  thinking?: string | null
}

/** The child's pi argv: session, the report extension, optional overrides, task. */
export function buildChildArgv(opts: ChildArgvOptions): string[] {
  const argv = [opts.piBin, "--session", opts.sessionFile, "-e", opts.extensionPath]
  if (opts.model) argv.push("--model", opts.model)
  if (opts.thinking) argv.push("--thinking", opts.thinking)
  argv.push(opts.task)
  return argv
}

export interface ChildCommandOptions {
  argv: string[]
  reportFile: string
  id: string
}

/**
 * The single line a pane runs: the two sidecar variables as an inline prefix,
 * then the quoted argv. Inline assignments rather than `pane split --env` keep
 * the launch identical to a human typing it — the rest of the environment comes
 * from the pane's login shell.
 */
export function buildChildCommand(opts: ChildCommandOptions): string {
  const envPrefix = [
    `PI_SUBAGENT_REPORT=${shellQuote(opts.reportFile)}`,
    `PI_SUBAGENT_ID=${shellQuote(opts.id)}`,
  ].join(" ")
  return `${envPrefix} ${opts.argv.map(shellQuote).join(" ")}`
}

/** Where child artifacts live when no override is supplied. */
export function defaultBaseDir(): string {
  return path.join(os.tmpdir(), "pi-herdr-subagent")
}
