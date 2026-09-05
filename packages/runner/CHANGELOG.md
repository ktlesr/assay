# @ktlsr/assay-runner

## 0.2.0

### Minor Changes

- f8b2d63: Trigger accuracy now measures **activation**, not the `Skill` call.
  
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

### Patch Changes

- Updated dependencies [f8b2d63]
  - @ktlsr/assay-core@0.2.0

## 0.1.3

### Patch Changes

- A run that never happened now reports `unknown` on every layer, not `fail`.
  
  **BEHAVIOUR CHANGE — read this before upgrading.** Runs that report `fail`
  today will report `unknown` after this release, and the CI exit code moves
  from **1** to **3**. If your pipeline treats those codes differently — and it
  should — this changes which branch you take. `assay ci --allow-unknown` turns
  exit 3 back into 0 if you want the old pass-through behaviour.
  
  **What was wrong.** When the host could not open a session at all — a revoked
  token, a process that failed to start, a session whose `terminal_reason` was
  not `completed` — the same event produced three different verdicts in one
  attempt:
  
  | Layer | Before | After |
  |---|---|---|
  | Trigger | `unknown` | `unknown` |
  | `file_exists`, `file_valid`, `json_schema`, `file_content_matches` | **`fail`** | `unknown` |
  | `side_effect` | **`pass`** | `unknown` |
  
  Nothing was measured, yet one layer called it a failure and another called it
  a success. The `fail` sends you looking for a broken skill when the problem is
  a credential. The `pass` is worse: it is the silent pass the three-state
  verdict exists to prevent, and nobody investigates a green result.
  
  **Why it happened.** The trigger layer consulted the session's outcome; the
  assertion layer did not. With no session, the sandbox working directory stayed
  untouched, so evidence collection returned an *empty* file list rather than no
  file list at all. The dispatch guard only checks whether an evidence field is
  `undefined`, and an empty array is not undefined — so the assertions ran
  against a workspace that was never used. The same applied to the environment
  diff, where "no writes recorded" read as "the boundary held".
  
  **The fix.** When the session fails its cross-check, the runner now collects no
  evidence at all rather than empty evidence. No new mechanism was added: the
  existing guard already returns `unknown` for a missing evidence field, it was
  simply never shown the truth. The trace is still recorded in the run record for
  diagnosis; it is just not offered to assertions as evidence.
  
  **What did not change.** An agent that genuinely ran, completed, and wrote
  nothing still reports `fail` on `file_exists`. That distinction is the point —
  there the measurement is real, and turning it into `unknown` would lose exactly
  what this tool exists to detect. Both directions are covered by tests.
- Updated dependencies
  - @ktlsr/assay-core@0.1.3

## 0.1.2

### Patch Changes

- Mask home-directory paths, add `assay scrub`, and stop counting an unread pin as held.
  
  **Home-directory paths are masked.** Run records carry absolute paths from the
  agent's tool calls, and those paths carry the operating system username.
  Records are uploaded as CI artifacts, printed into the HTML report and can be
  published to a hosted instance — so a skill author sharing a run was sharing
  their machine's username. `C:\Users\ada\...` now becomes
  `C:\Users\<user>\...`; macOS and Linux home directories are covered too, and
  generic accounts like `runner` and `root` are left alone because they are not
  identities. The path shape survives, so the trace stays readable as a
  measurement; only the identity is removed.
  
  Masking runs at three points, not one: when a record is written, when it is
  read back, and when the HTML report escapes a value. Write-time alone would
  only protect records created after this release.
  
  **New: `assay scrub [dir]`.** Rewrites stored records in place through the
  same masking. A record store is a set of files, not a display surface — CI
  uploads it, people zip it and attach it to bug reports. The bytes need to be
  clean when they leave the machine, not when they are rendered. The GitHub
  Action runs this before uploading its artifact.
  
  **`comparePins` now reports a third state.** A pin whose value is a
  placeholder (`not-provided-by-host`, or empty) is no longer counted as *held*.
  Two runs both carrying the same placeholder were being treated as measured
  under identical conditions, which handed the comparison a guarantee nobody had
  made. Such a pin is now reported as `unavailable`, and a comparison resting on
  one returns `unknown`.
  
  To keep comparison working on hosts that do not publish a system prompt hash,
  `Pins` gained an optional `environmentHash`: the adapter already derived it
  from the host's reported environment but the runner never stored it. When both
  runs carry an equal environment hash, pin 3 counts as covered and the
  comparison proceeds.
  
  Note for existing users: runs recorded before this release have no environment
  hash, so comparing two of them now returns `unknown` rather than a verdict.
  That is the truthful answer — for those runs it genuinely is not known whether
  the host environment held.
- Updated dependencies
  - @ktlsr/assay-core@0.1.2

## 0.1.1

### Patch Changes

- 33a4c2b: Report when no negative case broke, and stop `init` crashing on a directory
  
  Both defects were found by running the published 0.1.0 against real skills
  from `anthropics/skills` (see `docs/measurements.md`).
  
  **`assay init` now rejects a directory instead of throwing.** The help text
  described the argument as a path next to a skill, but it is the suite *file*
  to write; passing a directory reached `writeFile` and surfaced an uncaught
  `EISDIR` with a Node stack trace, while every other usage error returns exit 2
  with one line. `init` now checks first and prints
  `error <path> is a directory; pass the suite file to write, ...`. The usage
  line reads `assay init [file]  write an example suite file`.
  
  **Reports now flag a trigger suite whose negatives never broke.**
  `RunSummary` carries a new `discrimination` field — `cases`, `attempts`,
  `falsePositives`, `untested` — and the terminal and HTML reports print a
  **no negative case broke** note with the negative case and attempt counts
  behind it.
  
  This matters because a clean sheet has two causes that look identical: the
  skill discriminates, or the case set never tested it. Measuring one skill
  twice with the same model and the same pins produced 100% and 51% trigger
  precision; the entire difference was how the negatives were built. The note
  says which reading a green result supports.
  
  It is a note, not a verdict: it never changes `verdict` or the exit code, it
  appears on failing runs whose negatives all held, and it disappears as soon as
  one negative leaks. Attempts whose trigger signal was unreadable are excluded
  — an unmeasured negative cannot show discrimination either way.
- Updated dependencies [33a4c2b]
  - @ktlsr/assay-core@0.1.1

## 0.1.0

First published release.

Sandboxed run execution, per-attempt workspace with before/after capture, and a versioned local run store under `.assay/runs/`. `MockAdapter` is exported from the `./testing` subpath only.

Part of [Assay](https://github.com/ktlesr/assay), a CI test runner for Agent
Skills. The four packages share a version number: they are components of one
SDK and are only tested together.
