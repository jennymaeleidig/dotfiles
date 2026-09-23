import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import {
  buildReadinessProbe,
  extractAgent,
  extractPaneId,
  isInsideHerdr,
  parseHerdrJson,
  unwrap,
} from "../../../dot_pi/agent/extensions/herdr-subagent/herdr.ts"

test("unwrap flattens herdr's envelope and passes bare objects through", () => {
  assert.deepEqual(unwrap({ id: "cli:x", result: { pane: { pane_id: "w1:p9" } } }), {
    pane: { pane_id: "w1:p9" },
  })
  assert.deepEqual(unwrap({ running: true }), { running: true })
})

test("parseHerdrJson reads an enveloped body and rejects junk", () => {
  assert.deepEqual(parseHerdrJson('{"id":"cli:x","result":{"pane_id":"w1:p9"}}'), { pane_id: "w1:p9" })
  assert.equal(parseHerdrJson("not json"), null)
  assert.equal(parseHerdrJson(""), null)
  assert.equal(parseHerdrJson("[1,2,3]"), null)
})

test("extractPaneId reads the split result", () => {
  assert.equal(extractPaneId({ pane: { pane_id: "w4:pF" } }), "w4:pF")
  assert.equal(extractPaneId({ pane: {} }), null)
  assert.equal(extractPaneId({}), null)
})

test("extractAgent reads the pane's agent and tolerates its absence", () => {
  assert.equal(extractAgent({ pane: { agent: "pi", agent_status: "working" } }), "pi")
  assert.equal(extractAgent({ pane: { agent: "pi", agent_status: "idle" } }), "pi")
  assert.equal(extractAgent({ pane: { agent_status: "unknown" } }), null)
  assert.equal(extractAgent({ pane: {} }), null)
  assert.equal(extractAgent({}), null)
})

test("isInsideHerdr requires the env herdr injects into a managed pane", () => {
  assert.equal(isInsideHerdr({ HERDR_ENV: "1", HERDR_PANE_ID: "w1:p1", HERDR_SOCKET_PATH: "/s" }), true)
  assert.equal(isInsideHerdr({ HERDR_ENV: "1", HERDR_PANE_ID: "w1:p1" }), false)
  assert.equal(isInsideHerdr({}), false)
})

test("the readiness probe prints its marker without containing it in the command text", () => {
  const marker = "hsa_ready_ab12"
  const probe = buildReadinessProbe(marker)
  assert.equal(probe.includes(marker), false)
  const printed = execFileSync("bash", ["-c", probe], { encoding: "utf8" })
  assert.equal(printed.trim(), marker)
})
