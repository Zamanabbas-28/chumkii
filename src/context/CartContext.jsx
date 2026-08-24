import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { buildCartKey, normalizeCartItem } from '../utils/cartHelpers'

const CartContext = createContext(null)
const STORAGE_KEY = 'chumki-cart-v2'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() =>
    typeof window !== 'undefined' ? loadCart() : [],
  )
  const [cartOpen, setCartOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const bumpBadge = () => {
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 700)
  }

  const addItem = (raw) => {
    const item = normalizeCartItem({
      ...raw,
      key: buildCartKey(raw),
    })
    setItems((prev) => {
      const existing = prev.find((i) => i.key === item.key)
      if (existing) {
        return prev.map((i) =>
          i.key === item.key
            ? {
                ...i,
                quantity: Math.min(20, i.quantity + (item.quantity || 1)),
              }
            : i,
        )
      }
      return [...prev, item]
    })
    bumpBadge()
    setCartOpen(true)
  }

  const removeItem = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  const updateQuantity = (key, quantity) => {
    const q = Math.max(1, Math.min(20, Number(quantity) || 1))
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: q } : i)),
    )
  }

  const clearCart = () => setItems([])

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        cartOpen,
        setCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        justAdded,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
