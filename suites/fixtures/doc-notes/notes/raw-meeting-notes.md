# cache invalidation sync — raw notes, 2026-08-19

attendees: platform, checkout, sre

- checkout sees stale prices for up to 90s after a price change.
  reported 3x by support in august. worst case a customer checks out
  at the old price and we eat the difference.
- current setup: redis, 90s ttl, no explicit invalidation. price
  service writes to postgres, nothing tells redis.
- option A: drop ttl to 5s.
  - cheap, one config line.
  - measured: redis QPS goes 1.4k -> ~19k. redis cpu 22% -> est 80%+.
  - sre says no, that is a single point of failure at that load.
- option B: price service publishes an invalidation event, cache
  subscribes and evicts the key.
  - needs a topic, needs the cache layer to hold a subscriber.
  - ~2 weeks. correct. bounded staleness = event delivery latency (~200ms).
  - failure mode: if the subscriber dies we go back to 90s ttl, which
    is exactly today. degrades to current behaviour, does not get worse.
- option C: write-through from price service directly into redis.
  - fastest to ship (~3 days).
  - couples price service to our cache topology. platform team owns
    redis; checkout would now break when we resize the cluster.
  - rejected on ownership grounds, not on latency.
- decided: B. C is the tempting one and the reason we said no is
  ownership, not performance — that needs to be written down or someone
  will re-propose C in january.
- open: do we need a metric for subscriber lag? probably yes, nobody
  volunteered.
