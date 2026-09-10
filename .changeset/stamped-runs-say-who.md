---
'@ktlsr/assay-runner': patch
'@ktlsr/assay-core': patch
'@ktlsr/assay': patch
---

A run record now carries the Assay version that produced it.

The meaning of a verdict has changed between releases: 0.2.0 counted a refused
skill activation as a trigger, and 0.3.0 could recover an incomplete record as
a pass. A record that does not say which version judged it cannot say which
rules it was judged by.

`Run.assayVersion` is the runner package's version, read from its own
`package.json`. A recovered record carries the version that wrote the journal,
not the one that recovered it — the attempts were judged by the writer's rules.

Records written before this release have no version. They are not guessed at
and not backfilled; the terminal report, the HTML report and the hosted run
page read them as `0.3.1 or earlier (the record predates version stamping)`
instead of leaving the field blank. Library callers can get the same wording
from `assayVersionLabel(run)` in `@ktlsr/assay-core`.
