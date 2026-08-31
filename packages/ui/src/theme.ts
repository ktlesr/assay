/**
 * Tema seçimi.
 *
 * Üç durum: `light`, `dark`, `system`. Seçim `localStorage`'da; sistem
 * tercihi seçilmediği sürece CSS'teki `prefers-color-scheme` devrede.
 *
 * Flash olmaması için `themeScript` <head> içinde, boyamadan önce koşar.
 */

export type Theme = 'light' | 'dark' | 'system'

export const THEME_KEY = 'assay-theme'

/**
 * <head> içine inline konur. Boyamadan önce `data-theme` yazar; böylece
 * yanlış temada bir kare bile görünmez.
 *
 * Try/catch şart: gizli sekmede `localStorage` erişimi fırlatabiliyor ve
 * o durumda sayfa hiç boyanmazdı.
 */
export const themeScript = `(function(){try{
var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});
if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}
}catch(e){}})()`

/** Seçimi uygular ve saklar. `system` seçilirse öznitelik kaldırılır. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Depolama kapalıysa seçim bu sekmede kalır; sayfa yine çalışır.
  }
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // yok say
  }
  return 'system'
}

/** O anda ekranda hangi tema var — `system` çözülmüş hâliyle. */
export function resolvedTheme(): 'light' | 'dark' {
  const explicit = document.documentElement.getAttribute('data-theme')
  if (explicit === 'light' || explicit === 'dark') return explicit
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
