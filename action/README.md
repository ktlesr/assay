# Assay — GitHub Action

Runs a case set against a real host on every pull request, posts a scorecard,
and fails the check when a skill stops behaving the way it did before.

The action definition lives at the **repository root** (`action.yml`); the
scripts it runs live here. GitHub Marketplace requires the definition at the
root, so `ktlesr/assay@v1` is the reference — not `ktlesr/assay/action@v1`.

## Usage

```yaml
name: Skill measurement

on: pull_request

permissions:
  contents: read
  actions: read
  pull-requests: write # only needed for the scorecard comment

jobs:
  measure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ktlesr/assay@v1
        with:
          suite: ./my-skill.suite.yaml
          skill: ./my-skill
          claude-code-oauth-token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

The action installs the `@ktlsr/assay` CLI and the Claude Code host itself. It
needs no `setup-node` step and no build; the only thing you must provide is a
credential.

## Credentials

One of these is required. Both come from a repository secret — never inline.

| Input | How to get it |
|---|---|
| `claude-code-oauth-token` | `claude setup-token` on your machine |
| `anthropic-api-key` | console.anthropic.com |

If neither is set the action stops on its first step with a message that says
so. That is deliberate: without a credential the host cannot open a session and
every case would return `unknown`, which reads like a measurement failure when
it is really a setup error.

## Inputs

| Input | Default | What it does |
|---|---|---|
| `suite` | — | Path to the case set (required) |
| `skill` | — | Directory of the skill or plugin under test (required) |
| `repeat` | the suite's value | Runs per case. Never set this to 1 in CI |
| `model` | the suite's pin | Model id override |
| `allow-unknown` | `false` | Treat "nothing could be measured" as success |
| `comment` | `true` | Post the scorecard as a PR comment, updated in place |
| `baseline` | `true` | Compare against the newest run on the base branch |
| `token` | `github.token` | Used for the comment and the baseline download |
| `assay-version` | pinned | Version of the CLI to install |
| `claude-code-version` | `latest` | Version of the host to install |

## Outputs

| Output | Value |
|---|---|
| `verdict` | `pass`, `fail` or `unknown` |
| `run-id` | Identifier of the stored run |
| `report` | Path to the generated HTML report |

## Exit behaviour

The CLI's exit codes are carried through unchanged, and `unknown` is kept
separate from `fail` on purpose:

| Code | Meaning |
|---|---|
| 0 | every case behaved as the set expects |
| 1 | a case failed — the skill changed |
| 2 | usage error — the suite or skill path is wrong |
| 3 | nothing could be measured — the host or the credential is the problem |

A pipeline that treats 1 and 3 the same sends people to look for a broken skill
when the real problem is a missing token.

## What it uploads

An artifact named `assay-runs` containing the run records and the HTML report.
Records pass through `assay scrub` first, which masks home-directory usernames
and known secret formats — the artifact is a file that anyone with repository
access can download, so masking at display time is not enough.

The same artifact is what the next run downloads as its baseline, which is why
the comparison needs at least one previous successful run on the base branch.
The first run on a new branch says so instead of comparing against nothing.
