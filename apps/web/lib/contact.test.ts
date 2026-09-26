import { describe, expect, it } from 'vitest'
import { contactBody, contactSubject, LIMITS, validateContact } from './contact'

const input = (over: Partial<Parameters<typeof validateContact>[0]> = {}) => ({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '',
  message: 'Hello.',
  ...over,
})

describe('validateContact — zorunlu alanlar', () => {
  it('geçerli girdide hata yok; telefon opsiyonel', () => {
    expect(validateContact(input())).toEqual({})
    expect(validateContact(input({ phone: '+90 555 000 00 00' }))).toEqual({})
  })

  it('ad zorunlu — boşluk ad değildir', () => {
    expect(validateContact(input({ name: '' })).name).toBeDefined()
    expect(validateContact(input({ name: '   ' })).name).toBeDefined()
  })

  it('e-posta zorunlu ve şeklen bir adres olmalı', () => {
    expect(validateContact(input({ email: '' })).email).toBeDefined()
    expect(validateContact(input({ email: 'not-an-address' })).email).toBeDefined()
    expect(validateContact(input({ email: 'a@b' })).email).toBeDefined()
    expect(validateContact(input({ email: 'a@b.co' })).email).toBeUndefined()
  })

  it('mesaj zorunlu', () => {
    expect(validateContact(input({ message: '' })).message).toBeDefined()
    expect(validateContact(input({ message: '  \n ' })).message).toBeDefined()
  })

  it('sınırın üstü reddedilir, sınırın kendisi kabul edilir', () => {
    expect(validateContact(input({ message: 'x'.repeat(LIMITS.message) })).message).toBeUndefined()
    expect(validateContact(input({ message: 'x'.repeat(LIMITS.message + 1) })).message).toBeDefined()
    expect(validateContact(input({ name: 'x'.repeat(LIMITS.name + 1) })).name).toBeDefined()
  })
})

describe('gönderilen e-posta', () => {
  it('gövde her alanı taşıyor; boş telefon tire olarak yazılıyor', () => {
    const body = contactBody(input({ phone: '' }))
    expect(body).toContain('Ada Lovelace')
    expect(body).toContain('ada@example.com')
    expect(body).toContain('Phone:   —')
    expect(body).toContain('Hello.')
  })

  it('konu satırı tek satır: başlık enjeksiyonu kapalı', () => {
    const subject = contactSubject(
      input({ name: `Ada${String.fromCharCode(10)}Bcc: someone@example.com` }),
    )
    expect(subject).not.toContain(String.fromCharCode(10))
    expect(subject).not.toContain(String.fromCharCode(13))
  })
})
