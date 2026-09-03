import { existsSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

/**
 * GitHub Actions Marketplace'in yayın koşulları.
 *
 * Bunlar bir stil tercihi değil, yayının kabul edilme şartları ve hepsi
 * sessizce bozulabilir: dosya taşınır, `branding` silinir, ad değişir. Yayın
 * anında öğrenmek yerine testte öğrenmek istiyoruz — depo bir kez
 * yayımlandıktan sonra kırık bir `action.yml` marketplace listesini düşürür.
 *
 * Kaynak: docs.github.com — "Publishing actions in GitHub Marketplace".
 */
const raw = existsSync('action.yml') ? readFileSync('action.yml', 'utf8') : null
const action = raw === null ? null : (parse(raw) as Record<string, unknown>)

describe('marketplace koşulları', () => {
  it('eylem tanımı deponun KÖKÜNDE', () => {
    // Marketplace kökte arıyor. `action/action.yml` çalışan bir eylemdi ama
    // yayımlanamıyordu; bu testin var olma sebebi o.
    expect(raw).not.toBeNull()
    expect(existsSync('action/action.yml')).toBe(false)
  })

  it('tek bir eylem tanımı var', () => {
    // "Deponuz yalnızca bir eylem içermeli" — iki tanım yayını reddettiriyor.
    expect(existsSync('action/action.yml')).toBe(false)
  })

  it('ad, açıklama ve yazar dolu', () => {
    expect(typeof action?.['name']).toBe('string')
    expect(String(action?.['name']).length).toBeGreaterThan(0)
    expect(String(action?.['description']).length).toBeGreaterThan(20)
    expect(String(action?.['author']).length).toBeGreaterThan(0)
  })

  it('branding ikon ve rengi geçerli', () => {
    const branding = action?.['branding'] as { icon?: string; color?: string } | undefined
    expect(branding).toBeDefined()
    // Marketplace yalnızca bu beş rengi kabul ediyor.
    expect(['white', 'yellow', 'blue', 'green', 'orange', 'red', 'purple', 'gray-dark'])
      .toContain(branding?.color)
    expect(String(branding?.icon).length).toBeGreaterThan(0)
  })

  it('betik yolları kökten çözülüyor', () => {
    // Tanım köke taşındı ama betikler `action/` altında kaldı; yolların
    // güncellenmemesi eylemi çalışma zamanında düşürürdü.
    const steps = (action?.['runs'] as { steps?: { run?: string }[] } | undefined)?.steps
    const commands = (steps ?? []).map((step) => step.run ?? '').join('\n')
    for (const script of ['action/run.mjs', 'action/comment.mjs']) {
      expect(commands).toContain(script)
      expect(existsSync(script)).toBe(true)
    }
  })

  it('kimlik bilgisi girdisi var ve zorunlu tutulmuyor', () => {
    // İkisinden biri yeterli, o yüzden ikisi de `required: false`; eksikliği
    // eylem kendi adımında kontrol ediyor ve net bir hata veriyor.
    const inputs = action?.['inputs'] as Record<string, { required?: boolean }>
    expect(inputs['anthropic-api-key']).toBeDefined()
    expect(inputs['claude-code-oauth-token']).toBeDefined()
    expect(inputs['anthropic-api-key']?.required ?? false).toBe(false)
  })

  it('CLI sürümü pinli — ölçüm aracının kendisi kaymaz', () => {
    const inputs = action?.['inputs'] as Record<string, { default?: string }>
    const pinned = String(inputs['assay-version']?.default ?? '')
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/)
    // Pin, yayımlanmış sürümle aynı olmalı: eylem var olmayan bir sürümü
    // kurmaya çalışırsa her koşum kurulum hatasıyla düşer.
    const published = JSON.parse(readFileSync('packages/cli/package.json', 'utf8')) as {
      version: string
    }
    expect(pinned).toBe(published.version)
  })

  it('gizli girdiler kütüğe yazılmıyor', () => {
    // `echo`/`cat` ile bir secret'ı basmak onu koşum kütüğüne koyar ve kütük
    // deponun okuyucularına açıktır.
    expect(raw).not.toMatch(/echo .*inputs\.(anthropic-api-key|claude-code-oauth-token)/)
  })
})
