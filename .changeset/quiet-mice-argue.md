---
'@ktlsr/assay-adapters': minor
'@ktlsr/assay-runner': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay': minor
---

Trigger accuracy now measures **activation**, not the `Skill` call.

**BREAKING BEHAVIOUR CHANGE — refused activations are no longer counted as
triggers, and this changes the numbers of runs you have already recorded.**

Until 0.2.0 a `Skill` tool call was reported as a trigger the moment it
appeared in the stream. Whether the host actually loaded the skill was never
checked. In a pilot run, four recorded triggers turned out to be four refused
activations — nothing had run — and the report still said `precision 100%`.

A `Skill` call now counts as a trigger only when its matching `tool_result`
came back without an error and carried the skill body. A call that was denied,
failed, returned an empty body, or never produced a result is a **refusal**:
neither `pass` nor `fail`, but `unknown`, in every layer that reads it.

What changes for you:

- Positive cases whose activation was refused move from `fail` to `unknown`.
  They were never a skill defect; the permission layer stopped them.
- Negative cases whose activation was refused move from `pass` to `unknown`.
  This is the more dangerous direction that was being hidden: the model *did*
  reach for the skill and the report said it did not trigger.
- `precision`, `recall` and the discrimination note drop those attempts from
  the denominator instead of counting them as observations, so a run whose
  activations were all refused now reports "not measurable" instead of 100%.
- CI exit codes shift accordingly: affected runs move from `1` to `3`
  ("nothing could be measured"). Use `--allow-unknown` if that must not fail
  the pipeline while you fix the permission mode.

Also in this release:

- `--permission-mode` is now settable on `assay run` and `assay ci`. The
  default is unchanged (`acceptEdits`); it was hardcoded before, and a skill
  that declares `allowed-tools` cannot activate under that mode at all. The
  mode the host reports is written to the run record, shown in the terminal
  and HTML report, and folded into the environment hash — a skill measured
  with restricted tools and the same skill measured without them are two
  different measurements. Because the hash definition changed, runs recorded
  before 0.2.0 compare against newer runs as environment-drifted and produce
  `unknown` rather than a false verdict. `bypassPermissions` additionally
  requires `--allow-bypass-permissions`.
- `result.permission_denials` is read. The host had been reporting denied tool
  calls all along; the parser ignored them. Denied calls now carry a
  `refusal` on the trace event, so "the skill could not do it" and "Assay did
  not allow it" stop looking the same.
- `system/hook_started` and `system/hook_response` are parsed into the trace
  as `hook` events with name, event, phase, exit code, outcome, stdout and
  stderr. Hooks change what the agent sees and can block its tool calls; a
  run record that omits them cannot explain the difference between two runs.
