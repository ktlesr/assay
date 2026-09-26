import { describe, expect, it } from 'vitest'
import { labelEdit } from './run-label'

describe('labelEdit — kaydın tek değiştirilebilir alanı (0.4.7-d)', () => {
  it('adsız bir kayda ad verir', () => {
    expect(labelEdit(null, 'arm A — phrase-binding table')).toEqual({
      kind: 'set',
      value: 'arm A — phrase-binding table',
    })
  })

  it('boş kutu adı kaldırır — boş string kaydedilmez', () => {
    expect(labelEdit('arm A', '')).toEqual({ kind: 'set', value: null })
    expect(labelEdit('arm A', '   ')).toEqual({ kind: 'set', value: null })
  })

  it('değer değişmediyse yazma yok: gereksiz denetim kaydı üretilmesin', () => {
    expect(labelEdit('arm A', 'arm A')).toEqual({ kind: 'unchanged' })
    // Kenar boşluğu bir değişiklik değil.
    expect(labelEdit('arm A', '  arm A  ')).toEqual({ kind: 'unchanged' })
    expect(labelEdit(null, '')).toEqual({ kind: 'unchanged' })
  })

  it('şekli bozuk ad reddedilir, CLI ile aynı kuraldan', () => {
    expect(labelEdit(null, 'x'.repeat(121)).kind).toBe('error')
    expect(labelEdit(null, `arm A${String.fromCharCode(10)}arm B`).kind).toBe('error')
  })
})
