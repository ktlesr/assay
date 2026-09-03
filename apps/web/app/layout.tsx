import { themeScript } from '@ktlsr/assay-ui'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from 'next/font/google'
import type { ReactNode } from 'react'
import { InstrumentField } from './components/instrument-field'
import './globals.css'

/**
 * Instrument Serif — sertifika başlığı. Yüksek kontrastlı, kazınmış hissi.
 * IBM Plex Sans / Mono — ölçüm ve makine kimliği için tasarlanmış bir aile;
 * gerçek tabular rakamlar ve aynı iskeleti paylaşan bir mono kardeş.
 */
const display = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const sans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
})

/**
 * Meta etiketleri.
 *
 * `metadataBase` `AUTH_URL`'den geliyor: Open Graph mutlak adres istiyor ve
 * onu tahmin etmek yerine zaten doğrulanmış olan dış adresten türetiyoruz
 * (instrumentation.ts açılışta https ve eğik çizgi kontrolü yapıyor).
 *
 * Açıklama ürünün iddiasını tek cümlede söylüyor; uydurma rakam, müşteri
 * sayısı veya referans yok — tanıtım sayfasındaki her sayı gerçek bir
 * koşumdan geliyor (veri gerçekliği sözleşmesi).
 */
const siteUrl = process.env['AUTH_URL']?.replace(/\/$/, '')

const TITLE = 'Assay — a CI test runner for Agent Skills'
const DESCRIPTION =
  'Measure whether an agent skill triggers on the request it claims, stays quiet on the one next to it, and does the same thing tomorrow. Every rate ships with its sample size and confidence interval.'

export const metadata: Metadata = {
  ...(siteUrl === undefined || siteUrl === '' ? {} : { metadataBase: new URL(siteUrl) }),
  title: { default: TITLE, template: '%s — Assay' },
  description: DESCRIPTION,
  applicationName: 'Assay',
  keywords: [
    'agent skills',
    'skill testing',
    'CI',
    'trigger accuracy',
    'regression testing',
    'Claude Code',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Assay',
    title: TITLE,
    description: DESCRIPTION,
    ...(siteUrl === undefined || siteUrl === '' ? {} : { url: siteUrl }),
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
  // Kanonik adres: aynı sayfaya www'li ve www'siz gelen bağlantılar tek
  // kayıtta toplansın. `metadataBase` üzerinden çözülüyor.
  ...(siteUrl === undefined || siteUrl === '' ? {} : { alternates: { canonical: '/' } }),
}

/**
 * Yapısal veri.
 *
 * Yalnızca doğrulanabilir alanlar: ad, açıklama, kategori, lisans, ücretsiz
 * teklif ve paket adresi. `aggregateRating` **bilerek yok** — bu örnekte
 * değerlendirme diye bir şey yok ve uydurma bir yıldız ortalaması, tam da
 * bu ürünün varlık sebebi olan şeyin ihlali olurdu (veri gerçekliği
 * sözleşmesi). Arama sonucunda yıldız göstermenin cazibesi gerçek değil.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Assay',
  description: DESCRIPTION,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Linux, macOS, Windows',
  license: 'https://www.apache.org/licenses/LICENSE-2.0',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  sameAs: [
    'https://github.com/ktlesr/assay',
    'https://www.npmjs.com/package/@ktlsr/assay',
  ],
  ...(siteUrl === undefined || siteUrl === '' ? {} : { url: siteUrl }),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Tema rengi iki temada ayrı: tarayıcı çubuğu sayfayla aynı zemini alsın.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d0e' },
  ],
}

/*
 * Yön sözleşmesi — derlenmiş çıktıda da kalması gerekiyor.
 *
 * JSX yorumu (`{/* ... *\/}`) derleyici tarafından siliniyor, yani üretim
 * HTML'inde denetlenemiyor. Bu yüzden gerçek bir HTML yorumu olarak, gövdenin
 * ilk çocuğu hâlinde basılıyor.
 */
const DIRECTION_CONTRACT = `<!--
  assay/direction seed: certificate-printed-live

  THESIS: A measurement instrument's page is made of measurement. Refuses the
  SaaS landing arrangement (gradient hero, feature-card grid, logo wall) and
  refuses the flat white page just as firmly.

  OWN-WORLD: White paper ground, cool graphite ink, hairline rules, no brand
  chroma; colour appears only where a verdict does. Instrument Serif headings
  over IBM Plex Sans/Mono data. Behind everything a drifting graph-paper field
  where confidence intervals open and close.

  STORY: The visitor watches a real run fail, understands the tool refuses to
  round uncertainty away, and installs the CLI.

  FIRST VIEWPORT: Headline left, its lines opening upward one after another; a
  recorded terminal beneath it at full measure; the primary action sitting on
  the rule directly under the terminal. Nothing floats, nothing glows.

  FORM: Established world inherited and expanded (white ground, live field).
  No world replacement, so no direction roll.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, and DESIGN.md.
-->`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        {/* Tema, boyamadan önce yazılır: yanlış temada tek kare bile görünmez. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <InstrumentField />
        {children}
      </body>
    </html>
  )
}
