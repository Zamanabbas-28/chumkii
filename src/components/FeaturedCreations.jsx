import { useMemo, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from './ProductCard'
import SearchAndFilters from './SearchAndFilters'
import DmCustomizationCta from './DmCustomizationCta'

function ProductSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-square rounded-2xl bg-cream" />
      <div className="h-5 w-2/3 rounded bg-cream" />
      <div className="h-4 w-1/3 rounded bg-cream" />
    </div>
  )
}

export default function FeaturedCreations({ categoryFilter, onClearFilter }) {
  const { products, loading } = useProducts()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    featuredOnly: false,
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
    if (filters.featuredOnly) {
      result = result.filter((p) => p.featured)
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
  }, [products, categoryFilter, query, filters])

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
          Choose a ready-made stack, pick Full Stack, Big, or Small, select your size,
          and choose your color preferences.
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

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            : list.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {!loading && list.length === 0 && (
          <p className="mt-8 text-sm text-ink-soft">
            No designs match your search — try clearing filters.
          </p>
        )}

        {/* Subtle DM Customization invite below collection */}
        <div className="mt-14">
          <DmCustomizationCta
            compact
            title="Looking for a design or colorway not listed here? ✨"
            description="We love making bespoke stacks! Send us a message on WhatsApp or Instagram with your idea."
          />
        </div>
      </div>
    </section>
  )
}
