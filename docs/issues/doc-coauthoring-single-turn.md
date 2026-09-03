# doc-coauthoring produces no artefact in a single-turn environment

**Repository:** `anthropics/skills` · **Skill:** `doc-coauthoring` ·
**Commit measured:** `53048666b05b4799081517d00e09e0a2dd688678` ·
**Host:** Claude Code · **Model:** `claude-haiku-4-5-20251001`

> Draft. Not yet filed.

## Summary

When `doc-coauthoring` is invoked in an environment that cannot answer
questions — a CI job, a scripted run, any non-interactive session — it enters
Stage 1 (Context Gathering), asks the user for meta-context, and the session
ends there. No file is written.

This is the skill doing what `SKILL.md` documents. The problem is that nothing
in the skill's description tells a caller that the workflow needs a second
turn, so a caller who wires it into an automated pipeline gets a session that
looks successful and produces nothing.

## What was measured

30 attempts across three cases, 10 attempts each. Every prompt names an output
file explicitly and asks for the finished document on disk.

| Case | Skill fired | Requested file written |
|---|---|---|
| `complete.proposal_with_objections` | 10/10 | **0/10** |
| `complete.design_doc_with_outline` | 5/10 | 5/10 |
| `complete.decision_record` | 0/10 | 10/10 |

Cross-tabulating the two columns over all 30 attempts leaves two cells empty:

| | file written | file missing |
|---|---|---|
| **skill engaged** | 0 | 15 |
| **skill did not engage** | 15 | 0 |

There are no exceptions in either direction. In every attempt where the skill
engaged, no file was produced; in every attempt where it did not, the file was
produced.

## The trace

`complete.proposal_with_objections`, attempt 0. The full session is seven
events. There is no `Write` call among them and `env.writes` is empty.

```
assistant_message  "I'll help you build a compelling trunk-based development
                    proposal. This is exactly the kind of structured doc work
                    where the doc-coauthoring workflow helps — it'll let us
                    transfer your context, iterate the argument, and verify it
                    lands with your audience."
tool_call Skill    {"skill":"doc-coauthoring"}
skill_trigger      doc-coauthoring
tool_result Skill
assistant_message  (SKILL.md contents)
assistant_message  "## Initial Meta-Questions
                    1. **Who specifically** are we convincing? ...
                    2. **Urgency**: ...
                    3. **Tone**: ...
                    4. **Scope of rollout**: ...
                    5. **What's the biggest political/technical objection** ...
                    Once I have those details, I'll suggest a doc structure ...
                    What's your read on these points?"
session_end
```

The prompt that produced it had already supplied the context and had asked, in
its own words, for the file rather than a conversation:

```
I want to put together a proposal for moving the team from long-lived
feature branches to trunk-based development. It has to convince
engineering leadership and take the obvious objections seriously.
Let's work on it.

Context you need: we have 14 engineers on 4 squads, branches live 9
days on average, and the last three incidents were all merge conflicts
resolved wrongly at 6pm on a Friday. We already have CI on every push
and a 12-minute test suite. We do not have feature flags.

Whatever we do, I need the finished thing on disk at the end of this,
not in the chat. Save it to `out/trunk-based-proposal.md`. ...
```

Stage 1 ran anyway.

## Isolating the variable

The obvious objection is that something else in these prompts caused the
difference. Two cases were written to rule that out. Their prompts are
word-for-word identical except for a final paragraph asking for a file:

| Case | Final paragraph | Skill fired |
|---|---|---|
| `control.design_doc_no_artifact` | absent | 10/10 |
| `complete.design_doc_with_outline` | `"...I need to end up with the file. Write the finished doc to out/queue-design.md..."` | 5/10 |

Both ran in the same session batch under the same skill content hash, model id
and environment, so the only thing that differs between them is the paragraph.

The paragraph has two effects, and they compound: it halves the rate at which
the skill engages, and in the attempts where it does engage, the file is not
written.

## Suggested changes

Ordered smallest first; any one of them addresses the reported symptom.

1. **Say so in the description.** One clause in the frontmatter
   `description` — that this is a multi-turn workflow requiring user replies —
   lets a caller decide before invoking. This costs nothing and fixes the
   surprise, though not the behaviour.

2. **Detect that nobody can answer, and degrade.** If the request already
   carries the context the workflow would ask for, or names a destination
   file, Stage 1's questions have no one to answer. Producing a first draft and
   listing the open questions *inside the document* would leave the caller with
   something, and a subsequent turn could still refine it.

3. **Make Stage 1 skippable when the context is already supplied.**
   `SKILL.md` already says "If user declines, work freeform." The same branch
   could be taken when the user has pre-empted the questions, rather than only
   when they decline explicitly.

Option 2 seems the most useful: the workflow's value is in the iteration, and
starting the iteration from a draft loses none of it.

## Reproduction

Manual, no tooling — this is enough to see the behaviour:

1. Start a non-interactive session with the skill available, e.g.
   `claude -p --plugin-dir <plugin containing doc-coauthoring>`.
2. Send the prompt quoted above on stdin.
3. Observe: the skill is invoked, the reply is a list of meta-questions, the
   session ends, and `out/trunk-based-proposal.md` does not exist.

Repeated measurement, if the rates above are worth checking:

```
git clone https://github.com/ktlesr/assay
npx @ktlsr/assay run suites/doc-coauthoring-completion.suite.yaml \
  --skill <plugin dir> --store .runs-doc-coauthoring-completion
```

The case set is `suites/doc-coauthoring-completion.suite.yaml`; the run record
holding the numbers above is stored under `.runs-doc-coauthoring-completion/`.

## What this is not

This is not a report that the skill is broken. In an interactive session the
workflow behaves as documented and the questions are the point. The gap is
between what the skill needs (a second turn) and what its description tells a
caller to expect.
