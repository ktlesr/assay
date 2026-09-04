'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Ölçüm alanı — sayfanın arkasında duran hareketli zemin.
 *
 * Bu bir dekor değil, **ürünün kendi işaretleri**. Gradient bulutu ya da
 * parlayan küre yok; arkada duran şey milimetrik kâğıt ve üzerinde açılan
 * ölçüm halkaları. Bir ölçüm aracının zemini ölçümden yapılır.
 *
 * Üç katman, hepsi akromatik ve hepsi %2–6 mürekkep:
 *
 *  1. **Izgara** — hairline cetvel ızgarası. Sabit: sürüklenmiyor, parça parça
 *     belirip kaybolmuyor. Sayfanın kâğıt olduğunu söyleyen tek şey; beyaz
 *     zemin tek başına düz durur. Kâğıt durur, üstünde olan biter hareket eder.
 *  2. **Halkalar** — ölçülen bir noktadan dışa açılan üç eşmerkezli hairline
 *     çember. Güven aralığının radyal hâli: içteki halka değeri, dıştakiler
 *     belirsizliği çiziyor. Kendiliğinden seyrek aralıklarla doğuyor; işaretçi
 *     bastığında o noktada bir tane daha doğuyor — sayfa dokunulduğunu
 *     biliyor ama dokunulmayı beklemiyor.
 *  3. **Işık** — beyazın ortasında bir ton daha açık bir alan. Renk değil
 *     parlaklık; saf beyazın düz durmasını engelliyor.
 *
 * Maliyet: halkalar yalnızca `transform` ve `opacity` animasyonu — ikisi de
 * compositor'da. Aynı anda en fazla `MAX_RIPPLES` halka kümesi yaşıyor;
 * hızlı tıklama bile DOM'u büyütmüyor. `will-change` bilerek yok: sürekli
 * koşan bir katmanı GPU'ya sabitlemek pil yakar.
 *
 * `prefers-reduced-motion` açıkken hiç halka doğmuyor — alan ızgara ve
 * ışıktan ibaret, tamamen duruyor. Kaybolan bir şey yok, yalnızca duran
 * bir şey var.
 */
export function InstrumentField() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const spawn = useCallback((x: number, y: number) => {
    const id = nextId.current++
    setRipples((prev) => {
      const next = [...prev, { id, x, y }]
      // Tavan: eskisi düşer, yenisi girer. Sınırsız liste, hızlı tıklamada
      // DOM'u büyütür ve zemin "ortam" olmaktan çıkar.
      return next.length > MAX_RIPPLES ? next.slice(next.length - MAX_RIPPLES) : next
    })
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, RIPPLE_LIFETIME_MS)
    timers.current.add(timer)
  }, [])

  useEffect(() => {
    // Hareket kısıtı varsa alan sessiz kalıyor: ne kendiliğinden halka doğuyor
    // ne de işaretçi bir tane doğuruyor.
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ambient = setInterval(() => {
      // Kenarlardan uzak durulmuyor: yarısı ekran dışında kalan bir halka
      // "ölçüm alanı sayfadan büyük" diyor, ki öyle.
      spawn(Math.random() * window.innerWidth, Math.random() * window.innerHeight)
    }, AMBIENT_INTERVAL_MS)

    // Dinleyici `window` üzerinde: alan `pointer-events: none` ve içeriğin
    // ARKASINDA duruyor. Kendi üstünde dinleseydi ya hiç tetiklenmezdi ya da
    // sayfanın tıklamalarını yutardı — ikincisi çalışan bir şeyi bozardı.
    const onPointerDown = (event: PointerEvent) => spawn(event.clientX, event.clientY)
    window.addEventListener('pointerdown', onPointerDown, { passive: true })

    const pending = timers.current
    return () => {
      clearInterval(ambient)
      window.removeEventListener('pointerdown', onPointerDown)
      for (const timer of pending) clearTimeout(timer)
      pending.clear()
    }
  }, [spawn])

  return (
    <div className="field" aria-hidden="true">
      <div className="field-light" />
      <div className="field-grid" />
      <div className="field-ripples">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="field-ripple"
            style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
          >
            {RING_DELAYS.map((delay) => (
              <i
                key={delay}
                className="field-ring"
                style={{ '--delay': `${delay}s` } as React.CSSProperties}
              />
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

interface Ripple {
  id: number
  x: number
  y: number
}

/**
 * Üç halka, gecikmeleri eşit değil: 0 → 0.22 → 0.5. Eşit gecikme "animasyon"
 * gibi okunur; artan gecikme dışa doğru genişleyen bir aralık gibi.
 */
const RING_DELAYS = [0, 0.22, 0.5] as const

/** CSS'teki `field-ripple` süresi + en geç halkanın gecikmesi + pay. */
const RIPPLE_LIFETIME_MS = 3400
/** Doğum aralığı asal saniyeye yakın: iki halka kümesi senkron atmasın. */
const AMBIENT_INTERVAL_MS = 4300
const MAX_RIPPLES = 6
