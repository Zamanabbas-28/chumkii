import { Heart } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'

export default function WishlistButton({ productId, className = '' }) {
  const { toggle, isWishlisted } = useWishlist()
  const on = isWishlisted(productId)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(productId)
      }}
      aria-label={on ? 'Remove from wishlist' : 'Save for later'}
      aria-pressed={on}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-ivory/95 transition hover:border-dusty-rose ${className}`}
    >
      <Heart
        size={18}
        className={on ? 'fill-dusty-rose text-dusty-rose' : 'text-ink-soft'}
      />
    </button>
  )
}
