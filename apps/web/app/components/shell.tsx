import Link from 'next/link'
import type { ReactNode } from 'react'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

/**
 * Sayfa kabuğu.
 *
 * Sertifikanın antetli kâğıdı: marka, kırıntı yolu ve tema seçici. Altında
 * tek bir hairline; kutu ya da gölge yok.
 */
export function Shell({
  breadcrumbs = [],
  children,
}: {
  breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-[var(--page)] items-baseline justify-between gap-6 px-6 py-5">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link href="/" className="font-display text-2xl leading-none no-underline">
              Assay
            </Link>
            <nav aria-label="Breadcrumb" className="min-w-0 truncate">
              {breadcrumbs.map((crumb) => (
                <span key={crumb.label} className="text-xs uppercase tracking-[0.09em]">
                  <span aria-hidden="true" className="mx-2 text-text-faint">
                    /
                  </span>
                  {crumb.href === undefined ? (
                    <span className="text-text-muted">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-text-faint no-underline hover:text-text">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-baseline gap-5">
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[var(--page)] px-6 py-12">{children}</main>
    </div>
  )
}
