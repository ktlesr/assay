# Assay GitHub Action

Runs a case set on every pull request and fails the check when a skill
regresses.

```yaml
- uses: ktlesr/assay/action@main
  env:
    CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
  with:
    suite: assay.suite.yaml
    skill: ./skills/my-skill
    repeat: '10'
```

A ready-to-copy workflow is in
[examples/workflows/assay.yml](../examples/workflows/assay.yml).

## Inputs

| Input | Default | Meaning |
|---|---|---|
| `suite` | — | Path to the case set. Required. |
| `skill` | — | Directory of the skill or plugin under test. Required. |
| `repeat` | the suite's `runs` | Runs per case. Do not set this to 1 in CI. |
| `model` | the suite's pinned model | Model override. |
| `allow-unknown` | `false` | Treat "nothing could be measured" as success. |
| `comment` | `true` | Post a scorecard on the PR, updating it in place. |
| `baseline` | `true` | Compare against the newest run on the base branch. |
| `token` | `github.token` | Used for the comment and the baseline download. |

## Outputs

`verdict` (`pass` / `fail` / `unknown`), `run-id`, `report`.

## What the check does

**Annotations.** Every failing case becomes an error annotation with its
reason; every unmeasurable case becomes a warning. The two are never merged:
a case that could not be measured is not a case that failed.

**Step summary.** The scorecard lands on the job summary page even when the
PR comment is turned off.

**PR comment.** One comment per pull request, updated in place. It is found
again by a hidden marker in the body, so repeated runs do not pile up.

**Artifact.** The run records and the HTML report are uploaded as
`assay-runs`. That artifact is also the baseline for the next run.

## Baseline

The action downloads the `assay-runs` artifact from the newest successful run
of the same workflow on the base branch, and compares against it.

This choice keeps the SDK self-sufficient: no service, no database, no token
beyond `GITHUB_TOKEN`. Its limits are real and worth knowing —

- Artifacts expire (90 days by default), and the baseline disappears with them.
- The first run on a branch has no baseline; the comment says so instead of
  pretending the comparison passed.
- Two pull requests that land close together compare against the same baseline.

Phase 2 adds a hosted baseline. The comparison itself lives in
`@ktlsr/assay-core`, so that change swaps where the earlier run comes from and
nothing else.

## Requirements

Node 22, the host CLI installed on the runner, and a credential for it. For
Claude Code that is `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) or
`ANTHROPIC_API_KEY`. Each run happens in an isolated config directory, so it
does not inherit any interactive session.

**This action spends money on every run.** Ten cases at ten repeats is a
hundred agent sessions. Scope the workflow with `paths:` so it only fires when
a skill actually changes.
