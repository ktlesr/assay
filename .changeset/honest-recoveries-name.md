---
'@ktlsr/assay-runner': patch
'@ktlsr/assay-core': patch
'@ktlsr/assay': patch
---

A recovered run cannot pass, and it names the cases it never reached.

Measured on 0.3.0: a run killed after three attempts was recovered as a
`pass` holding only its first, positive case. The negative case it never
reached appeared nowhere in the record — neither among the cases nor among
the skipped ones — so a run cut before its negatives left a clean pass that
did not say what it was missing.

The journal header now carries the planned case list, and `assay recover`
writes every case the run never started into `skipped` with
`cause: 'interrupted'`. An incomplete record's verdict is at best `unknown`,
even when no case was missed entirely and only attempts were: the unrun
attempts were never measured. A failure the record did measure is still a
failure. The terminal and HTML reports say why the record cannot pass.

Journals written by 0.3.0 have no planned list. Recovering one cannot name
the unreached cases, but the record still does not pass.

**Behaviour change:** records recovered as `pass` before this release would
now be `unknown`. Records already stored or uploaded keep their verdict; the
rule applies to new recoveries.
