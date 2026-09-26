/**
 * İletişim formunun doğrulaması.
 *
 * Saf ve paylaşılan: aynı fonksiyon hem tarayıcıda anlık geri bildirim için
 * hem sunucu eyleminde **güven sınırında** koşuyor. İstemci doğrulaması bir
 * kolaylık; kaydı geçerli kılan sunucudaki çağrı.
 */

export interface ContactInput {
  name: string
  email: string
  /** Opsiyonel. */
  phone: string
  message: string
}

export type ContactField = 'name' | 'email' | 'message'

export type ContactErrors = Partial<Record<ContactField, string>>

/** Alan sınırları: bir e-posta gövdesine sığmayan girdi zaten girdi değil. */
export const LIMITS = { name: 120, email: 254, phone: 40, message: 4000 } as const

/**
 * E-posta için kasten gevşek bir desen.
 *
 * RFC 5322'yi regex ile doğrulamaya çalışmak, geçerli adresleri reddeden bir
 * desen üretmenin en yaygın yolu. Burada aranan tek şey adresin şeklen bir
 * adres olması; gerçekten var olup olmadığını yalnızca ona yazmak söyler.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {}
  const name = input.name.trim()
  const email = input.email.trim()
  const message = input.message.trim()

  if (name === '') errors.name = 'Your name is required.'
  else if (name.length > LIMITS.name) errors.name = `At most ${LIMITS.name} characters.`

  if (email === '') errors.email = 'An email address is required — it is the only way to reply.'
  else if (email.length > LIMITS.email) errors.email = `At most ${LIMITS.email} characters.`
  else if (!EMAIL.test(email)) errors.email = 'That does not look like an email address.'

  if (message === '') errors.message = 'A message is required.'
  else if (message.length > LIMITS.message) {
    errors.message = `At most ${LIMITS.message} characters.`
  }

  // Telefon opsiyonel ve biçimi serbest: ülke kodu, boşluk, parantez ve tire
  // hepsi meşru. Yalnızca uzunluk sınırlanıyor.
  return errors
}

/**
 * Gönderilecek e-postanın gövdesi — düz metin.
 *
 * HTML üretilmiyor: ziyaretçinin yazdığı metni HTML'e gömmek, posta
 * istemcisinde çalışan bir enjeksiyon yüzeyi açar ve bu form için hiçbir şey
 * kazandırmaz. Başlık satırları da gövdeye yazılıyor, header'a değil.
 */
export function contactBody(input: ContactInput): string {
  const lines = [
    `Name:    ${input.name.trim()}`,
    `Email:   ${input.email.trim()}`,
    `Phone:   ${input.phone.trim() === '' ? '—' : input.phone.trim()}`,
    '',
    input.message.trim(),
  ]
  return lines.join('\n')
}

/**
 * Konu satırı.
 *
 * Ziyaretçinin adı konuya giriyor ama **tek satıra indirgenmiş** hâliyle:
 * konu başlığına kaçan bir satır sonu, SMTP'de başlık enjeksiyonudur. SDK
 * bunu kendi tarafında da reddedebilir; burada reddetmek o varsayıma
 * dayanmamak demek.
 */
export function contactSubject(input: ContactInput): string {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 60)
  return `assayctl.dev contact — ${name}`
}
