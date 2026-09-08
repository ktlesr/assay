---
'@ktlsr/assay-runner': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay': minor
'@ktlsr/assay-adapters': minor
---

A killed run no longer loses the attempts it already measured.

Until now the record was written once, after every case finished, so a process
killed mid-run took every completed attempt with it. That is not theoretical:
during a 240-attempt measurement the runner was killed twice by the agent it
was measuring, and ~40 minutes and ~$4 of attempts went with it.

Each attempt is now appended to `.assay/runs/<run-id>.partial.jsonl` as it
completes. A run that finishes normally folds the journal into the usual record
and deletes it. A run that dies leaves the journal on disk, and the new `assay
recover` turns it into a record — one that says it is incomplete, carrying the
reason, the recovery time, and the count of any journal lines too damaged to
read. `assay run` warns when it finds a journal from an earlier run.

The loss is now capped at one attempt. The runner is still killable; making it
survive is a separate change.
