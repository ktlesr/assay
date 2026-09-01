import Link from 'next/link'
import { Shell } from './components/shell'

/**
 * 404.
 *
 * Yayın modunda uygulamanın yarısı kapalı (middleware.ts) ve o rotalar buraya
 * düşüyor. Ziyaretçiye "bir şeyler ters gitti" hissi vermemek için sayfa
 * sitenin kendi dilinde: kapalı olan şey bir hata değil, bu dağıtımda
 * bulunmayan bir bölüm.
 */
export default function NotFound() {
  return (
    <Shell>
      <section className="section">
        <p className="rule-label mb-6">404</p>
        <h1 className="page-title">Nothing here</h1>
        <p className="page-lede">
          This page does not exist on this instance. The measurements published here are
          linked from the front page.
        </p>
        <div className="hero-actions mt-8">
          <Link href="/" className="btn">
            Back to the front page
          </Link>
        </div>
      </section>
    </Shell>
  )
}
