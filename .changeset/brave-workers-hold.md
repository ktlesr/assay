---
'@ktlsr/assay-runner': minor
'@ktlsr/assay-adapters': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay': minor
---

Each attempt now runs in its own process, so an attempt that gets killed costs
an attempt instead of the run.

The agent being measured verifies its work by starting dev servers and then
killing processes by port. The runner is an ordinary node process on the same
machine, and during a 240-attempt measurement it was killed twice that way.
Part of that was our own doing: the adapter killed only its direct child, so
the servers the agent started outlived the attempt and the next agent found the
port busy.

`assay run` now supervises each attempt in a short-lived worker and closes that
worker together with its process tree when the attempt ends. A killed attempt
is recorded as `unknown` — not `fail`, because nothing was measured — with a
reason that names what happened. `--no-isolation` runs attempts in the calling
process as before; library callers that pass their own adapter instance keep
the in-process default.

Measured, with real processes and a real killer: in-process, one kill ends the
run and records nothing; isolated, the same kills cost two attempts out of four
and the run finishes. No orphan servers were left behind in either arm.

This is a limit, not a shield. The supervising process is a node process too,
and killing it still stops the run — the journal then holds the completed
attempts and `assay recover` turns them into a record. Real isolation needs a
container and stays in Phase 3.
