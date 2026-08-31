/**
 * Sabit pencereli sayaç.
 *
 * ponytail: süreç içi Map, tek örnek için doğru. Birden çok örnek koşulduğunda
 * her örneğin kendi sayacı olur; yatay ölçek geldiğinde Redis'e taşınır.
 */

const hits = new Map<string, { count: number; resetAt: number }>()

/** İzin veriliyorsa `true`. Pencere dolduğunda sayaç sıfırlanır. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (entry === undefined || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    if (hits.size > 10_000) sweep(now)
    return true
  }
  entry.count += 1
  return entry.count <= limit
}

function sweep(now: number): void {
  for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
}
