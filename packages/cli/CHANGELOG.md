# @ktlsr/assay

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
  - @ktlsr/assay-adapters@0.1.3
  - @ktlsr/assay-runner@0.1.3
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
  - @ktlsr/assay-adapters@0.1.2
  - @ktlsr/assay-runner@0.1.2
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
  - @ktlsr/assay-adapters@0.1.1
  - @ktlsr/assay-runner@0.1.1
  - @ktlsr/assay-core@0.1.1

## 0.1.0

First published release.

The `assay` command: `init`, `validate`, `run`, `report`, `compare`, `ci`, `push`. Terminal and self-contained HTML reports. Exit code 3 means nothing could be measured — deliberately not the same as failure.

Part of [Assay](https://github.com/ktlesr/assay), a CI test runner for Agent
Skills. The four packages share a version number: they are components of one
SDK and are only tested together.
