import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatBDT } from '../utils/format'
import {
  getCartItemQuantity,
  calculateDeliveryCharge,
  CHECKOUT_STORAGE_KEY,
} from '../utils/shipping'
import CartItem from './CartItem'
import CheckoutProgress from './CheckoutProgress'
import ContactChoiceModal from './ContactChoiceModal'

function readSavedDistrictId() {
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY)
    if (!raw) return ''
    return JSON.parse(raw)?.districtId || ''
  } catch {
    return ''
  }
}

export default function CartDrawer() {
  const {
    items,
    cartOpen,
    setCartOpen,
    removeItem,
    updateQuantity,
    subtotal,
  } = useCart()

  const [districtId, setDistrictId] = useState('')
  const [contactModalOpen, setContactModalOpen] = useState(false)

  useEffect(() => {
    if (cartOpen) setDistrictId(readSavedDistrictId())
  }, [cartOpen])

  const itemQty = useMemo(() => getCartItemQuantity(items), [items])
  const previewDelivery = useMemo(() => {
    if (!districtId || !items.length) return null
    const result = calculateDeliveryCharge({
      districtId,
      itemQuantity: itemQty,
    })
    return result.ready ? result.delivery : null
  }, [districtId, itemQty, items.length])

  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setCartOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [cartOpen, setCartOpen])

  return createPortal(
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          className="fixed inset-0 z-[85] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/45"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-4">
              <h2 className="font-display text-2xl text-ink">Your bag</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {items.length > 0 && (
              <div className="border-b border-border-soft px-2 pt-3">
                <CheckoutProgress current="cart" />
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="mb-3 text-muted-gold" size={36} />
                  <p className="font-display text-xl text-ink">
                    Your Chumki cart is feeling a little empty ✨
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Explore handmade stacks and find something that feels like you.
                  </p>
                  <Link
                    to="/#designs"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
                  >
                    Explore Designs
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.key}
                      item={item}
                      onRemove={removeItem}
                      onUpdateQty={updateQuantity}
                    />
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border-soft bg-ivory p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatBDT(subtotal)}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">Delivery</span>
                  <span className="text-right text-xs text-ink-soft sm:text-sm">
                    {previewDelivery != null
                      ? formatBDT(previewDelivery)
                      : 'Calculated at checkout'}
                  </span>
                </div>
                <p className="mb-3 text-[11px] leading-relaxed text-ink-soft">
                  Delivers across BD · Sylhet 6–7 days · Outside 10–12 days
                </p>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-ivory transition hover:bg-ink/90 active:scale-[0.99]"
                >
                  Checkout
                </Link>
                <p className="mt-2.5 text-center text-[11px] text-ink-soft">
                  Need a bespoke piece?{' '}
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(true)}
                    className="font-medium text-dusty-rose underline-offset-2 hover:underline"
                  >
                    DM us for custom requests
                  </button>
                </p>
              </div>
            )}
          </motion.aside>

          <ContactChoiceModal
            isOpen={contactModalOpen}
            onClose={() => setContactModalOpen(false)}
            customMessage="Hi Chumki! ✨ I'd like to ask about a customized bangle set."
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
