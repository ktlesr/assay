# webapp-testing triggers on "drive a browser", not on "local web application"

**Repository:** `anthropics/skills` · **Skill:** `webapp-testing` ·
**Commit measured:** `53048666b05b4799081517d00e09e0a2dd688678` ·
**Host:** Claude Code · **Model:** `claude-haiku-4-5-20251001`

> Draft. Not yet filed.

## Summary

The skill's description carries two conditions:

> Toolkit for interacting with and **testing** **local** web applications using
> Playwright.

In measurement, the first half — *drive a browser with Playwright* — is what
decides whether the skill engages. The qualifiers `local` and `testing` do not
appear to be consulted: the skill also engages on a request to open a **public
remote page** and **extract data** from it, which satisfies neither.

The practical effect is scope creep in one direction only. A request that is
browser-shaped but out of scope pulls in a toolkit built around
`scripts/with_server.py` and local server lifecycle, none of which applies.

## What was measured

Two case sets, ten attempts per case, no skill name mentioned in any prompt.

Positive cases behave well — the skill engages when it should:

| Case set | Case | Fired |
|---|---|---|
| `webapp-testing` | `trigger.positive.console_debug` | 10/10 |
| `webapp-testing` | `trigger.positive.screenshot` | 10/10 |
| `webapp-testing` | `trigger.positive.flow_walkthrough` | 9/10 |
| `webapp-testing-borderline` | `trigger.positive.console_debug` | 10/10 |
| `webapp-testing-borderline` | `trigger.positive.rendered_value` | 10/10 |
| `webapp-testing-borderline` | `trigger.positive.responsive_overlap` | 10/10 |

The near-neighbour negatives also hold, with one exception:

| Case set | Negative case | Out of scope because | Fired |
|---|---|---|---|
| `-borderline` | `trigger.negative.near_neighbor.public_scrape` | remote, public, not a test | **3/10** |
| `-borderline` | `trigger.negative.near_neighbor.pdf_render` | rendering, not testing | 0/10 |
| `-borderline` | `trigger.negative.near_neighbor.load_test` | load, not browser | 0/10 |
| `-borderline` | `trigger.negative.near_neighbor.grpc_service` | not a web app | 0/10 |
| `webapp-testing` | `trigger.negative.near_neighbor.unit_test` | not a browser | 0/10 |
| `webapp-testing` | `trigger.negative.near_neighbor.static_read` | no browser needed | 0/10 |
| `webapp-testing` | `trigger.negative.near_neighbor.playwright_config` | config, not a run | 0/10 |
| `webapp-testing` | `trigger.negative.near_neighbor.api_probe` | no browser | 0/10 |

Two unrelated negatives per set (a TypeScript question and a shell question)
also held at 0/10 and are omitted.

The one that leaks is the one that keeps the browser and drops both qualifiers.

## The leaking case

```
Open https://example.com/pricing in a browser, wait for the tier cards
to render, and pull the three plan names and monthly prices out into
JSON. It is a client-rendered page so fetching the HTML is not enough.
```

Remote, not local. Extraction, not testing. It fired in 3 of 10 attempts, and
the opening message in those attempts names the skill and restates the request
in the skill's own vocabulary:

```
attempt 0  "I'll use the webapp-testing skill to open the browser, navigate to
            the URL, wait for the pricing cards to render, and extract the plan
            names and prices."
attempt 6  "I'll use the webapp-testing skill to open that URL in a browser,
            wait for the pricing cards to render, and extract the plan names
            and prices."
```

The remaining 7 attempts wrote a Playwright script without invoking the skill —
the same outcome, without the toolkit. That the split is 3/10 rather than 0/10
or 10/10 is itself informative: the boundary is not being decided, it is being
sampled.

## A related inconsistency in the description

Separately, and worth resolving in the same edit: the description says
`web applications`, while `SKILL.md`'s own decision tree opens with

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
```

Static HTML files are in scope per the body and arguably out of scope per the
description. In 30 attempts of a completion measurement against static pages
opened from disk, 26 navigated with a `file://` URL and started no server at
all, and the skill engaged in 28 of the 30. That behaviour follows the body, not the
description — so the description is the part that is narrower than the truth,
while being wider than the truth on `local`.

## Suggested changes

1. **Put the exclusion in the description.** The positive half is already
   working; what is missing is a stated boundary. Something like: *"For local
   pages and applications under development. Not for extracting data from
   public websites."* Negative statements in a description are read — the other
   negatives in this set hold at 0/10, and the ones that hold are the ones the
   description makes distinguishable.

2. **Reconcile `web applications` with the static-HTML branch.** Either the
   description says *pages and applications*, or the decision tree stops
   claiming static HTML. Today a reader of the description and a reader of the
   body would disagree about scope.

3. **Add a scope check to the decision tree.** The tree currently begins at
   "Is it static HTML?" — one step earlier ("Is the target local, and is the
   goal to verify behaviour rather than collect content?") would give the model
   the same branch point the description implies.

Change 1 alone would likely move the 3/10 case, and is the smallest.

## Reproduction

Manual:

1. Start a session with the skill available and no other skills loaded, e.g.
   `claude -p --plugin-dir <plugin containing webapp-testing>`.
2. Send the `public_scrape` prompt above.
3. Repeat. The skill is invoked in roughly a third of attempts; a single
   attempt will not show it, which is why the numbers above are over ten.

Repeated measurement:

```
git clone https://github.com/ktlesr/assay
npx @ktlsr/assay run examples/measurements/webapp-testing-borderline.suite.yaml \
  --skill <plugin dir> --store .runs-webapp-testing-borderline
```

Case sets: `examples/measurements/webapp-testing.suite.yaml`,
`examples/measurements/webapp-testing-borderline.suite.yaml`, and
`suites/webapp-testing-completion.suite.yaml` for the static-page runs.

## What this is not

Not a report that the skill is broken — on the requests it targets it engages
in 59 of 60 attempts, and seven of the eight near-neighbour negatives hold
perfectly. This is about one word in the description doing work it is not
currently doing.
