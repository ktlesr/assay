---
'@ktlsr/assay': patch
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
---

`--fast` no longer skips a case whose only claim is an expected winner.

Fast mode measures the trigger layer and skips cases that only declare
assertions. Its test for "has a trigger claim" predates `expect.winner`
(0.4.0), so a case carrying nothing but `winner:` — a contested case,
`winner: [copywriting, copy-editing]` — was skipped and recorded as "the case
only declares assertions", which was false. Found on a real collision run:
one of twenty cases went unmeasured. Such cases now run and are judged by
the winner rule.
