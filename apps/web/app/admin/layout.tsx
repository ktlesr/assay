import type { ReactNode } from 'react'
import { requireAdmin } from '../../lib/guard'

/**
 * Yönetim bölümü.
 *
 * Yetki denetimi burada: layout altındaki her yol kapsanıyor, yeni bir sayfa
 * eklendiğinde koruma eklemek unutulamaz. Görsel kabuk sayfalarda, çünkü
 * başlık `Shell` içinde yaşıyor.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin('/admin')
  return <>{children}</>
}
