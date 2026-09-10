---
'@ktlsr/assay-core': patch
---

A trigger observation recorded before 0.2.0 no longer has to pretend it was
checked. Such records carry no `refused` or `refusals`: that version counted
every selected skill as triggered without confirming it loaded. Both fields
are now optional, and their absence means the check was never made — not
that nothing was refused.

- `evaluateTrigger` returns `unknown` for an old observation in which a skill
  was selected, and says why; one in which nothing was selected is still
  complete and is judged as before. This only matters when an old record is
  re-scored.
- `activationUnverified(run)` and `ACTIVATION_UNVERIFIED` let a report say
  so; the hosted run page shows it as an "Activation check" row.
