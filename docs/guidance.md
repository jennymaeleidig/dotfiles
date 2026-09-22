# Guidance

Four words for how a rule reaches an agent: **guidance**, **recognition**,
**judgement**, **telemetry**. A rule is written once, as prose; the other three
describe the readers that may also be given it.

This is human guidance — a note for whoever writes the rules, not a rule the
agent reads. Nothing here is wired into `APPEND_SYSTEM.md`, a skill, or a guard,
and no package implements it today. Treat it as the vocabulary for deciding
where a rule goes, and see [Future paths](#future-paths) for what would carry
each reader.

## Vocabulary

**Guidance**
The rule itself, in prose, read by the model before it acts. The source term:
recognition, judgement, and telemetry are all readers of this one.
_Avoid_: prompt, policy, instruction

**Recognition**
Noticing that a rule's condition holds in the action in front of you. A reader
can recognise a rule; it cannot state one.
_Avoid_: detection, enforcement

**Judgement**
Choosing among outcomes you can enumerate, given the state. Recognition says
*this is the case*; judgement says *which of these*.
_Avoid_: reasoning, decision

**Telemetry**
Measuring, after the fact, whether the guidance worked. The only reader that
reports on the prose rather than applying it.
_Avoid_: monitoring, observability

## One rule, three readers

| Reader    | Reaches the rule                               | Timing             |
| --------- | ---------------------------------------------- | ------------------ |
| the model | an always-on line, or a skill behind a pointer | **before** it acts |
| a check   | at the tool call, before it runs               | **at** the action  |
| telemetry | a question asked of the record                 | **after** the fact |

Guidance is the source. A check never states a rule, and telemetry never applies
one, so a rule with no prose behind it has nothing to be checked or measured
against. Every authored rule names its reader; a rule you cannot place is a line
you have not pruned.

### The model reads before

Prose carries every rule, and most rules end here. The model complies rather
than being corrected, which makes prose the cheapest reader and the only one
that can shape an artifact. It is paid once, cached, and it is also the only
reader available to a session that loads nothing else.

### A check reads at

A check earns its place for a **silent** rule: one the agent would have followed
had it noticed, failing because the condition went unseen rather than because the
rule was unknown. Silent rules are the whole of a check's remit — a rule the
agent skips knowingly is a guidance problem, and guidance is the cheaper fix.

Three tests, in order; the first `no` ends it:

1. **Silent.** Did the condition go unnoticed?
2. **At hand.** Can the answer be read from the action alone — the tool call plus
   the few messages around it? A rule needing the whole transcript, or the state
   of the filesystem, is not a question this reader can answer.
3. **Enumerable.** Can you list the outcomes? An answer that is a paragraph is not
   a question.

**Artifacts are where this ends.** A citation block, a licence header, a ticket
file's shape: the model must *know* these before it writes, so they are guidance.
What remains checkable about an artifact is its shape, and a path or a pattern
settles shape without judgement.

Two checks already exist in this repo, and both are deterministic: the
`pi-sandbox-runtime` skill's filesystem and network fence, and the `cc-safety-net`
skill's guard over secrets, destructive commands, and git history.

### Telemetry reads after

A rule whose outcome you cannot confirm from the finished work — was the standard
applied, was the spec honoured — earns a question asked of the record. Telemetry
is the only reader that tells you whether the guidance worked, so ask it of the
rules that matter and leave it off the rest.

## Applied to this repo

Classifying everything now written for the agent — `APPEND_SYSTEM.md`,
`AGENTS.md`, `docs/agents/`, the seed prompts, and the skills — almost none of it
is checkable, and that is the expected result rather than a failure:

- **Guidance, and correctly so.** The heredoc/temp-file pattern, the guards-first
  triggers, the shared-worktree commit discipline, the licence and citation
  policy, the issue-tracker file shape, the domain-doc reading order, the
  coding-standards split. Each is either an artifact the model must produce or a
  procedure it must follow.
- **Deterministic, not judgement.** The issue-tracker conventions — one file per
  ticket, numbering from `01`, a `Status:` line — are paths and patterns. A check
  here is a ten-line string test, and a model would be the worse instrument.
- **Silent, and therefore a genuine check candidate.** Two rules:
  - *A borrowed or adapted block carries a citation block.* The failure is not
    knowing the policy, it is not noticing the borrow. Note that this needs the
    conversation, so it belongs in an action-scoped check, not a rules-scoped one.
  - *A change does not contradict an existing ADR.* `docs/agents/domain.md`
    already asks for conflicts to be surfaced rather than silently overridden.
    The question is negation-shaped, which is where judgement degrades, so it is
    worth measuring before trusting.
- **Telemetry candidate.** Whether the citation policy is being followed at all.
  Nothing today can answer that, which is why its failures surface late.

Two of a dozen rules is a small share, and it is worth the effort anyway: those
two fail silently and expensively, while the rest fail loudly and cheaply.

## Future paths

Three packages implement some of this. None is adopted, and none should be until
a rule qualifies under the tests above. Ordered by how much of the vocabulary
each would cover.

### pi-typesafe — judgement and telemetry

[`DevMortimer/pi-typesafe`](https://github.com/DevMortimer/pi-typesafe): a
pi-only extension plus a typed TypeScript client over Jev, TypeSafe's judgment
model (state plus typed questions in, calibrated probabilities out).

- **Serves:** *judgement* — a `typesafe_evaluate` tool taking 1–32 batched
  questions about one state, and a library surface (`ask`, `evaluateAll`,
  `evaluateMany`, `fanOut`) for extensions of your own. *Telemetry* — session and
  daily counters, a spend estimate, and `pi-typesafe/calibrate` (AUC, threshold
  sweep, replay runner).
- **Why it is first:** it is the substrate the other two build on, and it carries
  the auth work — the key lives at `~/.pi/agent/pi-typesafe/auth.json` with
  owner-only permissions, and `authState()`/`describeAuth()` make an
  enabled-but-keyless run visible instead of silently degraded.
- **Before adopting:** a session cap of 20 requests, an opt-in consent gate, and
  a 32-question / 64 KiB admission limit. A cross-backend credential fallback
  path around `client.ts:172-183` deserves a read first.

### pi-warden — recognition, plus guidance delivery and telemetry

[`DevMortimer/pi-warden`](https://github.com/DevMortimer/pi-warden): a
supervision layer on pi (eleven lifecycle hooks, eight named guards) that depends
on pi-typesafe and shares its key store. It pairs a deterministic pattern floor
with Jev judgement.

- **Serves:** *recognition* — an action guard that scores a tool call against the
  user's request and the project's rules. *Telemetry* — a hold log with outcomes
  labelled from real signals, and a standing rule that escalates after repeated
  hits. *Guidance delivery* — `sensitivePaths` notes and steers carry rule text at
  the moment of relevance, at no token cost, which is the one mechanism this repo
  currently lacks.
- **Why it is closest to the vocabulary:** it is the only one of the three that
  delivers guidance just in time as well as recognising conditions.
- **Blocking caveats for a whole-system setup:** the rules guard fires only on
  `write` and `edit`, and its state excludes the conversation, so a citation rule
  cannot be asked of it. `sensitivePaths` matches project-relative paths only
  (`rules.ts:159-164`), so host paths such as `~/.pi/agent/**` can never match. It
  is fail-open by default, and `rules.fallback` defaults to reading `AGENTS.md` as
  one aggregate rule. Its published A/B evidence is from 0.14/0.15 while the
  package is at 0.30.0, and `learning.adaptiveThresholds` is dead config.

### jev-use — recognition and judgement in an agent loop

[`shitianfang/jev-use`](https://github.com/shitianfang/jev-use): harness-agnostic
(Claude Code, Codex, pi) — an MCP server, a CLI, a PreToolUse gate, native pi
tools, and four backends.

- **Serves:** *recognition* and *judgement* inside a running loop, with an
  **escalation contract** as its distinguishing idea: every verdict carries
  `escalate` plus a typed reason (`writing`, `open_ended`, `oversized`, `unsure`,
  `unreachable`), so an unsure answer is handed back rather than acted on. Its
  CLI also routes bulk data by reference, so a codebase can be judged without
  entering the conversation.
- **Before adopting:** the gate is fail-open, and the project itself describes it
  as defence in depth rather than a sandbox. Versions are hardcoded in eleven
  places, so pin deliberately.

### What would make this agent guidance

Two steps, neither taken yet: apply the routing test when writing a rule, and
point `AGENTS.md` at this doc. Until then it is a vocabulary for the person
writing the rules.
