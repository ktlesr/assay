---
'@ktlsr/assay-core': patch
'@ktlsr/assay-runner': patch
'@ktlsr/assay-adapters': patch
'@ktlsr/assay': patch
---

A case set can declare an instruction file that belongs in the context

```yaml
context:
  instructions: fixtures/arm-c/CLAUDE.md
```

0.4.5 closed a leak by excluding every instruction file **above** the working
directory, which was right — but a measurement of how an instruction file
steers a model used exactly that mechanism, and became unrunnable. Dropping
back to 0.4.4 did not help either: `contextHash` is derived from 0.4.5's
context measurement, which 0.4.4 does not have. No version both measured that
experiment and let its runs be compared.

The declared file is copied into each attempt's working directory as
`CLAUDE.md` — inside it, never above. Above is where the leak lives, and
writing there for a case set would reopen the closed hole one suite at a time;
a working directory's own instruction file was already never excluded. Verified
against the real host at no cost: the file's text appears in the request the
host sends, and the record reads `Project ./CLAUDE.md sha256:…`.

**The declaration and the content are pinned separately, and that is the
point.** The declared path lives in the suite file, so it is covered by
`suiteHash`: a case set that asks for a different file is a different case set.
The file's *contents* are covered by `contextHash`, because the host loads it
and the context measurement catches it. An ablation therefore keeps one path
and changes the file: same case set, drifted context, and `compare` names the
right one.

`Environment.declaredContext` records what the case set asked for, so the
fingerprint can say "declared by the case set" instead of leaving a reader to
guess whether a file leaked. A file the case set declared and the host did not
load is reported above the numbers — what was measured is then not what the
case set describes.

Nothing changes for a suite without `context`: the field is optional, and no
hash moves.
