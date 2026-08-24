import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatBDT } from '../utils/format'
import { getThreadingById } from '../data/threadingOptions'
import { SHIPPING } from '../data/shipping'
import { getDistrictById } from '../data/shippingRates'
import {
  getCartItemQuantity,
  calculateDeliveryCharge,
  generateOrderId,
  LAST_ORDER_KEY,
  CHECKOUT_STORAGE_KEY,
} from '../utils/shipping'
import { useCart } from '../context/CartContext'
import DistrictSelect from './DistrictSelect'
import ProductPlaceholder from './ProductPlaceholder'
import BanglePreview from './BanglePreview'

const CHECKOUT_STORAGE = CHECKOUT_STORAGE_KEY

function loadCheckoutForm() {
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function itemDetailsLine(i) {
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
  if (i.threadingId && i.threadingId !== 'none') {
    parts.push(getThreadingById(i.threadingId).name)
  }
  return parts.join(' · ')
}

export default function CheckoutForm() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const saved = loadCheckoutForm()

  const [form, setForm] = useState(
    () =>
      saved || {
        name: '',
        whatsapp: '',
        email: '',
        districtId: '',
        city: '',
        address: '',
        notes: '',
      },
  )
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [calcFlash, setCalcFlash] = useState(false)

  const itemQty = useMemo(() => getCartItemQuantity(items), [items])

  const deliveryInfo = useMemo(
    () =>
      calculateDeliveryCharge({
        districtId: form.districtId,
        itemQuantity: itemQty,
      }),
    [form.districtId, itemQty],
  )

  useEffect(() => {
    try {
      localStorage.setItem(CHECKOUT_STORAGE, JSON.stringify(form))
    } catch {
      /* ignore */
    }
  }, [form])

  useEffect(() => {
    if (!form.districtId || !deliveryInfo.ready) return
    setCalcFlash(true)
    const t = window.setTimeout(() => setCalcFlash(false), 450)
    return () => window.clearTimeout(t)
  }, [form.districtId, deliveryInfo.delivery, itemQty])

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => {
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  const total =
    deliveryInfo.ready && deliveryInfo.delivery != null
      ? subtotal + deliveryInfo.delivery
      : null

  const submit = async (e) => {
    e.preventDefault()
    if (placing) return

    const eMap = {}
    if (!items.length) eMap.cart = 'Your cart is empty'
    if (!form.name.trim()) eMap.name = 'Full name is required'
    if (!form.whatsapp.trim()) eMap.whatsapp = 'Phone / WhatsApp is required'
    else if (!/^[\d+\s-]{8,}$/.test(form.whatsapp.trim()))
      eMap.whatsapp = 'Enter a valid number'
    if (!form.districtId) eMap.districtId = 'Please select your district'
    if (!form.address.trim()) eMap.address = 'Full address is required'
    if (!deliveryInfo.ready)
      eMap.delivery = 'Select your delivery location to calculate delivery'

    setErrors(eMap)
    if (Object.keys(eMap).length) return

    setPlacing(true)
    setErrors({})
    await new Promise((r) => setTimeout(r, 500))

    const district = getDistrictById(form.districtId)
    const orderPayload = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: 'order_request',
      currency: 'BDT',
      customer: {
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
      },
      delivery: {
        districtId: form.districtId,
        district: district?.name || '',
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      },
      items: items.map((i) => ({ ...i })),
      subtotal,
      deliveryCharge: deliveryInfo.delivery,
      total: subtotal + deliveryInfo.delivery,
      meta: {
        pickup: deliveryInfo.pickup,
        weightKg: deliveryInfo.weightKg,
        zone: deliveryInfo.zone,
      },
    }

    try {
      const prev = JSON.parse(localStorage.getItem('chumki-orders-v1') || '[]')
      localStorage.setItem(
        'chumki-orders-v1',
        JSON.stringify([orderPayload, ...prev].slice(0, 30)),
      )
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(orderPayload))
    } catch {
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(orderPayload))
      } catch {
        /* ignore */
      }
    }

    clearCart()
    setPlacing(false)
    navigate('/thank-you')
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-border-soft bg-cream/40 p-8 text-center">
        <p className="font-display text-2xl text-ink">
          Your Chumki cart is feeling a little empty ✨
        </p>
        <Link
          to="/#designs"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
        >
          Explore Designs
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        onSubmit={submit}
        className="space-y-8 rounded-3xl border border-border-soft bg-ivory p-6 sm:p-8"
        noValidate
      >
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Contact details</h2>
          <div>
            <label htmlFor="co-name" className="mb-1.5 block text-sm font-semibold">
              Full name
            </label>
            <input
              id="co-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              autoComplete="name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-dusty-rose">{errors.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="co-wa" className="mb-1.5 block text-sm font-semibold">
              Phone / WhatsApp
            </label>
            <input
              id="co-wa"
              type="tel"
              value={form.whatsapp}
              onChange={(e) => update('whatsapp', e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
            />
            {errors.whatsapp && (
              <p className="mt-1 text-sm text-dusty-rose">{errors.whatsapp}</p>
            )}
          </div>
          <div>
            <label htmlFor="co-email" className="mb-1.5 block text-sm font-semibold">
              Email <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input
              id="co-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              autoComplete="email"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border-soft pt-8">
          <h2 className="font-display text-2xl text-ink">Delivery address</h2>
          <p className="text-sm text-ink-soft">
            We deliver across Bangladesh. Sylhet about {SHIPPING.sylhet.days};
            elsewhere about {SHIPPING.outsideSylhet.days} after confirmation.
          </p>

          <DistrictSelect
            value={form.districtId}
            onChange={(id) => update('districtId', id)}
            error={errors.districtId}
          />

          <div>
            <label htmlFor="co-city" className="mb-1.5 block text-sm font-semibold">
              City / area
            </label>
            <input
              id="co-city"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="Neighbourhood, thana, or area"
              autoComplete="address-level2"
            />
          </div>

          <div>
            <label htmlFor="co-address" className="mb-1.5 block text-sm font-semibold">
              Full address
            </label>
            <textarea
              id="co-address"
              rows={3}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className="w-full rounded-2xl border border-border-soft bg-cream/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="House, road, landmark…"
              autoComplete="street-address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-dusty-rose">{errors.address}</p>
            )}
          </div>

          <div>
            <label htmlFor="co-notes" className="mb-1.5 block text-sm font-semibold">
              Order notes{' '}
              <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea
              id="co-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full rounded-2xl border border-border-soft bg-cream/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>
        </section>

        {errors.delivery && (
          <p className="text-sm text-dusty-rose" role="alert">
            {errors.delivery}
          </p>
        )}
        {errors.submit && (
          <p
            className="rounded-2xl border border-dusty-rose/40 bg-blush/10 px-4 py-3 text-sm text-dusty-rose"
            role="alert"
          >
            {errors.submit}
          </p>
        )}

        <button
          type="submit"
          disabled={placing}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-dusty-rose px-6 text-sm font-semibold text-ivory transition disabled:opacity-60 sm:w-auto"
        >
          {placing ? 'Placing your order…' : 'Place Order'}
        </button>
      </form>

      <aside className="h-fit rounded-3xl border border-border-soft bg-cream/50 p-6 lg:sticky lg:top-24">
        <h3 className="font-display text-2xl text-ink">Your order</h3>
        <ul className="mt-4 space-y-4">
          {items.map((i) => (
            <li
              key={i.key}
              className="flex gap-3 border-b border-border-soft/70 pb-4 last:border-0"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ivory">
                {i.kind === 'custom' ? (
                  <div className="h-full w-full scale-75">
                    <BanglePreview
                      compact
                      shape={i.shape}
                      sizeType={i.sizeType}
                      baseColor={i.colorHex}
                      accentColors={[i.accentHex]}
                      styleId={i.styleId}
                      threadingId={i.threadingId}
                    />
                  </div>
                ) : (
                  <ProductPlaceholder
                    name={i.name}
                    colors={[i.colorHex || '#c4a574', i.accentHex || '#d4a5a5']}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-ink">{i.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  {itemDetailsLine(i)}
                  {i.quantity > 1 ? ` · Qty ${i.quantity}` : ''}
                </p>
                <p className="mt-1 font-medium">
                  {formatBDT(i.price * i.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-border-soft pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span className="font-medium text-ink">{formatBDT(subtotal)}</span>
          </div>

          <div className="flex justify-between text-ink-soft">
            <span>Delivery</span>
            <AnimatePresence mode="wait">
              {!form.districtId ? (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-[60%] text-right text-xs"
                >
                  Select your delivery location to calculate delivery.
                </motion.span>
              ) : calcFlash ? (
                <motion.span
                  key="calc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs"
                >
                  Calculating delivery…
                </motion.span>
              ) : deliveryInfo.ready ? (
                <motion.span
                  key={deliveryInfo.delivery}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-medium text-ink"
                >
                  {formatBDT(deliveryInfo.delivery)}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex justify-between border-t border-border-soft pt-3 text-base font-semibold text-ink">
            <span>Total</span>
            <AnimatePresence mode="wait">
              {total != null && !calcFlash ? (
                <motion.span
                  key={total}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {formatBDT(total)}
                </motion.span>
              ) : (
                <motion.span
                  key="pending"
                  className="text-sm font-normal text-ink-soft"
                >
                  —
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          {SHIPPING.note}
        </p>
      </aside>
    </div>
  )
}

export { LAST_ORDER_KEY, CHECKOUT_STORAGE_KEY as CHECKOUT_STORAGE }
