import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { formatBDT } from '../../utils/format'

export default function AdminProductsPage() {
  const { products, loading, error } = useProducts()
  const [list, setList] = useState([])

  useEffect(() => {
    setList(products || [])
  }, [products])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Products</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Read-only catalog view. Edit product data in code / Supabase for now.
        </p>
      </div>

      {error && (
        <p className="text-sm text-dusty-rose">{String(error)}</p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-cream" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-border-soft bg-ivory"
            >
              <div className="aspect-square bg-cream/40 p-3">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink-soft">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-display text-xl">{p.name}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  From {formatBDT(p.variants?.stack?.price ?? p.price)}
                </p>
                <Link
                  to={`/product/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-dusty-rose"
                >
                  View on storefront →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
