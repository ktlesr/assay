# @ktlsr/assay-adapters

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

The Claude Code adapter. Each attempt runs in an isolated `CLAUDE_CONFIG_DIR` with an allowlisted environment, and the host's own success report is cross-checked before a session counts as complete.

Part of [Assay](https://github.com/ktlesr/assay), a CI test runner for Agent
Skills. The four packages share a version number: they are components of one
SDK and are only tested together.
