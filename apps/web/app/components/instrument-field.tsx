/**
 * Ölçüm alanı — sayfanın arkasında duran hareketli zemin.
 *
 * Bu bir dekor değil, **ürünün kendi işaretleri**. Gradient bulutu ya da
 * parlayan küre yok; arkada duran şey milimetrik kâğıt ve üzerinde yavaşça
 * yerine oturan güven aralıkları. Bir ölçüm aracının zemini ölçümden yapılır.
 *
 * Üç katman, hepsi akromatik ve hepsi %2–6 mürekkep:
 *
 *  1. **Izgara** — hairline milimetrik kâğıt, çok yavaş sürükleniyor. Sayfanın
 *     kâğıt olduğunu söyleyen tek şey; beyaz zemin tek başına düz durur.
 *  2. **Aralıklar** — uçları serifli yatay çizgiler. Her biri ölçülen noktadan
 *     dışa açılıyor, bir süre duruyor, kapanıyor. `IntervalRule`'un devasa ve
 *     sessiz hâli: ekranın her yerinde aynı cümle kuruluyor.
 *  3. **Işık** — beyazın ortasında bir ton daha açık bir alan. Renk değil
 *     parlaklık; saf beyazın düz durmasını engelliyor.
 *
 * Maliyet: sıfır JS, sıfır istemci bileşeni, sıfır rAF. Yalnızca `transform`,
 * `opacity` ve `clip-path` animasyonu — üçü de compositor'da. `will-change`
 * bilerek yok: sürekli koşan bir katmanı GPU'ya sabitlemek pil yakar.
 *
 * `prefers-reduced-motion` tüm hareketi durduruyor ve alan son durumunda
 * kalıyor: kaybolan bir şey yok, yalnızca duran bir şey var.
 */
export function InstrumentField() {
  return (
    <div className="field" aria-hidden="true">
      <div className="field-light" />
      <div className="field-grid" />
      <div className="field-rules">
        {INTERVALS.map((interval, index) => (
          <span
            key={interval.top + interval.left}
            className="field-interval"
            style={
              {
                top: `${interval.top}%`,
                left: `${interval.left}%`,
                width: `${interval.width}rem`,
                '--i': index,
                '--dur': `${interval.duration}s`,
                '--delay': `${interval.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Konumlar elle seçildi, rastgele üretilmedi: rastgele dağılım kümeleniyor ve
 * kümelenme dikkat çekiyor. Zemin dikkat çekmemeli. Süreler asal sayılara
 * yakın tutuldu ki hiçbir ikisi senkron atmasın — senkron atan bir alan
 * "animasyon" gibi okunur, "ortam" gibi değil.
 */
const INTERVALS = [
  { top: 8, left: 62, width: 13, duration: 23, delay: 0 },
  { top: 19, left: 8, width: 9, duration: 31, delay: 3.5 },
  { top: 31, left: 71, width: 7, duration: 19, delay: 7 },
  { top: 44, left: 4, width: 15, duration: 29, delay: 1.5 },
  { top: 57, left: 55, width: 11, duration: 37, delay: 5 },
  { top: 68, left: 14, width: 8, duration: 25, delay: 9 },
  { top: 79, left: 66, width: 14, duration: 33, delay: 2 },
  { top: 91, left: 26, width: 10, duration: 27, delay: 6.5 },
] as const
