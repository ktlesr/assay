---
'@ktlsr/assay-runner': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay': minor
---

`--fast` measures one layer and says so.

Three attempts per case and the trigger layer only. It
answers "does this skill still fire" in minutes instead of hours, which is the
question a pull request asks. It is early warning, not evidence, and the report
leads with that: at three attempts the interval is wide enough that the run can
show a break but not a regression.

The record declares its own scope. `Run.layers` names the layers that were
measured; declared assertions that were not evaluated are listed in
`Attempt.notEvaluated` rather than counted as `unknown`, because `unknown` means
"we looked and got no signal" and nobody looked here. Cases that only declare
assertions are not run at all and appear in `Run.skipped` with the reason — a
case that never ran is not a case with N=0.

`--max-attempts <n>` caps the total attempts on any run, fast or not. Cases past
the cap are named in the record instead of being silently trimmed, and **a run
the cap cut short cannot pass**: at best it is `unknown`, and `assay ci` exits 3.
Measured on a real host before this rule existed, a cap of 3 cut every negative
case and the run passed on positives alone. A failure the run did measure still
counts. Fast mode sets no cap of its own — the cost ceiling is yours to choose.

`--repeat` still wins when both are given: fast mode is a shortcut, not a lock.
No default changes — repeat, permission mode and concurrency are what they were.

The GitHub Action gains a `fast` input, defaulting to false.
