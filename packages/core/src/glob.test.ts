import { describe, expect, it } from 'vitest'
import { isWithin, matchGlob, normalizePath } from './glob.js'

describe('normalizePath', () => {
  it.each([
    ['./out/a.docx', 'out/a.docx'],
    ['out//a.docx', 'out/a.docx'],
    ['out\\a.docx', 'out/a.docx'],
    ['out/', 'out'],
    ['out/a.docx', 'out/a.docx'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected)
  })
})

describe('matchGlob', () => {
  it.each([
    ['out/*.docx', 'out/a.docx', true],
    ['out/*.docx', 'out/sub/a.docx', false],
    ['out/**', 'out/sub/a.docx', true],
    ['out/**/*.docx', 'out/sub/deep/a.docx', true],
    ['out/**/*.docx', 'out/a.docx', true],
    ['**/*.json', 'a.json', true],
    ['**/*.json', 'x/y/a.json', true],
    ['report-?.pdf', 'report-1.pdf', true],
    ['report-?.pdf', 'report-12.pdf', false],
    ['out/a.docx', './out/a.docx', true],
    ['*.docx', 'out/a.docx', false],
    ['out/*', 'out/a.docx', true],
    ['out/*', 'out/sub/a.docx', false],
  ])('%s vs %s → %s', (pattern, path, expected) => {
    expect(matchGlob(pattern, path)).toBe(expected)
  })

  it('regex özel karakterleri kaçırılır, yorumlanmaz', () => {
    expect(matchGlob('out/a.docx', 'out/aXdocx')).toBe(false)
    expect(matchGlob('out/a+b.txt', 'out/a+b.txt')).toBe(true)
    expect(matchGlob('out/(x).txt', 'out/(x).txt')).toBe(true)
  })
})

describe('isWithin', () => {
  it.each([
    [['out/'], 'out/a.docx', true],
    [['out'], 'out/sub/a.docx', true],
    [['out/'], 'output/a.docx', false],
    [['out/'], '/etc/passwd', false],
    [['out/', 'tmp/'], 'tmp/x', true],
    [[], 'out/a', false],
    [['.'], 'anything', true],
  ])('%o içinde %s → %s', (prefixes, path, expected) => {
    expect(isWithin(prefixes, path)).toBe(expected)
  })

  it('önek eşleşmesi dizin sınırında durur', () => {
    expect(isWithin(['out'], 'outer/a')).toBe(false)
    expect(isWithin(['out'], 'out')).toBe(true)
  })
})
