import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import CheckoutProgress from '../components/CheckoutProgress'
import OrderStatus from '../components/OrderStatus'
import { formatBDT } from '../utils/format'
import { LAST_ORDER_KEY } from '../utils/shipping'
import {
  getPaymentStatusLabel,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../utils/orderStatus'

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
    if (i.size) parts.push(`Size ${i.size}"`)
    if (i.color) parts.push(i.color)
    if (i.accentLabel) parts.push(`Accent ${i.accentLabel}`)
    return parts.filter(Boolean).join(' · ')
  }

  if (i.variantLabel) parts.push(i.variantLabel)
  if (i.size) parts.push(`Size ${i.size}"`)

  if (i.isOriginalColor) {
    parts.push('Original Colors')
  } else {
    const hasBig = i.bigColorPreference && i.bigColorPreference !== 'original'
    const hasSmall = i.smallColorPreference && i.smallColorPreference !== 'original'
    const hasPiece = i.pieceColorPreference && i.pieceColorPreference !== 'original'

    if (hasBig) parts.push(`Big: ${i.bigColorLabel || i.bigColorPreference}`)
    if (hasSmall) parts.push(`Small: ${i.smallColorLabel || i.smallColorPreference}`)
    if (hasPiece) parts.push(`Color: ${i.pieceColorLabel || i.pieceColorPreference}`)
    if (!hasBig && !hasSmall && !hasPiece && i.color) parts.push(i.color)
  }

  return parts.filter(Boolean).join(' · ')
}

function methodLabel(method) {
  if (method === 'bkash') return 'bKash'
  if (method === 'rocket') return 'Rocket'
  return method || '—'
}

export default function ThankYouPage() {
  const [params] = useSearchParams()
  const refParam = params.get('ref')

  const order = useMemo(() => {
    const stored = loadLastOrder()
    if (stored) return stored
    if (refParam) {
      return {
        id: refParam,
        items: [],
        subtotal: null,
        deliveryCharge: null,
        total: null,
        customer: {},
        delivery: {},
        softRefOnly: true,
        status: ORDER_STATUS.payment_verification,
        paymentStatus: PAYMENT_STATUS.verification_pending,
      }
    }
    return null
  }, [refParam])

  if (!order) {
    return (
      <div className="min-h-screen bg-ivory text-ink">
        <Navbar solid />
        <main className="mx-auto max-w-lg px-4 py-32 text-center">
          <h1 className="font-display text-3xl">No order to show</h1>
          <p className="mt-2 text-sm text-ink-soft">
            When you place an order and submit payment proof, your confirmation
            will appear here.
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

  const hasDetails = !order.softRefOnly && (order.items || []).length > 0
  const orderStatus = order.status || ORDER_STATUS.payment_verification
  const paymentStatus =
    order.paymentStatus || PAYMENT_STATUS.verification_pending
  const advance =
    order.advanceAmount ?? order.deliveryCharge ?? null
  const remaining = order.remainingAmount ?? null
  const needsPayment =
    orderStatus === ORDER_STATUS.payment_pending &&
    paymentStatus === PAYMENT_STATUS.pending_submission

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
        <CheckoutProgress current="confirmation" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 18,
              delay: 0.1,
            }}
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
            {needsPayment
              ? 'Your order has been received. Please complete your advance payment so we can begin preparing your Chumki.'
              : "Thank you for choosing Chumki. Your order and payment proof have been received. Once the payment is verified, we'll begin preparing your order with lots of care."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-10 rounded-3xl border border-border-soft bg-ivory/90 p-6 shadow-sm sm:p-8"
        >
          <OrderStatus
            status={
              needsPayment
                ? ORDER_STATUS.payment_pending
                : ORDER_STATUS.payment_verification
            }
            showSparkle
          />

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-muted-gold">
            Order confirmation
          </p>
          <p className="mt-2 font-display text-2xl text-ink">{order.id}</p>

          <div className="mt-6 space-y-2 text-sm">
            {!needsPayment && order.paymentMethod && (
              <div className="flex justify-between text-ink-soft">
                <span>Payment Method</span>
                <span className="font-medium text-ink">
                  {methodLabel(order.paymentMethod)}
                </span>
              </div>
            )}
            {advance != null && (
              <div className="flex justify-between text-ink-soft">
                <span>Advance Payment</span>
                <span className="font-medium text-ink">{formatBDT(advance)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-soft">
              <span>Payment Status</span>
              <span className="font-medium text-ink">
                {getPaymentStatusLabel(
                  needsPayment
                    ? PAYMENT_STATUS.pending_submission
                    : paymentStatus,
                )}
              </span>
            </div>
            {remaining != null && !needsPayment && (
              <div className="flex justify-between text-ink-soft">
                <span>Remaining Amount</span>
                <span className="font-medium text-ink">
                  {formatBDT(remaining)}
                </span>
              </div>
            )}
          </div>

          {needsPayment && order.paymentToken && (
            <Link
              to={`/payment/${encodeURIComponent(order.id)}?token=${encodeURIComponent(order.paymentToken)}`}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-dusty-rose px-5 text-sm font-semibold text-ivory sm:w-auto"
            >
              Continue to Advance Payment
            </Link>
          )}

          {hasDetails ? (
            <>
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
                  <span className="text-ink">
                    {formatBDT(order.deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border-soft pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatBDT(order.total)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-cream/60 px-4 py-3 text-sm text-ink-soft">
                <p className="font-semibold text-ink">Delivery to</p>
                <p className="mt-1">
                  {[
                    order.delivery?.address,
                    order.delivery?.city,
                    order.delivery?.district,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">
              Keep this order number handy. Full item details are shown right
              after checkout in this browser session.
            </p>
          )}
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
        </motion.div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
