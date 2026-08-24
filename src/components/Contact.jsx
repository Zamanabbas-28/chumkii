import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { CONTACT, getWhatsAppUrl } from '../data/contact'
import InstagramIcon from './InstagramIcon'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const eMap = {}
    if (!form.name.trim()) eMap.name = 'Please enter your name.'
    if (!form.whatsapp.trim()) eMap.whatsapp = 'Please enter a WhatsApp number.'
    if (!form.message.trim()) eMap.message = 'Please write a short message.'
    setErrors(eMap)
    if (Object.keys(eMap).length) return
    setSent(true)
  }

  const waGeneric = getWhatsAppUrl(
    `Hi Chumki! I'm ${form.name || '…'}. ${form.message || ''}`.trim(),
  )

  return (
    <section id="contact" className="bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
            Say hello
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
            Have Something Special in Mind?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
            Whether you have a complete idea or just a colour combination you
            love, we&apos;d love to hear what you&apos;re imagining.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {waGeneric ? (
              <a
                href={waGeneric}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald px-6 text-sm font-semibold text-ivory"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            ) : (
              <div className="rounded-2xl border border-dashed border-gold/50 bg-ivory px-4 py-3 text-sm text-ink-soft">
                <p className="font-medium text-ink">Chat on WhatsApp</p>
                <p className="mt-1">
                  Placeholder — replace{' '}
                  <code className="text-xs">YOUR_WHATSAPP_NUMBER</code> in{' '}
                  <code className="text-xs">src/data/contact.js</code>
                </p>
              </div>
            )}
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border-soft bg-ivory px-6 text-sm font-semibold text-ink transition hover:border-dusty-rose"
            >
              <InstagramIcon size={18} />
              Follow on Instagram
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-border-soft bg-ivory p-6 sm:p-8">
          {sent ? (
            <div>
              <h3 className="font-display text-2xl text-ink">Message ready</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Thanks, {form.name}. Your inquiry details are saved on this
                page — this does not place an order. Reach out on Instagram
                {CONTACT.whatsappNumber !== 'YOUR_WHATSAPP_NUMBER'
                  ? ' or WhatsApp'
                  : ''}{' '}
                and we&apos;ll take it from there.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false)
                  setForm({ name: '', whatsapp: '', email: '', message: '' })
                }}
                className="mt-6 inline-flex min-h-11 items-center rounded-full border border-border-soft px-5 text-sm font-semibold"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold">
                  Name
                </label>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-dusty-rose">{errors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="contact-wa" className="mb-1.5 block text-sm font-semibold">
                  WhatsApp number
                </label>
                <input
                  id="contact-wa"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => update('whatsapp', e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
                />
                {errors.whatsapp && (
                  <p className="mt-1 text-sm text-dusty-rose">{errors.whatsapp}</p>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold">
                  Email <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  className="w-full resize-y rounded-2xl border border-border-soft bg-cream/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/40"
                  placeholder="Tell us what you're imagining..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-dusty-rose">{errors.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-ivory sm:w-auto"
              >
                Send Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
