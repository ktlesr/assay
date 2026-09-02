/**
 * Marka işareti — güven aralığı.
 *
 * İki uç tırnak, bir açıklık, merkezde olmayan bir nokta. Kaydırma keyfi
 * değil: Wilson aralığında nokta tahmini ortada durmaz. Ürünün tüm iddiası
 * o asimetride, ve simetrik bir nokta gösterdiğimiz matematiği yanlış
 * anlatırdı.
 *
 * Uç tırnaklar açıklıktan uzun — bu bir ölçek, ilerleme çubuğu değil.
 * `currentColor` kullanıyor, yani bulunduğu yerin mürekkebini alıyor;
 * paletin akromatik olması bunu bedavaya getiriyor.
 */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="8" width="2.6" height="16" />
      <rect x="25.4" y="8" width="2.6" height="16" />
      <rect x="4" y="14.7" width="24" height="2.6" />
      <circle cx="18.6" cy="16" r="4.6" />
    </svg>
  )
}
