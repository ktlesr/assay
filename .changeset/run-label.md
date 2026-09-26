---
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
'@ktlsr/assay': patch
---

Name a run with `assay run --label "arm C — table + standing default"`

Two runs of the same case set, under the same four pins, used to be
indistinguishable in the record: five arms of a phrase-binding measurement
produced identical verdicts, identical precision and recall, and identical
collision matrices, and only their timestamps told them apart. The label is
that missing name — it appears on the terminal report, the HTML report and the
hosted run page, and a recovered run keeps the label the journal was opened
with.

The label is **not a pin**. It enters no hash and never blocks a comparison,
because a label has no auditor: forget it and the protection would vanish
exactly where it is needed, and a nightly run's label changes every day while a
pin must not. When two otherwise-matching runs carry different labels,
`compare` says so in a note above the numbers and still compares them.
Conditions block comparisons; names do not.

No behaviour changes: the field is optional, existing records read unchanged,
no hash definition moves and every exit code is the same.
