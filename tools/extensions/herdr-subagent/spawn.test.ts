import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import {
  buildChildArgv,
  buildChildCommand,
  childPaths,
  shellQuote,
} from "../../../dot_pi/agent/extensions/herdr-subagent/spawn.ts"

/** The strongest check for quoting: the real shell must hand back exactly what went in. */
function throughBash(value: string): string {
  return execFileSync("bash", ["-c", `printf '%s' ${shellQuote(value)}`], { encoding: "utf8" })
}

test("shellQuote survives a round trip through bash", () => {
  const samples = [
    "plain",
    "it's got quotes",
    "double \"quotes\" and $VARS and `backticks`",
    "line one\nline two\nline three",
    "tab\tseparated",
    "trailing newline\n",
    "back\\slash",
    "semi; pipes | and && chains",
    "",
  ]
  for (const sample of samples) {
    assert.equal(throughBash(sample), sample, `round trip failed for ${JSON.stringify(sample)}`)
  }
})

test("shellQuote uses ANSI-C quoting only when a raw control character would submit early", () => {
  assert.equal(shellQuote("plain"), "'plain'")
  assert.equal(shellQuote("it's"), "'it'\\''s'")
  assert.equal(shellQuote("a\nb"), "$'a\\nb'")
})

test("buildChildArgv orders session, extension, overrides, then the task", () => {
  assert.deepEqual(
    buildChildArgv({
      piBin: "pi",
      sessionFile: "/tmp/s.jsonl",
      extensionPath: "/x/child.ts",
      task: "do it",
      model: "deepseek/deepseek-flash",
      thinking: "low",
    }),
    [
      "pi",
      "--session",
      "/tmp/s.jsonl",
      "-e",
      "/x/child.ts",
      "--model",
      "deepseek/deepseek-flash",
      "--thinking",
      "low",
      "do it",
    ],
  )
})

test("buildChildArgv omits overrides that were not supplied", () => {
  assert.deepEqual(
    buildChildArgv({ piBin: "pi", sessionFile: "/s", extensionPath: "/c", task: "t" }),
    ["pi", "--session", "/s", "-e", "/c", "t"],
  )
})

test("buildChildCommand prefixes the sidecar variables and quotes the argv", () => {
  const command = buildChildCommand({
    argv: ["pi", "--session", "/tmp/s.jsonl", "-e", "/c", "hello world"],
    reportFile: "/tmp/report.json",
    id: "abc",
  })
  assert.equal(
    command,
    "PI_SUBAGENT_REPORT='/tmp/report.json' PI_SUBAGENT_ID='abc' 'pi' '--session' '/tmp/s.jsonl' '-e' '/c' 'hello world'",
  )
})

test("childPaths keeps the session and report side by side", () => {
  const paths = childPaths("/base", "id1")
  assert.equal(paths.dir, "/base/id1")
  assert.equal(paths.sessionFile, "/base/id1/session.jsonl")
  assert.equal(paths.reportFile, "/base/id1/report.json")
})
