---
'@ktlsr/assay-adapters': minor
'@ktlsr/assay-runner': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay': minor
---

Comparison now names the field that actually moved. When two runs differ in
their environment, `compare` reported "systemPromptHash changed" — a field
that reads `not-provided-by-host` in both records and therefore never moved.
The auditor's finding was filed under the audited pin's name.

`comparePins` now reports `environmentHash`, and the run record carries the
environment behind that hash (model, version, output style, permission mode,
tool/skill/agent/plugin lists) so the reason can say
`permissionMode: acceptEdits → bypassPermissions` instead of only "something
changed". Records written before this release have no environment components;
those comparisons fall back to hash level and say so.

No verdict changes: the same comparisons are refused as before, with the
right reason.
