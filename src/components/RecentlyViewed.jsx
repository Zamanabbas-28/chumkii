import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../hooks/useProducts'
import { formatBDT } from '../utils/format'
import ProductPlaceholder from './ProductPlaceholder'

export default function RecentlyViewed() {
  const { recentIds } = useWishlist()
  const { products, loading } = useProducts()

  if (loading) return null

  const byId = new Map(products.map((p) => [p.id, p]))
  const items = recentIds.map((id) => byId.get(id)).filter(Boolean).slice(0, 4)
  if (!items.length) return null

  return (
    <section className="bg-cream/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">
          Recently viewed
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} className="group">
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border-soft/60 bg-cream/30 p-2.5">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={`${p.name} bangle set by Chumki`}
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <ProductPlaceholder
                    name={p.name}
                    colors={(p.colorPalette || []).map((c) => c.hex)}
                  />
                )}
              </div>
              <p className="mt-2 font-display text-lg group-hover:text-dusty-rose">
                {p.name}
              </p>
              <p className="text-xs text-ink-soft">
                From {formatBDT(p.variants?.stack?.price ?? p.price)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
