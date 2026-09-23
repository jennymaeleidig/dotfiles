/**
 * The herdr CLI, as this extension uses it.
 *
 * Every call is a subprocess of the orchestrator's pi, not a Tool, so it sits
 * outside the sandbox fence — which is the point: the fence is about what the
 * *agent* runs, not what an extension does to manage panes.
 *
 * herdr prints an `{"id":…,"result":{…}}` envelope for most commands, so
 * {@link unwrap} flattens it. The parsing helpers are pure and tested; the
 * spawn helpers below them are thin.
 */

import { execFile } from "node:child_process"
import { shellQuote } from "./spawn.ts"

export function isInsideHerdr(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.HERDR_ENV === "1" && Boolean(env.HERDR_PANE_ID) && Boolean(env.HERDR_SOCKET_PATH)
}

export function currentPaneId(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.HERDR_PANE_ID || null
}

export function herdrBin(env: NodeJS.ProcessEnv = process.env): string {
  return env.HERDR_BIN_PATH || "herdr"
}

interface RawResult {
  code: number
  stdout: string
  stderr: string
}

function runHerdrRaw(args: string[], timeoutMs = 15_000): Promise<RawResult> {
  return new Promise((resolve, reject) => {
    execFile(
      herdrBin(),
      args,
      { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 },
      (error, stdout, stderr) => {
        // A numeric `code` is an exit status we can interpret; anything else
        // (ENOENT, a timeout kill) means herdr never answered at all.
        const code = (error as { code?: unknown } | null)?.code
        if (error && typeof code !== "number") {
          reject(error)
          return
        }
        resolve({ code: typeof code === "number" ? code : 0, stdout, stderr })
      },
    )
  })
}

/** Flatten herdr's `{id, result}` envelope; bare objects pass through. */
export function unwrap(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    if (typeof record.id === "string" && record.result && typeof record.result === "object") {
      return record.result
    }
  }
  return value
}

/** Parse one JSON body, unwrapped, or null if it is not a JSON object. */
export function parseHerdrJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }
  const body = unwrap(parsed)
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null
}

export async function runHerdr(args: string[], timeoutMs?: number): Promise<string> {
  const result = await runHerdrRaw(args, timeoutMs)
  if (result.code !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`
    throw new Error(`herdr ${args.join(" ")} failed: ${detail}`)
  }
  return result.stdout
}

async function runHerdrJson(args: string[], timeoutMs?: number): Promise<Record<string, unknown>> {
  const body = parseHerdrJson(await runHerdr(args, timeoutMs))
  if (!body) throw new Error(`herdr ${args.join(" ")} did not return JSON.`)
  return body
}

/** The pane id inside a `pane split` result body. */
export function extractPaneId(splitBody: Record<string, unknown>): string | null {
  const pane = splitBody.pane
  if (!pane || typeof pane !== "object") return null
  const paneId = (pane as Record<string, unknown>).pane_id
  return typeof paneId === "string" ? paneId : null
}

/**
 * The agent herdr associates with a pane, from a `pane get` result body.
 *
 * pi registers itself with herdr, so a live child is this field being "pi" —
 * `working` or `idle` after a turn, but still pi. It is why liveness cannot be
 * read from the process list: herdr does not publish a node child's argv.
 */
export function extractAgent(paneBody: Record<string, unknown>): string | null {
  const pane = paneBody.pane
  if (!pane || typeof pane !== "object") return null
  const agent = (pane as Record<string, unknown>).agent
  return typeof agent === "string" ? agent : null
}

export interface PaneSplitOptions {
  cwd: string
  /** Split from this pane; the caller's own pane when null. */
  targetPaneId: string | null
  direction: "right" | "down"
  focus?: boolean
}

/** Open a real shell pane and return its id. */
export async function paneSplit(opts: PaneSplitOptions): Promise<string> {
  const args = ["pane", "split"]
  args.push(opts.targetPaneId ?? "--current")
  args.push("--direction", opts.direction, "--cwd", opts.cwd)
  args.push(opts.focus ? "--focus" : "--no-focus")
  const paneId = extractPaneId(await runHerdrJson(args))
  if (!paneId) throw new Error("herdr pane split returned no pane id")
  return paneId
}

/** Type a command into a pane's shell and submit it. */
export async function paneRun(paneId: string, command: string): Promise<void> {
  await runHerdr(["pane", "run", paneId, command])
}

/**
 * Wait until a freshly split pane's shell is actually reading input.
 *
 * `pane split` returns before the login shell has finished its rc files, and a
 * `pane run` sent in that window is lost (not queued). So we type a probe whose
 * *output* differs from its command text — so the echo cannot match — and wait
 * for that output. Lost probes are harmless; once the shell is up, one lands.
 */
export async function paneWaitReady(paneId: string, timeoutMs = 10_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const marker = `hsa_ready_${Math.random().toString(36).slice(2, 8)}`
    try {
      await paneRun(paneId, buildReadinessProbe(marker))
      await runHerdr(["pane", "wait-output", paneId, "--match", marker, "--timeout", "600"])
      return true
    } catch {
      // Startup ate it; the next probe will land once the shell is ready.
    }
  }
  return false
}

/**
 * A probe that prints `marker` without ever containing it in the command text,
 * so matching the shell's echo of the command cannot be mistaken for its output.
 */
export function buildReadinessProbe(marker: string): string {
  const head = marker.slice(0, -3)
  const tail = marker.slice(-3)
  return `printf '%s%s\\n' ${shellQuote(head)} ${shellQuote(tail)}`
}

export async function paneRename(paneId: string, label: string): Promise<boolean> {
  try {
    await runHerdr(["pane", "rename", paneId, label])
    return true
  } catch {
    return false
  }
}

export async function paneClose(paneId: string): Promise<boolean> {
  try {
    await runHerdr(["pane", "close", paneId])
    return true
  } catch {
    return false
  }
}

/** Whether the pane still exists. A missing pane is a normal outcome, not an error. */
export async function paneExists(paneId: string): Promise<boolean> {
  try {
    await runHerdrJson(["pane", "get", paneId])
    return true
  } catch {
    return false
  }
}

/**
 * Whether pi is still running in the pane.
 *
 * A pane herdr cannot read counts as running, so a child is never called dead
 * on herdr's silence; only a readable, agentless pane earns a false.
 */
export async function paneRunsAgent(paneId: string, agent = "pi"): Promise<boolean> {
  try {
    return extractAgent(await runHerdrJson(["pane", "get", paneId])) === agent
  } catch {
    return true
  }
}
