import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'chumki-wishlist-v1'
const RECENT_KEY = 'chumki-recent-v1'

function loadIds(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() =>
    typeof window !== 'undefined' ? loadIds(STORAGE_KEY) : [],
  )
  const [recentIds, setRecentIds] = useState(() =>
    typeof window !== 'undefined' ? loadIds(RECENT_KEY) : [],
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [ids])

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds))
  }, [recentIds])

  const toggle = (productId) => {
    setIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    )
  }

  const isWishlisted = (productId) => ids.includes(productId)

  const trackView = (productId) => {
    if (!productId) return
    setRecentIds((prev) => [
      productId,
      ...prev.filter((id) => id !== productId),
    ].slice(0, 8))
  }

  const value = useMemo(
    () => ({ ids, toggle, isWishlisted, recentIds, trackView }),
    [ids, recentIds],
  )

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
