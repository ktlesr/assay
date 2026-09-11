---
'@ktlsr/assay': patch
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
---

`compare` now names only what stopped the comparison. When a pin changed and
another pin could not be read, the reason used to list both in one sentence
("suiteHash changed; systemPromptHash could not be read"), so it was unclear
which one blocked. The reason now carries the change; the unreadable pin moves
to `RunComparison.note` and prints on its own `also:` line. An unreadable pin
with no change beside it is still the reason, and still stops the comparison.
