import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEME_KEY, applyTheme, readTheme, resolvedTheme, themeScript } from './theme'

/**
 * Tema seçimi.
 *
 * Bu modülün üç sessiz kırılma yolu var ve üçü de kullanıcıya beyaz ekran ya
 * da yanlış temada bir kare olarak görünür: `localStorage` erişiminin
 * fırlatması, `system` seçildiğinde özniteliğin kalması, ve `data-theme`
 * yokken sistem tercihinin okunmaması. Üçü de burada sınanıyor.
 *
 * DOM ve depolama elle taklit ediliyor: tek bir dosya için jsdom ortamı
 * eklemek, koşum süresine bütün test paketinde bedel ödetirdi.
 */

interface FakeRoot {
  attributes: Map<string, string>
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
  getAttribute(name: string): string | null
}

function fakeDom(options: { prefersDark?: boolean; storageThrows?: boolean } = {}) {
  const attributes = new Map<string, string>()
  const root: FakeRoot = {
    attributes,
    setAttribute: (name, value) => void attributes.set(name, value),
    removeAttribute: (name) => void attributes.delete(name),
    getAttribute: (name) => attributes.get(name) ?? null,
  }
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => {
      if (options.storageThrows === true) throw new Error('storage is disabled')
      return store.get(key) ?? null
    },
    setItem: (key: string, value: string) => {
      if (options.storageThrows === true) throw new Error('storage is disabled')
      store.set(key, value)
    },
  }
  vi.stubGlobal('document', { documentElement: root })
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: options.prefersDark === true }),
  })
  return { root, store }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('applyTheme', () => {
  it('açık ve koyu seçimi öznitelik olarak yazar', () => {
    const { root, store } = fakeDom()
    applyTheme('dark')
    expect(root.getAttribute('data-theme')).toBe('dark')
    expect(store.get(THEME_KEY)).toBe('dark')

    applyTheme('light')
    expect(root.getAttribute('data-theme')).toBe('light')
  })

  it('system seçilince özniteliği kaldırır', () => {
    const { root } = fakeDom()
    applyTheme('dark')
    applyTheme('system')
    expect(root.getAttribute('data-theme')).toBeNull()
  })

  it('depolama kapalıyken de temayı uygular', () => {
    const { root } = fakeDom({ storageThrows: true })
    expect(() => applyTheme('dark')).not.toThrow()
    expect(root.getAttribute('data-theme')).toBe('dark')
  })
})

describe('readTheme', () => {
  it('saklanmış seçimi döner', () => {
    fakeDom()
    applyTheme('light')
    expect(readTheme()).toBe('light')
  })

  it('hiçbir şey saklanmamışsa system döner', () => {
    fakeDom()
    expect(readTheme()).toBe('system')
  })

  it('tanınmayan değer system sayılır', () => {
    const { store } = fakeDom()
    store.set(THEME_KEY, 'neon')
    expect(readTheme()).toBe('system')
  })

  it('depolama fırlatıyorsa system döner', () => {
    fakeDom({ storageThrows: true })
    expect(readTheme()).toBe('system')
  })
})

describe('resolvedTheme', () => {
  it('açık seçim varsa onu döner', () => {
    fakeDom({ prefersDark: true })
    applyTheme('light')
    expect(resolvedTheme()).toBe('light')
  })

  it('seçim yoksa sistem tercihini okur', () => {
    fakeDom({ prefersDark: true })
    expect(resolvedTheme()).toBe('dark')
    vi.unstubAllGlobals()
    fakeDom({ prefersDark: false })
    expect(resolvedTheme()).toBe('light')
  })
})

describe('themeScript', () => {
  it('anahtarı gömer ve try/catch içinde koşar', () => {
    expect(themeScript).toContain(JSON.stringify(THEME_KEY))
    expect(themeScript).toContain('try{')
    expect(themeScript).toContain('catch')
  })

  it('yalnızca açık seçimi uygular; system özniteliği yazılmaz', () => {
    expect(themeScript).toContain("t==='light'||t==='dark'")
  })
})
