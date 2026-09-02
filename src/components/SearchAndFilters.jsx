import { Search, Sparkles } from 'lucide-react'

export default function SearchAndFilters({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search designs, colours…"
          className="min-h-11 w-full rounded-full border border-border-soft bg-cream/50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {[
          ['all', 'All shapes'],
          ['round', 'Round'],
          ['square', 'Square'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onFiltersChange({ ...filters, shape: id })}
            className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
              filters.shape === id
                ? 'bg-ink text-ivory'
                : 'border border-border-soft bg-ivory text-ink-soft hover:border-gold/40'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            onFiltersChange({
              ...filters,
              featuredOnly: !filters.featuredOnly,
            })
          }
          className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
            filters.featuredOnly
              ? 'bg-ink text-ivory'
              : 'border border-border-soft bg-ivory text-ink-soft hover:border-gold/40'
          }`}
        >
          <Sparkles size={13} className={filters.featuredOnly ? 'text-gold' : 'text-muted-gold'} />
          Featured Stacks
        </button>
      </div>
    </div>
  )
}
