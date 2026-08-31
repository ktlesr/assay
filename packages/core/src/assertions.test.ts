import { describe, expect, it } from 'vitest'
import { combineVerdicts, evaluateAssertion, evaluateAssertions } from './assertions.js'
import type { CapturedFile, Evidence, TraceEvent } from './records.js'
import type { Assertion } from './suite.js'

const bytes = (s: string) => new TextEncoder().encode(s)
const file = (path: string, content: string): CapturedFile => ({
  path,
  bytes: bytes(content),
})

/** Gerçek bir docx/xlsx'in ilk baytları: zip yerel başlığı + girdi adı. */
const zip = (entry: string): CapturedFile => {
  const head = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])
  const name = bytes(entry)
  const merged = new Uint8Array(head.length + name.length)
  merged.set(head)
  merged.set(name, head.length)
  return {
    path: entry.endsWith('workbook.xml') ? 'out/book.xlsx' : 'out/report.docx',
    bytes: merged,
  }
}

describe('kanıt eksikse unknown — değişmez #1', () => {
  const cases: ReadonlyArray<[Assertion, string]> = [
    [{ type: 'file_exists', path: 'out/*.docx' }, 'no files were captured'],
    [
      { type: 'file_valid', format: 'docx', path: 'out/a.docx' },
      'no files were captured',
    ],
    [{ type: 'exit_code', equals: 0 }, 'did not report an exit code'],
    [{ type: 'trace', rule: 'tool_called', tool: 'Write' }, 'no trace was captured'],
    [{ type: 'side_effect', network: 'deny' }, 'no environment diff'],
  ]

  it.each(cases)('%o → unknown', (assertion, fragment) => {
    const result = evaluateAssertion(assertion, {})
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain(fragment)
  })

  it('boş kanıtla hiçbir assertion pass dönmez', () => {
    for (const [assertion] of cases) {
      expect(evaluateAssertion(assertion, {}).verdict).not.toBe('pass')
    }
  })

  it('boş dosya listesi "kanıt yok" ile aynı şey değildir', () => {
    const result = evaluateAssertion(
      { type: 'file_exists', path: 'out/*.docx' },
      { files: [] },
    )
    expect(result.verdict).toBe('fail')
  })
})

describe('file_exists', () => {
  const files = [file('out/report.docx', 'x'), file('out/notes.md', 'y')]

  it.each([
    ['out/*.docx', 'pass'],
    ['out/**', 'pass'],
    ['**/*.md', 'pass'],
    ['out/report.doc?', 'pass'],
    ['dist/*.docx', 'fail'],
    ['*.docx', 'fail'],
  ])('%s → %s', (path, verdict) => {
    expect(evaluateAssertion({ type: 'file_exists', path }, { files }).verdict).toBe(
      verdict,
    )
  })

  it('eşleşen dosyaları raporlar', () => {
    const result = evaluateAssertion({ type: 'file_exists', path: 'out/*' }, { files })
    expect(result.detail?.['matched']).toEqual(['out/report.docx', 'out/notes.md'])
  })
})

describe('file_valid', () => {
  it.each([
    ['json', file('out/a.json', '{"a":1}'), 'pass'],
    ['json', file('out/a.json', '{a:1'), 'fail'],
    ['yaml', file('out/a.yaml', 'a: 1\n'), 'pass'],
    ['yaml', file('out/a.yaml', 'a: [1\n'), 'fail'],
    ['pdf', file('out/a.pdf', '%PDF-1.7\nbody\n%%EOF'), 'pass'],
    ['pdf', file('out/a.pdf', 'not a pdf'), 'fail'],
    ['pdf', file('out/a.pdf', '%PDF-1.7\nbody'), 'fail'],
  ] as const)('%s %s → %s', (format, captured, verdict) => {
    const result = evaluateAssertion(
      { type: 'file_valid', format, path: captured.path },
      { files: [captured] },
    )
    expect(result.verdict).toBe(verdict)
  })

  it('docx zip sihirli baytları ve word/document.xml ister', () => {
    const good = zip('word/document.xml')
    expect(
      evaluateAssertion(
        { type: 'file_valid', format: 'docx' },
        { files: [good] },
        {
          fileExistsGlobs: ['out/*.docx'],
        },
      ).verdict,
    ).toBe('pass')

    const notZip = file('out/report.docx', 'plain text pretending to be docx')
    expect(
      evaluateAssertion(
        { type: 'file_valid', format: 'docx', path: 'out/report.docx' },
        { files: [notZip] },
      ).verdict,
    ).toBe('fail')

    const wrongEntry = zip('xl/workbook.xml')
    expect(
      evaluateAssertion(
        { type: 'file_valid', format: 'docx', path: 'out/book.xlsx' },
        { files: [wrongEntry] },
      ).verdict,
    ).toBe('fail')
  })

  it("yol verilmezse aynı vakanın file_exists glob'larına düşer", () => {
    const results = evaluateAssertions(
      [
        { type: 'file_exists', path: 'out/*.json' },
        { type: 'file_valid', format: 'json' },
      ],
      { files: [file('out/a.json', '{"ok":true}'), file('other/b.json', 'broken{')] },
    )
    expect(results.map((r) => r.verdict)).toEqual(['pass', 'pass'])
  })

  it('yol verilmediğinde eşleşen dosya yoksa fail', () => {
    const result = evaluateAssertion(
      { type: 'file_valid', format: 'json' },
      { files: [] },
      {
        fileExistsGlobs: ['out/*.json'],
      },
    )
    expect(result.verdict).toBe('fail')
  })
})

describe('json_schema', () => {
  const schema = {
    type: 'object',
    required: ['title'],
    properties: { title: { type: 'string' } },
  }

  it('şemaya uyan dosya pass', () => {
    const result = evaluateAssertion(
      { type: 'json_schema', path: 'out/a.json', schema },
      { files: [file('out/a.json', '{"title":"hello"}')] },
    )
    expect(result.verdict).toBe('pass')
  })

  it('şemaya uymayan dosya fail ve nedeni yazar', () => {
    const result = evaluateAssertion(
      { type: 'json_schema', path: 'out/a.json', schema },
      { files: [file('out/a.json', '{"title":42}')] },
    )
    expect(result.verdict).toBe('fail')
    expect(result.reason).toContain('/title')
  })

  it('bozuk JSON fail', () => {
    const result = evaluateAssertion(
      { type: 'json_schema', path: 'out/a.json', schema },
      { files: [file('out/a.json', 'nope')] },
    )
    expect(result.verdict).toBe('fail')
  })

  it('derlenemeyen şema unknown, fail değil', () => {
    const result = evaluateAssertion(
      { type: 'json_schema', path: 'out/a.json', schema: { type: 'nonsense' } },
      { files: [file('out/a.json', '{}')] },
    )
    expect(result.verdict).toBe('unknown')
  })
})

describe('exit_code ve file_content_matches', () => {
  it('exit_code eşleşmesi', () => {
    expect(
      evaluateAssertion({ type: 'exit_code', equals: 0 }, { exitCode: 0 }).verdict,
    ).toBe('pass')
    expect(
      evaluateAssertion({ type: 'exit_code', equals: 0 }, { exitCode: 1 }).verdict,
    ).toBe('fail')
  })

  it('exit_code 0 varlığı "kanıt yok" ile karışmaz', () => {
    expect(
      evaluateAssertion({ type: 'exit_code', equals: 0 }, { exitCode: 0 }).verdict,
    ).toBe('pass')
    expect(evaluateAssertion({ type: 'exit_code', equals: 0 }, {}).verdict).toBe(
      'unknown',
    )
  })

  it('regex eşleşmesi ve bayraklar', () => {
    const files = [file('out/a.md', '# Title\nbody')]
    expect(
      evaluateAssertion(
        { type: 'file_content_matches', path: 'out/a.md', matches: '^# ' },
        { files },
      ).verdict,
    ).toBe('pass')
    expect(
      evaluateAssertion(
        { type: 'file_content_matches', path: 'out/a.md', matches: '^body', flags: 'm' },
        { files },
      ).verdict,
    ).toBe('pass')
    expect(
      evaluateAssertion(
        { type: 'file_content_matches', path: 'out/a.md', matches: '^body' },
        { files },
      ).verdict,
    ).toBe('fail')
  })
})

describe("trace assertion'ları", () => {
  const trace: TraceEvent[] = [
    { seq: 1, kind: 'tool_call', tool: 'Read', args: { path: 'draft.md' } },
    { seq: 2, kind: 'tool_result', tool: 'Read' },
    { seq: 3, kind: 'tool_call', tool: 'Write', args: { path: 'out/a.docx' } },
    { seq: 4, kind: 'tool_result', tool: 'Write' },
    { seq: 5, kind: 'session_end', outcome: 'completed' },
  ]

  it('tool_called sayıyı ve eşiği kontrol eder', () => {
    expect(
      evaluateAssertion({ type: 'trace', rule: 'tool_called', tool: 'Write' }, { trace })
        .verdict,
    ).toBe('pass')
    expect(
      evaluateAssertion(
        { type: 'trace', rule: 'tool_called', tool: 'Write', min_times: 2 },
        { trace },
      ).verdict,
    ).toBe('fail')
    expect(
      evaluateAssertion({ type: 'trace', rule: 'tool_called', tool: 'Bash' }, { trace })
        .verdict,
    ).toBe('fail')
  })

  it('tool_sequence sırayı arar, bitişikliği değil', () => {
    expect(
      evaluateAssertion(
        { type: 'trace', rule: 'tool_sequence', tools: ['Read', 'Write'] },
        { trace },
      ).verdict,
    ).toBe('pass')
    expect(
      evaluateAssertion(
        { type: 'trace', rule: 'tool_sequence', tools: ['Write', 'Read'] },
        { trace },
      ).verdict,
    ).toBe('fail')
  })

  it('tool_args_valid argümanları şemaya sokar', () => {
    const schema = {
      type: 'object',
      required: ['path'],
      properties: { path: { type: 'string' } },
    }
    expect(
      evaluateAssertion(
        { type: 'trace', rule: 'tool_args_valid', tool: 'Write', schema },
        { trace },
      ).verdict,
    ).toBe('pass')
    expect(
      evaluateAssertion(
        {
          type: 'trace',
          rule: 'tool_args_valid',
          tool: 'Write',
          schema: { type: 'object', required: ['missing'] },
        },
        { trace },
      ).verdict,
    ).toBe('fail')
    expect(
      evaluateAssertion(
        { type: 'trace', rule: 'tool_args_valid', tool: 'Bash', schema },
        { trace },
      ).reason,
    ).toContain('never called')
  })

  it('eksik alanlı trace assertion unknown döner, fail değil', () => {
    for (const assertion of [
      { type: 'trace', rule: 'tool_called' },
      { type: 'trace', rule: 'tool_args_valid', tool: 'Write' },
    ] as Assertion[]) {
      expect(evaluateAssertion(assertion, { trace }).verdict).toBe('unknown')
    }
  })

  it('tool_args_valid derlenemeyen şemayla unknown', () => {
    const result = evaluateAssertion(
      {
        type: 'trace',
        rule: 'tool_args_valid',
        tool: 'Write',
        schema: { type: 'nonsense' },
      },
      { trace },
    )
    expect(result.verdict).toBe('unknown')
  })

  it('no_swallowed_errors modüle devrediyor', () => {
    expect(
      evaluateAssertion({ type: 'trace', rule: 'no_swallowed_errors' }, { trace })
        .verdict,
    ).toBe('pass')
  })
})

describe('side_effect', () => {
  const env = {
    writes: ['out/a.docx', 'out/sub/b.docx'],
    deletes: [],
    network: [{ host: 'api.example.com', blocked: true }],
  }

  it('sınır içinde yazım pass', () => {
    expect(
      evaluateAssertion({ type: 'side_effect', writes_within: ['out/'] }, { env })
        .verdict,
    ).toBe('pass')
  })

  it('sınır dışına yazım fail ve yolları listeler', () => {
    const strayEnv = { ...env, writes: [...env.writes, '/etc/passwd'] }
    const result = evaluateAssertion(
      { type: 'side_effect', writes_within: ['out/'] },
      { env: strayEnv },
    )
    expect(result.verdict).toBe('fail')
    expect(result.reason).toContain('/etc/passwd')
  })

  it('engellenmiş ağ isteği network: deny ile uyumlu', () => {
    expect(
      evaluateAssertion({ type: 'side_effect', network: 'deny' }, { env }).verdict,
    ).toBe('pass')
  })

  it('kabuk çağrısı varsa yan etki iddiası unknown — liste eksik olabilir', () => {
    // 1.3 güvenlik incelemesi: kabuk komutunun ne yazdığını göremiyoruz.
    const opaque = { ...env, unobserved: ['Bash'] }
    const result = evaluateAssertion(
      { type: 'side_effect', writes_within: ['out/'], network: 'deny' },
      { env: opaque },
    )
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('cannot observe')
  })

  it('gözlenemeyen çağrı yoksa iddia ölçülebilir kalır', () => {
    const result = evaluateAssertion(
      { type: 'side_effect', writes_within: ['out/'] },
      { env: { ...env, unobserved: [] } },
    )
    expect(result.verdict).toBe('pass')
  })

  it('geçen ağ isteği network: deny ile fail', () => {
    const leaky = { ...env, network: [{ host: 'evil.example.com', blocked: false }] }
    const result = evaluateAssertion(
      { type: 'side_effect', network: 'deny' },
      { env: leaky },
    )
    expect(result.verdict).toBe('fail')
    expect(result.reason).toContain('evil.example.com')
  })
})

describe('combineVerdicts', () => {
  it('tek fail her şeyi fail yapar', () => {
    expect(
      combineVerdicts([
        { verdict: 'pass', reason: 'a' },
        { verdict: 'fail', reason: 'b' },
        { verdict: 'unknown', reason: 'c' },
      ]).verdict,
    ).toBe('fail')
  })

  it('fail yok ama unknown varsa unknown — ölçülemeyen geçmiş sayılmaz', () => {
    expect(
      combineVerdicts([
        { verdict: 'pass', reason: 'a' },
        { verdict: 'unknown', reason: 'b' },
      ]).verdict,
    ).toBe('unknown')
  })

  it('hepsi pass ise pass', () => {
    expect(combineVerdicts([{ verdict: 'pass', reason: 'a' }]).verdict).toBe('pass')
  })

  it('hiç assertion yoksa unknown, pass değil', () => {
    const result = combineVerdicts([])
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('nothing was asserted')
  })
})

describe('evaluateAssertions', () => {
  it("her assertion için bir sonuç döner ve assertion'ı taşır", () => {
    const assertions: Assertion[] = [
      { type: 'file_exists', path: 'out/*.json' },
      { type: 'exit_code', equals: 0 },
    ]
    const evidence: Evidence = { files: [file('out/a.json', '{}')], exitCode: 0 }
    const results = evaluateAssertions(assertions, evidence)
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.assertion)).toEqual(assertions)
    expect(results.every((r) => r.reason.length > 0)).toBe(true)
  })
})
