import Link from 'next/link'

/** Yönetim bölümünün alt gezinmesi. */
export function AdminNav() {
  return (
    <nav className="mb-10 flex gap-6 border-b border-rule pb-3 text-xs uppercase tracking-[0.09em]">
      <Link href="/admin" className="text-text-faint no-underline hover:text-text">
        Users
      </Link>
      <Link href="/admin/suites" className="text-text-faint no-underline hover:text-text">
        Case sets
      </Link>
      <Link href="/admin/runs" className="text-text-faint no-underline hover:text-text">
        Runs
      </Link>
      <Link href="/admin/audit" className="text-text-faint no-underline hover:text-text">
        Audit log
      </Link>
    </nav>
  )
}
