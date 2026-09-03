'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Kaydırınca beliren bölüm.
 *
 * Kural: **içerik varsayılan olarak görünür.** JS çalışmazsa, gözlemci
 * desteklenmezse veya hareket kapalıysa sayfa tam görünür — bir metnin
 * okunabilirliği bir animasyonun çalışmasına bağlanamaz.
 *
 * Hareketin kendisi sayfanın tek yazılı anıyla aynı cümle: bölümün üst
 * çizgisi soldan sağa **çiziliyor**, sonra içerik oturuyor. Bir cetvelin
 * kâğıda basılması. Her bölüme aynı "fade-in-up" vermek yerine hareketin
 * konusu çizgi; içerik yalnızca ona eşlik ediyor.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (node === null) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    // Hareket tercihi kapalıysa gözlemci hiç kurulmuyor: iş yapmayan bir
    // gözlemci de iş yapar, sadece görünmez.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setShown(true)
          observer.disconnect()
        }
      },
      // Bölüm ekranın alt sekizde birine girdiğinde: kullanıcı kaydırmayı
      // bitirmeden hareket başlamış oluyor, yani hareket beklemeye dönüşmüyor.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-shown={shown ? 'true' : 'false'}
      className={className === undefined ? 'reveal' : `reveal ${className}`}
    >
      {children}
    </div>
  )
}
