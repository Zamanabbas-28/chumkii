import { useMemo, useState } from 'react'
import { products } from '../data/products'
import ProductCard from './ProductCard'
import SearchAndFilters from './SearchAndFilters'

export default function FeaturedCreations({ categoryFilter, onClearFilter }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    customizableOnly: false,
    shape: 'all',
  })

  const list = useMemo(() => {
    let result = products
    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter)
    }
    if (filters.shape !== 'all') {
      result = result.filter((p) => p.shape === filters.shape)
    }
    if (filters.customizableOnly) {
      result = result.filter((p) => p.customizable)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter((p) => {
        const hay = [
          p.name,
          p.shortDescription,
          p.category,
          ...(p.colorPalette || []).map((c) => c.name),
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }
    return result
  }, [categoryFilter, query, filters])

  return (
    <section id="designs" className="bg-ivory px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Shop
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
          Shop Chumki
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Choose a design, pick Full Stack, Big, or Small, select your size, and
          add to cart.
        </p>

        <div className="mt-8">
          <SearchAndFilters
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {categoryFilter && categoryFilter !== 'all' && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-dusty-rose">
              Showing {list.length} design{list.length === 1 ? '' : 's'} in this style.
            </p>
            <button
              type="button"
              onClick={() => onClearFilter?.()}
              className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
            >
              Show all
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-8 text-sm text-ink-soft">
            No designs match your search — try clearing filters.
          </p>
        )}
      </div>
    </section>
  )
}
