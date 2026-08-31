import { describe, expect, it } from 'vitest'
import { parseSuite, type SuiteIssue } from './suite.js'

/** Geçerli bir taban suite. Testler bunun üzerine tek bir bozukluk bindirir. */
const VALID = `
version: 3
target:
  skill: docx
  source: anthropics/skills@0f1c2d3
environment:
  host: claude-code
  model: claude-opus-5-20260514
  system_prompt_hash: sha256:9f2b1c0a
  active_skills: [docx, pdf, xlsx]
runs: 10
cases:
  - id: trigger.positive.explicit
    prompt: "Bu taslağı Word belgesine çevir."
    expect: { triggered: true }
  - id: trigger.negative.unrelated
    prompt: "Bugün hava nasıl?"
    expect: { triggered: false }
  - id: trigger.negative.near_neighbor.pdf
    prompt: "Bu taslağı PDF olarak dışa aktar."
    expect: { triggered: false }
  - id: complete.creates_valid_document
    prompt: "Bu taslaktan bir rapor üret."
    setup: { fixtures: ./fixtures/draft.md }
    expect:
      triggered: true
      assertions:
        - { type: file_exists, path: "out/*.docx" }
        - { type: file_valid, format: docx }
        - { type: trace, rule: no_swallowed_errors }
        - { type: side_effect, writes_within: ["out/"], network: deny }
`

const errorsOf = (issues: SuiteIssue[]) => issues.filter((i) => i.level === 'error')
const messagesOf = (issues: SuiteIssue[]) => issues.map((i) => i.message).join('\n')

function parse(yaml: string) {
  return parseSuite(yaml)
}

/** Taban suite'te bir satırı değiştirip yeniden koşmak için. */
function withReplacement(from: string, to: string): string {
  if (!VALID.includes(from)) throw new Error(`test fixture drifted: "${from}" not found`)
  return VALID.replace(from, to)
}

describe('parseSuite — geçerli suite', () => {
  it('taban suite hatasız ve uyarısız geçer', () => {
    const result = parse(VALID)
    expect(result.issues).toEqual([])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.suite.target.skill).toBe('docx')
    expect(result.suite.runs).toBe(10)
    expect(result.suite.cases).toHaveLength(4)
  })

  it('coexistence vakası active_skills ile birlikte geçerlidir', () => {
    const result = parse(
      withReplacement(
        '  - id: trigger.negative.unrelated',
        `  - id: coexistence.collision.pdf_steals
    prompt: "Bu taslağı belge hâline getir."
    expect: { triggered: true, not_triggered: [pdf] }
  - id: trigger.negative.unrelated`,
      ),
    )
    expect(errorsOf(result.issues)).toEqual([])
    expect(result.ok).toBe(true)
  })
})

describe('parseSuite — biçim hataları', () => {
  it('geçersiz YAML eyleme dönük mesaj verir', () => {
    const result = parse('version: 1\n  target: [')
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('not valid YAML')
  })

  it('boş suite reddedilir', () => {
    const result = parse('\n# yalnızca yorum\n')
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('empty')
  })

  it('hata yolu YAML konumunu gösterir', () => {
    const result = parse(
      withReplacement('  - id: trigger.positive.explicit', '  - id: BÜYÜK'),
    )
    expect(result.ok).toBe(false)
    expect(result.issues.map((i) => i.path)).toContain('cases[0].id')
  })
})

describe('parseSuite — dört pin', () => {
  const pins: ReadonlyArray<[string, string, string]> = [
    ['pin 1 skill sürümü', '  source: anthropics/skills@0f1c2d3', 'target.source'],
    ['pin 2 model kimliği', '  model: claude-opus-5-20260514', 'environment.model'],
    [
      'pin 3 sistem promptu hash',
      '  system_prompt_hash: sha256:9f2b1c0a',
      'environment.system_prompt_hash',
    ],
    ['pin 4 vaka seti sürümü', 'version: 3', 'version'],
  ]

  it.each(pins)('%s eksikse hata', (_name, line, path) => {
    const result = parse(VALID.replace(`${line}\n`, ''))
    expect(result.ok).toBe(false)
    expect(result.issues.map((i) => i.path)).toContain(path)
  })

  it('model "latest" olamaz uyarısı mesajda geçer', () => {
    const result = parse(
      withReplacement('  model: claude-opus-5-20260514', '  model: ""'),
    )
    expect(messagesOf(result.issues)).toContain('never "latest"')
  })
})

describe('parseSuite — değişmez #3: tekrar sayısı', () => {
  it.each([[1], [0], [-3]])('runs: %i reddedilir', (runs) => {
    const result = parse(withReplacement('runs: 10', `runs: ${runs}`))
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('observation, not a measurement')
  })

  it('runs: 2 kabul edilir', () => {
    expect(parse(withReplacement('runs: 10', 'runs: 2')).ok).toBe(true)
  })
})

describe('parseSuite — değişmez #5: negatif ve yakın komşu', () => {
  it('hiç negatif vaka yoksa hata', () => {
    const result = parse(
      withReplacement(
        '    expect: { triggered: false }',
        '    expect: { triggered: true }',
      ).replace('    expect: { triggered: false }', '    expect: { triggered: true }'),
    )
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('no negative case')
  })

  it('yakın komşu yoksa uyarı, hata değil', () => {
    const result = parse(
      withReplacement(
        '  - id: trigger.negative.near_neighbor.pdf',
        '  - id: trigger.negative.other',
      ),
    )
    expect(result.ok).toBe(true)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]?.level).toBe('warning')
    expect(result.issues[0]?.message).toContain('no near-neighbour case')
  })
})

describe('parseSuite — vaka kimlikleri', () => {
  it('yinelenen id hata verir ve ilk konumu gösterir', () => {
    const result = parse(
      withReplacement(
        '  - id: trigger.negative.unrelated',
        '  - id: trigger.positive.explicit',
      ),
    )
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('first defined at cases[0]')
  })

  it.each([['flat'], ['Trigger.Positive'], ['trigger..positive'], ['trigger.pos itive']])(
    'hiyerarşik olmayan id reddedilir: %s',
    (id) => {
      const result = parse(
        withReplacement('  - id: trigger.positive.explicit', `  - id: "${id}"`),
      )
      expect(result.ok).toBe(false)
      expect(messagesOf(result.issues)).toContain('hierarchical')
    },
  )

  it('hiçbir şey ölçmeyen vaka reddedilir', () => {
    const result = parse(
      withReplacement('    expect: { triggered: true }', '    expect: {}'),
    )
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('measures nothing')
  })
})

describe('parseSuite — coexistence', () => {
  const withCoexistence = (activeSkills: string) =>
    withReplacement('  active_skills: [docx, pdf, xlsx]', activeSkills).replace(
      '    expect: { triggered: true }',
      '    expect: { triggered: true, not_triggered: [pdf] }',
    )

  it('active_skills yokken not_triggered hata verir', () => {
    const result = parse(withCoexistence('  active_skills: []'))
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('environment.active_skills is empty')
  })

  it('active_skills alanı hiç yokken de hata verir', () => {
    const result = parse(
      VALID.replace('  active_skills: [docx, pdf, xlsx]\n', '').replace(
        '    expect: { triggered: true }',
        '    expect: { triggered: true, not_triggered: [pdf] }',
      ),
    )
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('environment.active_skills is empty')
  })

  it('not_triggered active_skills dışında bir skill sayamaz', () => {
    const result = parse(withCoexistence('  active_skills: [docx]'))
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('not listed in environment.active_skills')
  })

  it("active_skills v0'da opsiyoneldir", () => {
    const result = parse(VALID.replace('  active_skills: [docx, pdf, xlsx]\n', ''))
    expect(result.ok).toBe(true)
  })
})

describe('parseSuite — assertion şekilleri', () => {
  const withAssertion = (assertion: string) =>
    withReplacement(
      '        - { type: trace, rule: no_swallowed_errors }',
      `        - ${assertion}`,
    )

  it('bilinmeyen assertion tipi reddedilir', () => {
    const result = parse(withAssertion('{ type: vibes_ok }'))
    expect(result.ok).toBe(false)
  })

  it.each([
    ['{ type: trace, rule: tool_called }', 'requires tool'],
    ['{ type: trace, rule: tool_sequence }', 'requires tools'],
    ['{ type: trace, rule: tool_sequence, tools: [Write] }', 'at least two tools'],
    ['{ type: trace, rule: tool_args_valid, tool: Write }', 'requires schema'],
    ['{ type: side_effect }', 'asserts nothing'],
  ])('%s → %s', (assertion, expectedMessage) => {
    const result = parse(withAssertion(assertion))
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain(expectedMessage)
  })

  it.each([
    '{ type: trace, rule: tool_called, tool: Write }',
    '{ type: trace, rule: tool_sequence, tools: [Read, Write] }',
    '{ type: trace, rule: tool_args_valid, tool: Write, schema: { type: object } }',
    '{ type: side_effect, network: deny }',
    '{ type: exit_code, equals: 0 }',
    '{ type: file_content_matches, path: "out/a.md", matches: "^# ", flags: m }',
    '{ type: json_schema, path: "out/a.json", schema: { type: object } }',
  ])('geçerli assertion kabul edilir: %s', (assertion) => {
    expect(errorsOf(parse(withAssertion(assertion)).issues)).toEqual([])
  })

  it('yolsuz file_valid, aynı vakada file_exists yoksa reddedilir', () => {
    const result = parse(
      withReplacement('        - { type: file_exists, path: "out/*.docx" }\n', ''),
    )
    expect(result.ok).toBe(false)
    expect(messagesOf(result.issues)).toContain('file_valid without a path')
  })

  it('yolsuz file_valid, file_exists varsa kabul edilir', () => {
    expect(parse(VALID).ok).toBe(true)
  })
})
