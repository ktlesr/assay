# @ktlsr/assay-core

The measurement layer of [Assay](https://github.com/ktlesr/assay), a CI test
runner for Agent Skills.

This package is pure TypeScript: no file system, no network, no child
processes. It takes evidence that somebody else collected and turns it into a
verdict. That constraint is enforced by a lint rule and a test, not by good
intentions — it is what lets the same assertion produce the same verdict in
Node, in a browser, and in a hosted service re-scoring an old run.

```
npm install @ktlsr/assay-core
```

## What it does

**Parses and validates case sets.** `parseSuite` reads the YAML suite format
and returns typed issues instead of throwing. A trigger suite without a
negative case is rejected at the schema level.

**Evaluates assertions.** `evaluateAssertion` / `evaluateAssertions` cover file
existence, structure and JSON Schema validation, text and regex matching, tool
call traces, side effects and numeric thresholds. Deterministic only — there is
no LLM judge in the scoring path.

**Produces three-valued verdicts.** `pass`, `fail`, `unknown`. Each assertion
type declares which evidence fields it needs; the dispatch layer refuses to
call an evaluator whose evidence is missing and returns `unknown` instead. A
quiet `pass` on unmeasured data is structurally impossible, not merely
discouraged.

**Scores runs.** `proportion` returns a `Proportion`, never a bare number:

```ts
import { proportion, formatProportion } from '@ktlsr/assay-core'

const p = proportion(14, 20)
// { successes: 14, n: 20, rate: 0.7,
//   ci: { low: 0.481027181646, high: 0.854522755132, level: 0.95 } }

formatProportion(p) // '70% (N=20, 95% CI 48%–85%)'
```

The interval is Wilson, not Wald: at 10/10 Wald claims `100%–100%` and hides
all uncertainty, where Wilson reports `100% (N=10, 95% CI 72%–100%)`. With `n === 0` both `rate` and `ci` are `null`, because at
N=0 there is no rate to show.

**Compares runs.** `compareRuns` refuses to compare two runs unless four pins
match — skill version and content hash, model id, system prompt hash, and case
set version and content hash. If one drifted it names which, and the result is
`unknown`. A score that fell because the model changed is not a regression.

## Reading evidence

`core` never gathers evidence itself. A runner collects an `Evidence` object —
captured files, tool trace, exit code, environment diff — and hands it over.
The same `Evidence` always yields the same verdict, which is what makes a
measurement reproducible and re-scorable later.

## License

Apache-2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
