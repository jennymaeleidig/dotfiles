import { test } from "node:test"
import assert from "node:assert/strict"
import {
  classify,
  formatBatch,
  parseReport,
  watchChild,
} from "../../../dot_pi/agent/extensions/herdr-subagent/watch.ts"

test("classify: a done report wins regardless of process state", () => {
  assert.deepEqual(
    classify({ report: '{"type":"done","result":"hi"}', paneExists: false, childRunning: false }),
    { kind: "done", result: "hi" },
  )
})

test("classify: a malformed sidecar is a failure, not a hold", () => {
  const outcome = classify({ report: "{not json", paneExists: true, childRunning: true })
  assert.equal(outcome.kind, "failed")
})

test("classify: a gone pane is cancelled", () => {
  assert.equal(classify({ report: null, paneExists: false, childRunning: false }).kind, "cancelled")
})

test("classify: pi gone while the pane lives is a failure", () => {
  const outcome = classify({ report: null, paneExists: true, childRunning: false })
  assert.deepEqual(outcome, { kind: "failed", reason: "pi exited without calling subagent_report" })
})

test("classify: a live, silent child holds", () => {
  assert.equal(classify({ report: null, paneExists: true, childRunning: true }).kind, "pending")
})

test("parseReport accepts only an object with a string type", () => {
  assert.deepEqual(parseReport('{"type":"done","result":"x"}'), { type: "done", result: "x", reason: undefined })
  assert.equal(parseReport('{"result":"x"}'), null)
  assert.equal(parseReport("null"), null)
})

test("watchChild polls past pending states until the child reports", async () => {
  let reportChecks = 0
  const outcome = await watchChild({
    readReport: async () => {
      reportChecks += 1
      return reportChecks < 3 ? null : '{"type":"done","result":"late"}'
    },
    paneExists: async () => true,
    childRunning: async () => true,
    pollIntervalMs: 1,
  })
  assert.deepEqual(outcome, { kind: "done", result: "late" })
  assert.equal(reportChecks, 3)
})

test("watchChild tolerates the startup window before calling a silent child failed", async () => {
  let checks = 0
  const outcome = await watchChild({
    readReport: async () => null,
    paneExists: async () => true,
    childRunning: async () => {
      checks += 1
      return false
    },
    pollIntervalMs: 1,
    startupGraceMs: 8,
  })
  assert.equal(outcome.kind, "failed")
  assert.ok(checks >= 2, `expected more than one poll during the grace window, saw ${checks}`)
})

test("watchChild returns cancelled when aborted", async () => {
  const controller = new AbortController()
  controller.abort()
  const outcome = await watchChild(
    { readReport: async () => null, paneExists: async () => true, childRunning: async () => true },
    controller.signal,
  )
  assert.equal(outcome.kind, "cancelled")
})

test("formatBatch labels a single result and a whole batch", () => {
  assert.match(formatBatch([{ name: "scout", outcome: { kind: "done", result: "found it" } }]), /^Subagent result:/)
  const batch = formatBatch([
    { name: "a", outcome: { kind: "done", result: "one" } },
    { name: "b", outcome: { kind: "failed", reason: "bad key" } },
  ])
  assert.match(batch, /^Subagent results:/)
  assert.match(batch, /- \*\*a\*\* — one/)
  assert.match(batch, /- \*\*b\*\* — failed: bad key/)
})
