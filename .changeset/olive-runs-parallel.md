---
'@ktlsr/assay-runner': minor
'@ktlsr/assay-adapters': minor
'@ktlsr/assay-core': minor
'@ktlsr/assay': minor
---

`--concurrency <n>` runs attempts in parallel. The default stays 1.

A 240-attempt measurement took eight hours because attempts ran one at a time.
They can now share the machine, but speeding up is a choice rather than a
default: parallel attempts compete for CPU, memory, ports and the host's rate
limit, and a default that quietly changed the conditions of a measurement would
be the wrong kind of help.

The value is written to the run record and deliberately kept out of the
environment hash. The hash records the environment the host reported; how many
attempts ran at once is a property of the run, not of the host, and folding it
in would make runs at different speeds incomparable on trigger accuracy too.
What it does affect is latency and cost, so the report says so whenever
concurrency is above one.

Each worker gets a disjoint port range, passed to the agent as `PORT`,
`VITE_PORT` and `ASSAY_PORT_RANGE`. This is a mitigation, not a guarantee: an
agent is free to ignore them, and a server with a hardcoded port will still
collide with its neighbour.

Records written before this release have no concurrency field, which means one.
