---
'@ktlsr/assay-runner': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay-adapters': minor
'@ktlsr/assay': minor
---

Collision suites: say which skill should win, and see who did.

A suite has one `target.skill`, and until now a collision case, one aimed at a
different co-installed skill, could only list the skills that must *not*
fire. A run where nothing fires satisfies that. Measured on a real
200-attempt collision run: Assay reported 179 pass / 21 fail while 7 of 13
skills never fired on their own cases, and 100 positive attempts in which no
skill fired were scored as pass.

- **`expect.winner`**: `winner: <skill>` means that skill should be the first
  confirmed activation; `winner: [a, b]` passes if either is first (a contested
  case); `winner: none` means no active skill should fire, and counts as a
  negative for the "every trigger suite needs a negative case" rule.
- **Nothing fired is a fail, not unknown.** The signal was read and the
  expected skill did not fire; that is a measurement. A different skill firing
  first is also a fail, and the reason names who won. Unknown is kept for runs
  where the result genuinely cannot be known.
- **Collision matrix** in the terminal and HTML reports: expected winner ×
  first skill to fire, with each row's win rate given with N and a 95%
  interval. It sits above the trigger accuracy, which is now labelled
  "target only".
- **Case ids accept hyphens** (`collide.copy-editing.tighten`), and an invalid
  id says which character is the problem.
- A case that only lists `not_triggered` gets a warning that it also passes
  when no skill fires.

Existing suites keep working unchanged apart from that warning. Re-scored with
the new schema, the real run above becomes 79 pass / 121 fail, and its matrix
matches the hand-built analysis cell for cell.
