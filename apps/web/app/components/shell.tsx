import Link from 'next/link'
import type { ReactNode } from 'react'
import { Mark } from './mark'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

/**
 * Sayfa kabuğu.
 *
 * Sertifikanın antetli kâğıdı: marka, kırıntı yolu, oturum ve tema seçici.
 * Altında tek bir hairline; kutu ya da gölge yok.
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
      <header className="page-head">
        <div className="page-head-inner">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="wordmark">
              <Mark size={18} />
              <span>Assay</span>
            </Link>
            {breadcrumbs.length === 0 ? null : (
              <nav aria-label="Breadcrumb" className="crumbs">
                {breadcrumbs.map((crumb) => (
                  <span key={crumb.label} className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true" className="text-rule-strong">
                      /
                    </span>
                    {crumb.href === undefined ? (
                      <span className="truncate text-text-muted">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="truncate">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-5">
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[var(--page)] px-6 pb-24 pt-10">{children}</main>
    </div>
  )
}
