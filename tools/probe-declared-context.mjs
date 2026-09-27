/**
 * Beyan edilen talimat dosyası gerçekten bağlama giriyor mu — ücretsiz sonda.
 *
 * `probe-host-memory.mjs` ile aynı hile: gerçek `claude` ikilisi koşuyor ama
 * kimlik bilgisi sahte bir API anahtarı ve `ANTHROPIC_BASE_URL` yerel bir
 * yakalayıcıya çevrili. İstek Anthropic'e hiç gitmiyor, para harcanmıyor; host
 * yine de sistem istemini kuruyor, talimat dosyalarını yüklüyor ve gönderiyor.
 *
 * Farkı: bu sonda adaptörü değil **bütün `runSuite` yolunu** koşuyor, çünkü
 * sorulan şeylerden biri `contextHash` — o pin adaptörde değil kayıt kurulurken
 * (`assembleRun`) hesaplanıyor. Yani burada görülen şey gerçek bir koşum
 * kaydının ta kendisi, sahte bir yeniden üretimi değil.
 *
 *   node tools/probe-declared-context.mjs --suite <dosya> --skill <dizin> \
 *     --marker "<istekte aranacak metin>"
 *
 * Çıkış kodu: 0 dosya yüklendi ve ölçüldü · 1 beyan edildi ama yüklenmedi ·
 * 3 host'tan hiç istek çıkmadı (sonda bir şey söyleyemez).
 */
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  declaredButNotLoaded,
  hostMemoryLabel,
  memoryFromOutside,
  parseSuite,
} from '../packages/core/dist/index.js'
import { ClaudeCodeAdapter } from '../packages/adapters/dist/index.js'
import { runSuite } from '../packages/runner/dist/index.js'

const arg = (name) => {
  const at = process.argv.indexOf(name)
  return at === -1 ? undefined : process.argv[at + 1]
}

const suitePath = resolve(arg('--suite') ?? '')
const skillPath = resolve(arg('--skill') ?? '')
const marker = arg('--marker')
if (marker === undefined) {
  console.error('kullanım: --suite <dosya> --skill <dizin> --marker <metin>')
  process.exit(2)
}

const source = readFileSync(suitePath, 'utf8')
const parsed = parseSuite(source)
if (!parsed.ok) {
  console.error(parsed.issues.map((i) => `${i.path}: ${i.message}`).join('\n'))
  process.exit(2)
}

const bodies = []
const server = createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    bodies.push(body)
    res.writeHead(400, { 'content-type': 'application/json' })
    res.end(
      '{"type":"error","error":{"type":"invalid_request_error","message":"assay declared-context probe"}}',
    )
  })
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
process.env['ANTHROPIC_BASE_URL'] = `http://127.0.0.1:${server.address().port}`

try {
  const run = await runSuite(
    // Tek vaka, tek deneme: sonda ölçüm değil, bağlamın kurulup kurulmadığı.
    { ...parsed.suite, cases: [parsed.suite.cases[0]] },
    new ClaudeCodeAdapter({ credentials: { apiKey: 'sk-ant-assay-probe-not-a-key' } }),
    {
      source,
      suitePath,
      skillPath,
      repeat: 1,
      journalDir: await mkdtemp(join(tmpdir(), 'assay-probe-journal-')),
      // `isolate` VERİLMİYOR: kütüphane olarak çağrıldığında varsayılan süreç
      // içi koşum. Sonda kendi adaptör örneğini geçiyor, worker'a ihtiyacı yok.
    },
  )

  const attempt = run.cases[0]?.attempts[0]
  console.log(`attempt verdict    ${attempt?.verdict}`)
  console.log(`attempt reason     ${String(attempt?.reason).slice(0, 300)}`)
  const hits = bodies.join(' ').split(marker).length - 1
  const declared = run.environment?.declaredContext
  const missing = declaredButNotLoaded(run)

  console.log(`suite              ${suitePath}`)
  console.log(`declared by suite  ${parsed.suite.context?.instructions ?? '(none)'}`)
  console.log(`marker             ${JSON.stringify(marker)}`)
  console.log(`requests captured  ${bodies.length}`)
  console.log(`marker in request  ${hits}`)
  console.log(`record.declared    ${declared === undefined ? '(none)' : JSON.stringify(declared)}`)
  console.log(`record.memory      ${hostMemoryLabel(run)}`)
  console.log(`suiteHash          ${run.pins.suiteHash}`)
  console.log(`contextHash        ${run.pins.contextHash ?? '(not measured)'}`)
  console.log(`counted as a leak  ${JSON.stringify(memoryFromOutside(run))}`)
  console.log(`declared, unloaded ${JSON.stringify(missing)}`)

  process.exitCode = bodies.length === 0 ? 3 : missing.length > 0 ? 1 : 0
} finally {
  server.close()
}
