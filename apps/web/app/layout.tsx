import { themeScript } from '@assay/ui'
import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Assay',
  description: 'A CI test runner for Agent Skills.',
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
