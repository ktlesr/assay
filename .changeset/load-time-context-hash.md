---
'@ktlsr/assay-core': minor
'@ktlsr/assay-runner': minor
'@ktlsr/assay-adapters': minor
'@ktlsr/assay': minor
---

Hash instruction files when the host loads them, not when the attempt ends

`contextHash` claims to say what entered the model's context. It was computed
from the files as they sat on disk *after* the agent had finished, so the
measured agent could change the pin by editing an instruction file — the pin
was corrupted by the thing it measures.

One attempt was enough to lose it for a whole run. Attempts whose context
differs are deliberately not reduced to a single environment, so a single
edited `CLAUDE.md` split the environment record and the run came out with no
`environment` block and no `contextHash` at all. Measured: in a 200-attempt
run, **1 attempt** wrote `CLAUDE.md` and the run lost its context pin, while
the neighbouring run with the same setup kept it.

The `InstructionsLoaded` hook now reads and hashes each file at the moment the
host loads it, and the digest travels in the hook's own log. Reading the files
again at the end is gone: a path with no recorded digest stays `unreadable`
rather than being filled in from a later read, because what was loaded is then
genuinely unknown. The hook never fails a session — if the hash cannot be
taken, the line is still written.

No new field records the edit, and that is deliberate: anything stored on the
environment would split the environment record exactly as the old hash did. An
edit to a declared file already shows per attempt in the snapshot diff.

No record shape changes. Older runs are not backfilled — in those, what was in
context at load time was never measured.
