import { parseSuite, type Run } from '@assay/core'
import { RunAlreadyStoredError, isConfigured, prisma, storeRun } from '@assay/db'
import { rateLimit } from '../../../lib/rate-limit'
import { identify } from '../../../lib/tokens'

/**
 * Koşum yükleme — `assay push` bu uca yazar.
 *
 * Platform ölçmez, hatırlar: burada hiçbir şey yeniden değerlendirilmiyor.
 * Gelen kayıt olduğu gibi saklanıyor; vaka seti yalnızca *ayrıştırılabilir*
 * olduğu için doğrulanıyor (negatif vaka zorunluluğu dahil), yeniden
 * skorlanmıyor.
 */

export const runtime = 'nodejs'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

export async function POST(request: Request): Promise<Response> {
  if (!isConfigured()) {
    return json({ error: 'this instance has no database configured' }, 503)
  }

  const identity = await identify(request)
  if (identity === null) {
    return json({ error: 'a valid API token is required' }, 401)
  }
  if (!rateLimit(`push:${identity.userId}`, 60, 60_000)) {
    return json({ error: 'too many uploads, try again in a minute' }, 429)
  }

  let body: { suite?: unknown; suiteSource?: unknown; run?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json({ error: 'the request body is not valid JSON' }, 400)
  }

  if (typeof body.suiteSource !== 'string' || typeof body.run !== 'object' || body.run === null) {
    return json({ error: 'send { suiteSource: string, run: Run }' }, 400)
  }

  const parsed = parseSuite(body.suiteSource)
  if (!parsed.ok) {
    return json({ error: 'the case set is not valid', issues: parsed.issues }, 400)
  }

  const run = body.run as Run
  if (typeof run.id !== 'string' || run.id === '' || !Array.isArray(run.cases)) {
    return json({ error: 'the run record is not shaped like a run' }, 400)
  }

  try {
    const stored = await storeRun(prisma(), {
      suite: parsed.suite,
      suiteHash: run.pins.suiteHash,
      run,
      ownerId: identity.userId,
    })
    return json({ runId: stored.runId }, 201)
  } catch (cause) {
    if (cause instanceof RunAlreadyStoredError) {
      return json({ error: cause.message, runId: run.id }, 409)
    }
    return json({ error: cause instanceof Error ? cause.message : 'the run could not be stored' }, 400)
  }
}
