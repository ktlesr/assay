import { themeScript } from '@ktlsr/assay-ui'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from 'next/font/google'
import type { ReactNode } from 'react'
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Tema rengi iki temada ayrı: tarayıcı çubuğu sayfayla aynı zemini alsın.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f3f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d0e' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        {/* Tema, boyamadan önce yazılır: yanlış temada tek kare bile görünmez. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
