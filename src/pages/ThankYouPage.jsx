import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import CheckoutProgress from '../components/CheckoutProgress'
import { formatBDT } from '../utils/format'
import { getThreadingById } from '../data/threadingOptions'
import { buildInquiryMessage, getWhatsAppUrl } from '../data/contact'
import { LAST_ORDER_KEY } from '../utils/shipping'

function loadLastOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function itemLine(i) {
  const parts = []
  if (i.kind === 'custom') {
    parts.push(i.shape === 'square' ? 'Square' : 'Round')
    if (i.sizeType) parts.push(i.sizeType === 'big' ? 'Big' : 'Small')
  } else if (i.variantLabel) {
    parts.push(i.variantLabel)
  }
  if (i.size) parts.push(`Size ${i.size}`)
  if (i.color) parts.push(i.color)
  if (i.accentLabel) parts.push(`Accent ${i.accentLabel}`)
  if (i.styleId) parts.push(i.styleId)
  if (i.detailId) parts.push(i.detailId)
  if (i.threadingId && i.threadingId !== 'none') {
    parts.push(getThreadingById(i.threadingId).name)
  }
  return parts.filter(Boolean).join(' · ')
}

export default function ThankYouPage() {
  const order = useMemo(() => loadLastOrder(), [])

  if (!order) {
    return (
      <div className="min-h-screen bg-ivory text-ink">
        <Navbar solid />
        <main className="mx-auto max-w-lg px-4 py-32 text-center">
          <h1 className="font-display text-3xl">No order to show</h1>
          <p className="mt-2 text-sm text-ink-soft">
            When you place an order, your confirmation will appear here.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-ivory"
          >
            Return to Home
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const wa = getWhatsAppUrl(
    buildInquiryMessage({
      'Order ref': order.id,
      Name: order.customer?.name,
      WhatsApp: order.customer?.whatsapp,
      Email: order.customer?.email || '—',
      District: order.delivery?.district,
      Area: order.delivery?.city || '—',
      Address: order.delivery?.address,
      Items: (order.items || [])
        .map(
          (i) =>
            `• ${i.name} (${itemLine(i)}) × ${i.quantity} = ${formatBDT(i.price * i.quantity)}`,
        )
        .join('\n'),
      Subtotal: formatBDT(order.subtotal),
      Delivery: formatBDT(order.deliveryCharge),
      Total: formatBDT(order.total),
    }),
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ivory text-ink">
      <div
        className="pointer-events-none absolute -left-20 top-32 h-64 w-64 rounded-full bg-blush/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-48 h-72 w-72 rounded-full bg-soft-lavender/40 blur-3xl"
        aria-hidden
      />

      <Navbar solid />
      <main className="relative mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <CheckoutProgress current="confirmed" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/15 text-emerald"
          >
            <Check size={32} strokeWidth={2.5} />
          </motion.div>

          <p className="text-sm text-gold" aria-hidden>
            ✦ · ✦ · ✦
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
            Thank You for Shopping with Chumki! ✨
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
            We&apos;re so happy you&apos;ve chosen a little Chumki. Your order has
            been received, and we&apos;ll take it from here with lots of care and
            attention to the little details.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-10 rounded-3xl border border-border-soft bg-ivory/90 p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-gold">
            Order confirmation
          </p>
          <p className="mt-2 font-display text-2xl text-ink">{order.id}</p>
          <p className="mt-1 text-xs text-ink-soft">
            This is an order request — we&apos;ll confirm details and payment with
            you next. It is not a paid checkout yet.
          </p>

          <h2 className="mt-8 font-display text-xl text-ink">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(order.items || []).map((i) => (
              <li
                key={i.key}
                className="border-b border-border-soft/70 pb-3 last:border-0"
              >
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-ink-soft">
                  {itemLine(i)} · Qty {i.quantity}
                </p>
                <p className="mt-1 font-medium">
                  {formatBDT(i.price * i.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 border-t border-border-soft pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="text-ink">{formatBDT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Delivery</span>
              <span className="text-ink">{formatBDT(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t border-border-soft pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatBDT(order.total)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-cream/60 px-4 py-3 text-sm text-ink-soft">
            <p className="font-semibold text-ink">Delivery to</p>
            <p className="mt-1">
              {[order.delivery?.address, order.delivery?.city, order.delivery?.district]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <Link
            to="/"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-ivory transition hover:bg-ink/90 active:scale-[0.98] sm:w-auto"
          >
            Return to Home
          </Link>
          <Link
            to="/#designs"
            className="text-sm font-medium text-dusty-rose underline-offset-2 hover:underline"
          >
            Continue Exploring
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              Share order details on WhatsApp
            </a>
          )}
        </motion.div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
