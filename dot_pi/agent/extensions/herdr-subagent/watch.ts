/**
 * Deciding when a child is finished, and how, then polling until it is.
 *
 * The child reports by writing a JSON sidecar (see `child.ts`). No sidecar means
 * the child has not reported; the poll then asks herdr whether the pane still
 * exists and whether pi is still its agent:
 *
 *   - pane gone            → cancelled
 *   - pane alive, pi gone  → failed (pi exited without reporting)
 *   - pane alive, pi alive → pending (hold; the user can still steer it)
 */

import { readFile } from "node:fs/promises"

export type ChildOutcome =
  | { kind: "pending" }
  | { kind: "done"; result: string }
  | { kind: "failed"; reason: string }
  | { kind: "cancelled"; reason: string }

export interface ChildReport {
  type: string
  result?: string
  reason?: string
}

export function parseReport(text: string): ChildReport | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
  const record = parsed as Record<string, unknown>
  if (typeof record.type !== "string") return null
  return {
    type: record.type,
    result: typeof record.result === "string" ? record.result : undefined,
    reason: typeof record.reason === "string" ? record.reason : undefined,
  }
}

export interface ClassifyInput {
  /** Sidecar contents, or null when the sidecar does not exist yet. */
  report: string | null
  paneExists: boolean
  childRunning: boolean
}

export function classify(input: ClassifyInput): ChildOutcome {
  if (input.report !== null) {
    const parsed = parseReport(input.report)
    if (!parsed) return { kind: "failed", reason: "the report sidecar was not valid JSON" }
    if (parsed.type === "done") return { kind: "done", result: parsed.result ?? "" }
    return { kind: "failed", reason: parsed.reason ?? `the child reported "${parsed.type}"` }
  }
  if (!input.paneExists) return { kind: "cancelled", reason: "the pane closed before the child reported" }
  if (!input.childRunning) return { kind: "failed", reason: "pi exited without calling subagent_report" }
  return { kind: "pending" }
}

export interface WatchDeps {
  readReport(): Promise<string | null>
  paneExists(): Promise<boolean>
  /** Whether pi still runs in the pane; true also when the pane cannot be read. */
  childRunning(): Promise<boolean>
  pollIntervalMs?: number
  /** How long to tolerate a not-yet-started child before calling it failed. */
  startupGraceMs?: number
}

const DEFAULT_POLL_MS = 1000
/**
 * `pane run` returns before the child pi has started, and pi only registers
 * itself with herdr once it is up, so an agentless pane is not yet a failure.
 * Measured cold start for a real child is ~3.5s.
 */
const DEFAULT_STARTUP_GRACE_MS = 5000

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      resolve()
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

/** Poll until the child settles or the watcher is aborted. */
export async function watchChild(deps: WatchDeps, signal?: AbortSignal): Promise<ChildOutcome> {
  const startedAt = Date.now()
  const graceMs = deps.startupGraceMs ?? DEFAULT_STARTUP_GRACE_MS
  for (;;) {
    if (signal?.aborted) return { kind: "cancelled", reason: "watcher aborted" }
    const report = await deps.readReport()
    let outcome: ChildOutcome
    if (report !== null) {
      outcome = classify({ report, paneExists: true, childRunning: true })
    } else {
      const paneAlive = await deps.paneExists()
      const running = paneAlive ? await deps.childRunning() : false
      // `pane run` returns before pi has exec'd, so treat the startup window as
      // running; only after the grace does a silent child mean pi never started.
      const withinGrace = Date.now() - startedAt < graceMs
      outcome = classify({ report: null, paneExists: paneAlive, childRunning: running || withinGrace })
    }
    if (outcome.kind !== "pending") return outcome
    await delay(deps.pollIntervalMs ?? DEFAULT_POLL_MS, signal)
  }
}

export interface BatchEntry {
  name: string
  outcome: ChildOutcome
}

/** One labelled message for a finished batch. */
export function formatBatch(entries: BatchEntry[]): string {
  const lines = entries.map((entry) => {
    const outcome = entry.outcome
    switch (outcome.kind) {
      case "done":
        return `- **${entry.name}** — ${outcome.result || "(reported no content)"}`
      case "failed":
        return `- **${entry.name}** — failed: ${outcome.reason}`
      case "cancelled":
        return `- **${entry.name}** — cancelled: ${outcome.reason}`
      case "pending":
        return `- **${entry.name}** — still running`
    }
  })
  const heading = entries.length === 1 ? "Subagent result:" : "Subagent results:"
  return [heading, ...lines].join("\n")
}

/** Read a file, treating any failure (including "not there yet") as absent. */
export async function readTextOrNull(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8")
  } catch {
    return null
  }
}
