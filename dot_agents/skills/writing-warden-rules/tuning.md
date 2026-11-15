# Tuning a warden rule

Tune from evidence, and change one lever at a time. A rewrite that changes wording, scope, and threshold together teaches you nothing about which one fixed the rule.

These are session commands; ask the user to run one when you cannot.

## Read the evidence

| Command | What it tells you |
| --- | --- |
| `/warden report [--days N]` | Local verdicts for this project: per rule, judged count, fires, fired rate, cleared-after-fire count, mean score. Flags `never fires` (20+ judgments and no fire), `fires on everything` (fired rate above 50%), and `undecided` (more than half the scores between 0.3 and 0.5). |
| `/warden rules calibrate` | Replays recent commits through the live questions. Same flags, but a rule with no fire in the sample says `no violation in sample` and is not flagged. Writes its scores to the local log with `source: "calibrate"`. |
| `/warden rules check` | Judges the rule's shape: `from_change_alone` is healthy; `needs_other_files`, `needs_task_or_history`, and `too_vague` need a rewrite; `mechanical` at 0.70 means a linter could enforce it. |
| `/warden rules audit [paths...]` | Judges existing files as if each had just been written. Use it when a rule is silent and you need to know whether a file that should violate it scores. |

`/warden report` reads local records only. `calibrate` and `audit` send redacted content after a confirmation dialog; a headless run needs `--yes`.

## Diagnose

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `fires on everything` | The tripwire is a topic, not a shape, or the scope is too wide | Name the exact symbol or structure, add the exempting shape, then narrow `paths:` |
| `undecided` | The rule admits two readings, or the body never says what is allowed | State the violation and the near-miss in one sentence each; split unrelated shapes into separate rules |
| `never fires` | The rule is well followed, or it cannot be judged from the changed content | Do not delete or rewrite it for this flag alone. Audit a file that should violate it; if it cannot see the change, move it to `when: turn` |
| `needs_other_files` | The rule requires a second file to decide | Rewrite it as a local signal in the changed file, or move the cross-file property to a `when: turn` rule |
| `needs_task_or_history` | The rule needs intent the judge is not given on an edit | Use a `when: turn` rule if the task and diff are enough; otherwise it is not a warden rule |
| `too_vague` | No concrete violating shape | Add a tripwire and a near-miss, or delete the rule |
| `mechanical` | A standard linter, formatter, or type checker already decides it | Move it to that tool |

## Change in this order

1. **Sharpen the tripwire.** Name the exact symbol, structure, or omission. Add the allowed lookalike.
2. **Narrow the scope.** Add or tighten `paths:`. A scoped rule competes only for the files it concerns.
3. **Move the surface.** If one edit cannot show the violation, use `when: turn`. If a linter decides it, remove it.
4. **Adjust `threshold:` last.** Raising a cutoff suppresses false alarms but costs true catches. The measured example: a boolean-name rule produced every false alarm at 0.7; `threshold: 0.9` removed them but dropped recall from 0.865 to 0.750. Sharpen the wording first.

`severity:` orders findings; it does not decide whether a rule fires. Use it to put real breakage above style nits, not to silence a rule.

After each change, re-run `/warden rules` for parse warnings, then the command that produced the evidence. Keep `source:` when the rule came from an instruction line, and keep the heading stable unless the rule itself changed.
