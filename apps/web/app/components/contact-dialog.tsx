'use client'

import { Dialog } from '@ktlsr/assay-ui'
import { useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { LIMITS, validateContact, type ContactErrors } from '../../lib/contact'
import { submitContact, type ContactResult } from '../contact-action'

/**
 * İletişim formu — modal.
 *
 * Paylaşılan `Dialog` üstünde: bu sitedeki her pencere aynı örtü, aynı panel,
 * aynı odak tuzağı. Kendi panelini çizmek, ikinci bir pencere dili üretmek
 * olurdu. Gönderim sonrası kapanabilmesi için denetimli açılış kullanılıyor.
 *
 * Doğrulama iki yerde koşuyor: buradaki anlık geri bildirim bir kolaylık,
 * kaydı geçerli kılan sunucudaki aynı fonksiyon.
 */
export function ContactDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<ContactResult | null>(null)
  const sent = result?.status === 'sent'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Kapanınca sıfırlanıyor: ikinci kez açan kişi bir öncekinin
        // teşekkür ekranını bulmasın.
        if (!next) setResult(null)
      }}
      trigger={trigger}
      title={sent ? 'Message sent' : 'Contact'}
      {...(sent
        ? {
            description:
              'It reached the address behind this site. A reply will come to the email you gave.',
          }
        : {})}
      footer={
        sent ? (
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Close
          </button>
        ) : (
          // Form kendi düğmelerini taşıyor: gönderim durumu (`useFormStatus`)
          // yalnızca formun İÇİNDEN okunabiliyor.
          <></>
        )
      }
    >
      {sent ? null : <ContactForm result={result} onResult={setResult} />}
    </Dialog>
  )
}

function ContactForm({
  result,
  onResult,
}: {
  result: ContactResult | null
  onResult: (result: ContactResult) => void
}) {
  const [errors, setErrors] = useState<ContactErrors>({})

  const problem =
    result === null || result.status === 'sent' || result.status === 'invalid'
      ? null
      : {
          throttled:
            'Three messages in ten minutes is the limit from one address. Try again shortly.',
          unconfigured:
            'This site cannot send mail right now — its mail credentials are not set. Nothing was sent.',
          failed: 'The message could not be sent. Nothing was delivered; please try again.',
        }[result.status]

  return (
    <form
      className="contact-form"
      noValidate
      action={async (formData: FormData) => {
        const input = {
          name: String(formData.get('name') ?? ''),
          email: String(formData.get('email') ?? ''),
          phone: String(formData.get('phone') ?? ''),
          message: String(formData.get('message') ?? ''),
        }
        const found = validateContact(input)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        const outcome = await submitContact(formData)
        if (outcome.status === 'invalid') setErrors(outcome.errors)
        onResult(outcome)
      }}
    >
      <p className="contact-lede">
        Questions about a measurement, the SDK, or this instance.
      </p>

      {problem === null ? null : (
        <p className="contact-problem" role="alert">
          {problem}
        </p>
      )}

      <Field
        id="contact-name"
        name="name"
        label="Full name"
        required
        autoComplete="name"
        maxLength={LIMITS.name}
        error={errors.name}
      />
      <Field
        id="contact-email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        maxLength={LIMITS.email}
        error={errors.email}
      />
      <Field
        id="contact-phone"
        name="phone"
        label="Phone"
        optional
        type="tel"
        autoComplete="tel"
        maxLength={LIMITS.phone}
      />

      <div>
        <label htmlFor="contact-message" className="col-label">
          Message <Required />
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={LIMITS.message}
          className="field-input contact-textarea"
          aria-invalid={errors.message !== undefined}
          {...(errors.message === undefined
            ? {}
            : { 'aria-describedby': 'contact-message-error' })}
        />
        <FieldError id="contact-message-error" message={errors.message} />
      </div>

      {/*
        Bal küpü. Ekran okuyucudan da gizli, yani gerçek bir kullanıcının
        doldurması mümkün değil; dolduran bot. `display: none` DEĞİL — bazı
        botlar görünmez alanları atlıyor.
      */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="contact-trap"
      />

      <div className="contact-actions">
        <SubmitButton />
      </div>
    </form>
  )
}

function Field({
  id,
  name,
  label,
  error,
  required = false,
  optional = false,
  ...rest
}: {
  id: string
  name: string
  label: string
  error?: string | undefined
  required?: boolean
  optional?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="col-label">
        {label} {required ? <Required /> : null}
        {optional ? <span className="contact-optional">optional</span> : null}
      </label>
      <input
        id={id}
        name={name}
        className="field-input"
        aria-invalid={error !== undefined}
        {...(error === undefined ? {} : { 'aria-describedby': `${id}-error` })}
        {...rest}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

/**
 * Zorunluluk yıldızla değil sözcükle.
 *
 * Yıldız bir konvansiyon, açıklama değil: ekran okuyucuda "yıldız" diye
 * okunuyor ve efsanesi genelde formun tepesinde kalıyor.
 */
function Required() {
  return <span className="contact-required">required</span>
}

function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (message === undefined) return null
  return (
    <p id={id} className="contact-error" role="alert">
      {message}
    </p>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Sending…' : 'Send message'}
    </button>
  )
}
