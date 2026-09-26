'use server'

import { headers } from 'next/headers'
import { contactBody, contactSubject, validateContact, type ContactErrors } from '../lib/contact'
import { sendMail } from '../lib/mail'
import { rateLimit } from '../lib/rate-limit'

/**
 * İletişim formunun sunucu tarafı.
 *
 * Doğrulama burada TEKRAR koşuyor: istemcideki aynı fonksiyon bir kolaylık,
 * güven sınırı burası. Ayrıca herkese açık bir form olduğu için iki ucuz
 * koruma var — IP başına hız sınırı ve bir bal küpü alanı. İkisi de
 * mükemmel değil; kutuyu hedef olmaktan çıkarmıyor, sıradan otomatik
 * gönderimi kesiyor.
 */

export type ContactResult =
  | { status: 'sent' }
  | { status: 'invalid'; errors: ContactErrors }
  | { status: 'throttled' }
  | { status: 'unconfigured' }
  | { status: 'failed' }

export async function submitContact(formData: FormData): Promise<ContactResult> {
  // Bal küpü: gerçek kullanıcı göremediği bir alanı dolduramaz. Dolduysa
  // sessizce "gönderildi" deniyor — bota hatanın nerede olduğu söylenmiyor.
  if (String(formData.get('company') ?? '') !== '') return { status: 'sent' }

  const input = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    message: String(formData.get('message') ?? ''),
  }

  const errors = validateContact(input)
  if (Object.keys(errors).length > 0) return { status: 'invalid', errors }

  /*
   * Hız sınırı IP başına. Ters vekilin arkasındayız; `x-forwarded-for`in ilk
   * girdisi istemci. Başlık taklit edilebilir, o yüzden bu bir kimlik değil
   * bir gürültü kesici — kutuyu koruyan asıl şey sınırın kendisi.
   */
  const forwarded = (await headers()).get('x-forwarded-for') ?? ''
  const ip = forwarded.split(',')[0]?.trim() ?? ''
  if (!rateLimit(`contact:${ip === '' ? 'unknown' : ip}`, 3, 10 * 60_000)) {
    return { status: 'throttled' }
  }

  const result = await sendMail({
    subject: contactSubject(input),
    text: contactBody(input),
  })
  if (result.ok) return { status: 'sent' }
  return result.reason === 'unconfigured' ? { status: 'unconfigured' } : { status: 'failed' }
}
