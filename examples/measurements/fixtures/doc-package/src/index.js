/** Retry `fn` up to `attempts` times with full-jitter exponential backoff. */
export async function retry(fn, { attempts = 3, baseMs = 100, capMs = 10_000 } = {}) {
  let last
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn(i)
    } catch (err) {
      last = err
      if (i === attempts - 1) break
      await sleep(jitter(backoff(i, baseMs, capMs)))
    }
  }
  throw last
}

export function backoff(attempt, baseMs, capMs) {
  return Math.min(capMs, baseMs * 2 ** attempt)
}

export function jitter(ms) {
  return Math.random() * ms
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export class RetryBudget {
  constructor(maxPerMinute) {
    this.maxPerMinute = maxPerMinute
    this.spent = 0
  }
  take() {
    if (this.spent >= this.maxPerMinute) return false
    this.spent += 1
    return true
  }
}
