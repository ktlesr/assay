/**
 * Gerçek adaptör doğrulaması — 1.1'in "manuel doğrula" adımı.
 *
 * assay-probe skill'ini izole bir oturuma yükler ve üç istek koşar:
 * pozitif (tetiklenmeli), yakın komşu (tetiklenmemeli), alakasız (tetiklenmemeli).
 * Gerçek para harcar; sonuç docs/adapter-validation.md'ye yazılır.
 *
 * Kullanım: node tools/live-adapter-probe.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
// Derlenmiş çıktıdan içe aktarılır; önce `pnpm typecheck` (tsc -b) koşmalı.
import { ClaudeCodeAdapter } from '../packages/adapters/dist/index.js'
import {
  evaluateNoSwallowedErrors,
  evaluateTrigger,
} from '../packages/core/dist/index.js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .map((l) => /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
)
if (!env['CLAUDE_CODE_OAUTH_TOKEN']) {
  console.error('CLAUDE_CODE_OAUTH_TOKEN yok, .env kontrol et')
  process.exit(1)
}

// Probe skill'i: gerçek bir skill'in yerine geçen, davranışı belirli bir plugin.
const pluginDir = resolve('.assay/probe-plugin')
const skillDir = join(pluginDir, 'skills', 'widget-manifest')
mkdirSync(join(pluginDir, '.claude-plugin'), { recursive: true })
mkdirSync(skillDir, { recursive: true })
writeFileSync(
  join(pluginDir, '.claude-plugin', 'plugin.json'),
  JSON.stringify(
    { name: 'assay-probe', version: '0.0.1', description: 'Assay adapter probe.' },
    null,
    2,
  ),
)
writeFileSync(
  join(skillDir, 'SKILL.md'),
  `---
name: widget-manifest
description: Converts a draft or notes into a widget manifest. Use when the user asks to turn a draft into a widget manifest, build widgets from notes, or produce a dashboard widget manifest.
---

# Widget manifest

Reply with exactly one line and nothing else:

ASSAY_PROBE_FIRED
`,
)

const workdir = resolve('.assay/probe-work')
mkdirSync(workdir, { recursive: true })

const adapter = new ClaudeCodeAdapter({
  credentials: { oauthToken: env['CLAUDE_CODE_OAUTH_TOKEN'] },
  timeoutMs: 600_000,
})

const cases = [
  {
    id: 'trigger.positive.explicit',
    prompt:
      'Here is my draft:\n\n# Sales dashboard\n- revenue tile\n- churn chart\n\nTurn this draft into a widget manifest.',
    expect: { triggered: true },
  },
  {
    id: 'trigger.negative.near_neighbor.readme',
    prompt:
      'Here is my draft:\n\n# Sales dashboard\n- revenue tile\n- churn chart\n\nTurn this draft into a README section.',
    expect: { triggered: false },
  },
  {
    id: 'trigger.negative.unrelated',
    prompt: 'What is the difference between a semaphore and a mutex?',
    expect: { triggered: false },
  },
]

const rows = []
for (const [index, testCase] of cases.entries()) {
  process.stdout.write(`\n[${index + 1}/${cases.length}] ${testCase.id} koşuluyor...\n`)
  const session = await adapter.start({
    caseId: testCase.id,
    attempt: 0,
    prompt: testCase.prompt,
    skill: { name: 'widget-manifest', source: 'local@probe', path: pluginDir },
    model: 'claude-haiku-4-5-20251001',
    activeSkills: ['widget-manifest'],
    workdir,
  })
  const trigger = await adapter.readTriggerSignal(session)
  const trace = await adapter.readTrace(session)
  const result = await adapter.finalize(session)
  const verdict = evaluateTrigger(trigger, testCase.expect)
  const swallowed = evaluateNoSwallowedErrors(trace)

  rows.push({
    id: testCase.id,
    expected: testCase.expect.triggered,
    available: trigger.available,
    triggered: trigger.available ? trigger.triggered : null,
    skills: trigger.available ? trigger.skills : [],
    reason: trigger.available ? trigger.via : trigger.reason,
    verdict: verdict?.verdict ?? null,
    verdictReason: verdict?.reason ?? '',
    activeSkillCount: (result.activeSkills ?? []).length,
    environmentHash: result.environmentHash ?? null,
    systemPromptHash: result.systemPromptHash ?? null,
    outcome: result.outcome,
    traceEvents: trace?.length ?? null,
    swallowed: swallowed.verdict,
    cost: result.cost?.usd ?? null,
    latencyMs: result.latencyMs,
    text: (session.parsed.result?.text ?? '').slice(0, 120).replace(/\n/g, ' '),
  })
  console.log(JSON.stringify(rows.at(-1), null, 1))
}

const out = '.assay/adapter-probe.json'
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(rows, null, 2))
console.log(`\nSonuçlar ${out} dosyasına yazıldı.`)
console.log(
  `Toplam maliyet: ${rows.reduce((sum, r) => sum + (r.cost ?? 0), 0).toFixed(4)} USD`,
)
