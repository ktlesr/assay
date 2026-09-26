---
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
'@ktlsr/assay': patch
---

Refuse to compare runs whose context was never measured

An instruction file loaded into the agent's context changes what the model
sees, so it is a condition of the measurement. Until now no pin carried it: a
phrase-binding experiment ran five arms that differed only in the contents of a
`CLAUDE.md`, and `compare` called three of them `within_noise` — asserting they
were measured under the same conditions when they were not.

`Pins.contextHash` closes that. It is derived from the instruction files the
host reports loading (0.4.5's `Environment.memory`), so it hashes their paths
**and their contents**, and it has three states: absent means the context was
never measured, an empty set hashes to its own value, and any difference in the
files moves the pin. Absent stops a comparison, the same way any missing pin
does — invariant #2 does not distinguish "drifted" from "never measured".

**Behaviour change.** Two runs are no longer comparable unless both measured
their context, so no record written before 0.4.5 compares with anything, and
`assay compare` returns exit code 3 where it used to return 0 or 1. That is the
honest answer: in those runs what entered the context was not measured, and on
Windows something did.

`memory` also leaves the environment hash, where 0.4.5 had put it. It reported
a context change as "the environment record changed" — the right refusal at the
wrong address. One condition, one pin. Runs recorded by 0.4.5 through 0.4.6
therefore do not compare with runs recorded by this version.
