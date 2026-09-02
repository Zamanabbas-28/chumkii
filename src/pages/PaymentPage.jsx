import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, Upload, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import CheckoutProgress from '../components/CheckoutProgress'
import OrderStatus from '../components/OrderStatus'
import { formatBDT } from '../utils/format'
import { LAST_ORDER_KEY } from '../utils/shipping'
import { PAYMENT_CONFIG, proofFileError } from '../config/paymentConfig'
import {
  fetchOrderForPayment,
  submitAdvancePayment,
} from '../services/paymentService'
import { getPaymentStatusSupport, PAYMENT_STATUS } from '../utils/orderStatus'

function loadSessionOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function itemLine(item) {
  const parts = []
  const custom = item.customization_data || {}
  const variant = custom.variantLabel || (item.variant_type ? String(item.variant_type).replace('full_stack', 'Full Stack') : '')
  if (variant) parts.push(variant)
  if (item.size) parts.push(`Size ${item.size}"`)

  if (custom.isOriginalColor) {
    parts.push('Original Colors')
  } else {
    const hasBig = custom.bigColorPreference && custom.bigColorPreference !== 'original'
    const hasMedium = custom.mediumColorPreference && custom.mediumColorPreference !== 'original'
    const hasSmall = custom.smallColorPreference && custom.smallColorPreference !== 'original'
    const hasPiece = custom.pieceColorPreference && custom.pieceColorPreference !== 'original'

    if (hasBig) parts.push(`Big: ${custom.bigColorLabel || custom.bigColorPreference}`)
    if (hasMedium) parts.push(`Medium: ${custom.mediumColorLabel || custom.mediumColorPreference}`)
    if (hasSmall) parts.push(`Small: ${custom.smallColorLabel || custom.smallColorPreference}`)
    if (hasPiece) parts.push(`Color: ${custom.pieceColorLabel || custom.pieceColorPreference}`)
    if (!hasBig && !hasMedium && !hasSmall && !hasPiece && custom.color) parts.push(custom.color)
  }

  return parts.filter(Boolean).join(' · ')
}

export default function PaymentPage() {
  const { orderNumber: routeOrderNumber } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const fileInputRef = useRef(null)
  const submittingRef = useRef(false)

  const tokenFromQuery = params.get('token') || ''
  const session = useMemo(() => loadSessionOrder(), [])

  const orderNumber = routeOrderNumber || session?.id || ''
  const paymentToken = tokenFromQuery || session?.paymentToken || ''

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [order, setOrder] = useState(null)

  const [method, setMethod] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadedPath, setUploadedPath] = useState(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)

      if (!orderNumber || !paymentToken) {
        if (!cancelled) {
          setLoadError(
            'We could not find your order payment link. Please place your order again from checkout.',
          )
          setLoading(false)
        }
        return
      }

      const result = await fetchOrderForPayment(orderNumber, paymentToken)
      if (cancelled) return

      if (!result.ok) {
        // Soft fallback to session snapshot for display if RPC fails briefly
        if (session?.id === orderNumber && session.paymentToken === paymentToken) {
          setOrder({
            order_id: session.orderId,
            order_number: session.id,
            status: session.status || 'payment_pending',
            subtotal: session.subtotal,
            delivery_charge: session.deliveryCharge,
            total: session.total,
            advance_amount: session.advanceAmount ?? session.deliveryCharge,
            remaining_amount: session.remainingAmount,
            items: (session.items || []).map((i) => ({
              product_name: i.name,
              quantity: i.quantity,
              unit_price: i.price,
              total_price: i.price * i.quantity,
              customization_data: i,
              size: i.size,
              variant_type: i.variantId,
            })),
            latest_payment: session.paymentStatus
              ? { payment_status: session.paymentStatus, payment_method: session.paymentMethod }
              : null,
            fromSession: true,
          })
          setLoadError(null)
        } else {
          setLoadError(result.error)
        }
        setLoading(false)
        return
      }

      setOrder(result.order)

      const latest = result.order.latest_payment
      if (
        latest?.payment_status === 'verification_pending' &&
        result.order.status === 'payment_verification'
      ) {
        navigate(`/thank-you?ref=${encodeURIComponent(orderNumber)}`, {
          replace: true,
        })
        return
      }

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [orderNumber, paymentToken])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const advance = Number(order?.advance_amount ?? 0)
  const remaining = Number(order?.remaining_amount ?? 0)
  const total = Number(order?.total ?? 0)
  const latestPayment = order?.latest_payment
  const isRejected = latestPayment?.payment_status === PAYMENT_STATUS.rejected

  const pickFile = useCallback((next) => {
    if (!next) return
    const err = proofFileError(next)
    if (err) {
      setErrors((e) => ({ ...e, file: err }))
      return
    }
    setFile(next)
    setUploadedPath(null)
    setErrors((e) => {
      const n = { ...e }
      delete n.file
      return n
    })
    setSubmitError(null)
  }, [])

  const onFileInput = (e) => {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
    e.target.value = ''
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_CONFIG.payToNumber)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (submittingRef.current || submitting) return

    const eMap = {}
    if (!method) eMap.method = 'Please choose bKash or Rocket'
    if (!file && !uploadedPath) eMap.file = 'Please upload your payment screenshot'
    else if (file) {
      const fe = proofFileError(file)
      if (fe) eMap.file = fe
    }
    if (!order?.order_id) eMap.form = 'Order details are missing'
    if (advance <= 0) eMap.form = 'Advance payment amount is missing'

    setErrors(eMap)
    if (Object.keys(eMap).length) return

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)

    const result = await submitAdvancePayment({
      orderNumber,
      paymentToken,
      orderId: order.order_id,
      paymentMethod: method,
      transactionId: transactionId.trim(),
      file,
      paymentAmount: advance,
      existingProofPath: uploadedPath,
    })

    if (!result.ok) {
      if (result.proofPath) setUploadedPath(result.proofPath)
      setSubmitError(result.error)
      setSubmitting(false)
      submittingRef.current = false
      return
    }

    navigate(`/thank-you?ref=${encodeURIComponent(orderNumber)}`, {
      replace: true,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar solid />
        <main className="mx-auto max-w-2xl px-4 py-32">
          <div className="h-8 w-48 animate-pulse rounded bg-cream" />
          <div className="mt-6 h-40 animate-pulse rounded-3xl bg-cream" />
        </main>
      </div>
    )
  }

  if (loadError || !order) {
    return (
      <div className="min-h-screen bg-ivory text-ink">
        <Navbar solid />
        <main className="mx-auto max-w-lg px-4 py-32 text-center">
          <h1 className="font-display text-3xl">Payment link unavailable</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {loadError || 'Please return to checkout to place your order.'}
          </p>
          <Link
            to="/checkout"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-ivory"
          >
            Back to Checkout
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const items = order.items || []

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ivory text-ink">
      <div
        className="pointer-events-none absolute -left-20 top-32 h-64 w-64 rounded-full bg-blush/20 blur-3xl"
        aria-hidden
      />
      <Navbar solid />
      <main className="relative mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <CheckoutProgress current="payment" />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            Confirm Your Advance Payment ✨
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
            Your order has been received. To begin preparing your Chumki, please
            complete the advance payment below and submit your payment proof for
            verification.
          </p>
        </motion.div>

        <div className="mt-6">
          <OrderStatus status={order.status || 'payment_pending'} />
        </div>

        {isRejected && (
          <div
            className="mt-4 rounded-2xl border border-border-soft bg-cream/60 px-4 py-3 text-sm text-ink-soft"
            role="status"
          >
            {getPaymentStatusSupport(PAYMENT_STATUS.rejected)}
          </div>
        )}

        {/* Order summary */}
        <section className="mt-8 rounded-3xl border border-border-soft bg-ivory/90 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-gold">
            Order summary
          </p>
          <p className="mt-2 font-display text-2xl text-ink">{order.order_number}</p>

          <ul className="mt-5 space-y-3 text-sm">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="border-b border-border-soft/70 pb-3 last:border-0"
              >
                <p className="font-semibold">{item.product_name || item.name}</p>
                <p className="text-xs text-ink-soft">
                  {itemLine(item)}
                  {item.quantity ? ` · Qty ${item.quantity}` : ''}
                </p>
                <p className="mt-1 font-medium">
                  {formatBDT(item.total_price ?? item.price * (item.quantity || 1))}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-border-soft pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="text-ink">{formatBDT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Delivery</span>
              <span className="text-ink">{formatBDT(order.delivery_charge)}</span>
            </div>
            <div className="flex justify-between border-t border-border-soft pt-3 font-semibold">
              <span>Order Total</span>
              <span>{formatBDT(total)}</span>
            </div>
            <div className="mt-3 rounded-2xl bg-soft-lavender/40 px-4 py-3">
              <div className="flex justify-between font-semibold text-ink">
                <span>Advance Payment</span>
                <span>{formatBDT(advance)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Equal to your delivery charge — required to begin preparing your order.
              </p>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Remaining Amount</span>
              <span className="font-medium text-ink">{formatBDT(remaining)}</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            To begin preparing your Chumki, we require a small advance payment to
            confirm your order.
          </p>
        </section>

        <form onSubmit={submit} className="mt-8 space-y-8" noValidate>
          {/* Method */}
          <section>
            <h2 className="font-display text-2xl text-ink">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PAYMENT_CONFIG.methods.map((m) => {
                const active = method === m.id
                return (
                  <motion.button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m.id)
                      setErrors((e) => {
                        const n = { ...e }
                        delete n.method
                        return n
                      })
                    }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className={`rounded-2xl border px-5 py-4 text-left transition ${
                      active
                        ? 'border-ink bg-cream shadow-sm'
                        : 'border-border-soft bg-ivory hover:border-gold/50'
                    }`}
                  >
                    <span className="text-sm font-semibold">{m.label}</span>
                    {active && (
                      <span className="mt-1 block text-xs text-dusty-rose">
                        Selected
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
            {errors.method && (
              <p className="mt-2 text-sm text-dusty-rose">{errors.method}</p>
            )}
          </section>

          {/* Number */}
          <section className="rounded-3xl border border-border-soft bg-cream/40 p-5 sm:p-6">
            <p className="text-sm font-semibold text-ink">
              Send your advance payment to:
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="font-display text-2xl tracking-wide text-ink sm:text-3xl">
                {PAYMENT_CONFIG.payToNumber}
              </p>
              <button
                type="button"
                onClick={copyNumber}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft bg-ivory px-4 text-sm font-semibold text-ink transition hover:border-gold/40"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="ok"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 text-emerald"
                    >
                      <Check size={16} /> Number copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Copy size={16} /> Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Amount: <span className="font-semibold text-ink">{formatBDT(advance)}</span>
              {method ? ` via ${method === 'bkash' ? 'bKash' : 'Rocket'}` : ''}
            </p>
          </section>

          {/* How to pay */}
          <section>
            <h2 className="font-display text-2xl text-ink">How to Pay</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Choose bKash or Rocket.</li>
              <li>
                Send the required advance payment to{' '}
                <span className="font-medium text-ink">{PAYMENT_CONFIG.payToNumber}</span>.
              </li>
              <li>Take a screenshot of your successful transaction.</li>
              <li>Upload the screenshot below.</li>
              <li>Submit your payment for verification.</li>
              <li>
                Once verified, we&apos;ll begin preparing your order with care ✨
              </li>
            </ol>
          </section>

          {/* Upload */}
          <section>
            <h2 className="font-display text-2xl text-ink">
              Upload Payment Screenshot
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              JPG, PNG, or WEBP — up to 5 MB.
            </p>

            {!previewUrl ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) pickFile(f)
                }}
                className={`mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-4 py-8 text-center transition ${
                  dragOver
                    ? 'border-gold bg-cream'
                    : 'border-border-soft bg-cream/30 hover:border-gold/40'
                }`}
              >
                <Upload className="mb-2 text-ink-soft" size={28} />
                <span className="text-sm font-semibold text-ink">
                  Drop screenshot here, or tap to choose
                </span>
                <span className="mt-1 text-xs text-ink-soft">
                  Camera or gallery on mobile
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
                  capture="environment"
                  className="sr-only"
                  onChange={onFileInput}
                />
              </label>
            ) : (
              <div className="mt-4 overflow-hidden rounded-3xl border border-border-soft bg-cream/30">
                <img
                  src={previewUrl}
                  alt="Payment screenshot preview"
                  className="max-h-72 w-full object-contain"
                />
                <div className="flex flex-wrap gap-2 border-t border-border-soft p-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-11 items-center rounded-full border border-border-soft bg-ivory px-4 text-sm font-semibold"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setUploadedPath(null)
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-dusty-rose"
                  >
                    <X size={16} /> Remove
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={onFileInput}
                  />
                </div>
              </div>
            )}
            {errors.file && (
              <p className="mt-2 text-sm text-dusty-rose">{errors.file}</p>
            )}
          </section>

          {/* Transaction ID */}
          <section>
            <label htmlFor="txn-id" className="mb-1.5 block text-sm font-semibold">
              Transaction ID{' '}
              <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input
              id="txn-id"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="e.g. trx ID from bKash / Rocket"
              autoComplete="off"
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              If available, entering your transaction ID can help us verify your
              payment faster.
            </p>
          </section>

          {(submitError || errors.form) && (
            <p
              className="rounded-2xl border border-dusty-rose/40 bg-blush/10 px-4 py-3 text-sm text-dusty-rose"
              role="alert"
            >
              {submitError || errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-dusty-rose px-6 text-sm font-semibold text-ivory transition disabled:opacity-60 sm:w-auto"
          >
            {submitting ? 'Submitting payment proof…' : 'Submit Payment Proof'}
          </button>
        </form>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
