---
'@ktlsr/assay': patch
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
---

Masking now catches the username in the three forms real records carried
past `assay scrub`, and `push` checks a record before it leaves the machine.

- A path whose backslashes a shell swallowed (`C:UsersadaAppData…`), the
  Claude Code project directory name (`C--Users-ada`) and a path escaped twice
  inside code the agent wrote (`C:\\Users\\ada`) are masked. On the eight
  records from the first real upload, 0.4.0 left the username in 71 places;
  this release leaves none, with or without knowing the name.
- The account running Assay is also masked by name, wherever a path carries
  it, when a record is written, read, scrubbed or pushed. This closes the
  cases a pattern cannot see, such as a name with a dot.
- `push` refuses to upload a record that still carries a secret, a home path
  or this account's name after masking, and names where. `--allow-unmasked`
  uploads anyway, once you have checked. When masking changed the uploaded
  copy, `push` says how many places and that the file on disk is unchanged.
