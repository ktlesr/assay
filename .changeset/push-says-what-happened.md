---
'@ktlsr/assay': patch
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
---

`assay push` tells a failed upload apart from a mistyped command, and says
when the run it just uploaded is not visible to anyone else yet.

- **Exit code 4** when the upload did not happen: the server could not be
  reached or refused the record. It used to be 2, the usage-error code, which
  sent CI users looking at their command line instead of at the server.
  **Behaviour change:** a pipeline that treated 2 from `push` as "the server
  said no" should now look for 4.
- After a successful upload to a case set that has not been published yet,
  push prints that only you can open the link until an administrator
  publishes it. The hosted side now reports whether the case set is public.
- `assay --version` prints the version, the same value a record carries as
  `assayVersion`.
