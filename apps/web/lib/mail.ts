import 'server-only'
import { Configuration, SendApi } from 'hostinger-mail-api-sdk'

/**
 * Giden posta — Hostinger yönetilen posta kutusu API'si.
 *
 * İki ayar gerekiyor ve ikisi de sır:
 *   HOSTINGER_MAIL_TOKEN   yalnızca o posta kutusu için yetkili bearer token
 *   HOSTINGER_MAILBOX_ID   gönderimin yapılacağı kutunun kaynak kimliği
 *
 * Yapılandırılmamışsa **sessizce başarılı olmuyor**: `sendMail` "not
 * configured" döndürüyor ve form bunu kullanıcıya söylüyor. Bir iletişim
 * formunun en kötü hatası, mesajı aldığını söyleyip hiçbir yere göndermemek.
 */

export const CONTACT_RECIPIENT = 'contact@ktlsr.com'

export function mailConfigured(): boolean {
  return (
    (process.env['HOSTINGER_MAIL_TOKEN'] ?? '') !== '' &&
    (process.env['HOSTINGER_MAILBOX_ID'] ?? '') !== ''
  )
}

export type MailResult = { ok: true } | { ok: false; reason: 'unconfigured' | 'failed' }

export async function sendMail(input: {
  subject: string
  text: string
  /** Yanıt adresi gövdede duruyor; başlığa ziyaretçinin metni konmuyor. */
  displayName?: string
}): Promise<MailResult> {
  const token = process.env['HOSTINGER_MAIL_TOKEN'] ?? ''
  const mailbox = process.env['HOSTINGER_MAILBOX_ID'] ?? ''
  if (token === '' || mailbox === '') return { ok: false, reason: 'unconfigured' }

  const api = new SendApi(new Configuration({ accessToken: token }))
  /*
   * Üretilmiş tip her alanı ZORUNLU ilan ediyor; SDK'nın kendi belgesi
   * (docs/V1SendRequest.md) hepsinin opsiyonel olduğunu söylüyor. Boş `html`
   * ve `attachments` göndermek gerçekten boş bir HTML parçası üretebilir, o
   * yüzden yalnızca kastedilen alanlar gönderiliyor ve tip bir kez
   * daraltılıyor. Yanlış olan bizim çağrımız değil, üretecin çıktısı.
   */
  const payload = {
    to: [CONTACT_RECIPIENT],
    subject: input.subject,
    text: input.text,
    ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
  } as unknown as Parameters<SendApi['sendEmail']>[1]
  try {
    await api.sendEmail(mailbox, payload)
    return { ok: true }
  } catch (cause) {
    // Sağlayıcının hatası kullanıcıya AKTARILMIYOR: token durumu ve kutu
    // kimliği o metinlerde geçebiliyor. Sunucu kütüğüne yazılıyor, ekrana
    // yalnızca "gönderilemedi" çıkıyor.
    console.error('[contact] send failed', cause)
    return { ok: false, reason: 'failed' }
  }
}
