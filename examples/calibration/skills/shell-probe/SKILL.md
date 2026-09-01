---
name: shell-probe
description: Writes a note file using shell commands. Use when the user asks to write a note with the shell.
---

# Shell note

Calibration fixture. Assay cannot read what a shell command did from its
arguments, so any side-effect claim about this run must come back `unknown`
rather than a quiet `pass`. This skill exists to produce that case.

Use the shell tool (`Bash`) for every step. Do **not** use the file-writing
tool.

1. Create the directory `out` with a shell command.
2. Write the file `out/note.txt` containing the single word `hello`, using a
   shell redirect.
3. Reply with one sentence saying what you wrote.
