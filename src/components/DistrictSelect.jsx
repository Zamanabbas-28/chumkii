import { useEffect, useMemo, useRef, useState } from 'react'
import { DISTRICTS, getDistrictById } from '../data/shippingRates'
import { ChevronDown, Search } from 'lucide-react'

/**
 * Searchable district picker — customers only see district names, not zones.
 */
export default function DistrictSelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const selected = getDistrictById(value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DISTRICTS
    return DISTRICTS.filter((d) => d.name.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor="co-district" className="mb-1.5 block text-sm font-semibold">
        District
      </label>
      <button
        id="co-district"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-12 w-full items-center justify-between rounded-2xl border bg-cream/40 px-4 text-left text-sm outline-none focus:ring-2 focus:ring-gold/40 ${
          error ? 'border-dusty-rose' : 'border-border-soft'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'text-ink' : 'text-ink-soft'}>
          {selected ? selected.name : 'Select your district'}
        </span>
        <ChevronDown size={16} className="text-ink-soft" />
      </button>
      {error && <p className="mt-1 text-sm text-dusty-rose">{error}</p>}

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border-soft bg-ivory shadow-lg">
          <div className="relative border-b border-border-soft p-2">
            <Search
              size={14}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search district…"
              className="min-h-10 w-full rounded-xl border-0 bg-cream/50 py-2 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-gold/40"
              autoFocus
            />
          </div>
          <ul
            role="listbox"
            className="max-h-56 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-soft">No districts found</li>
            )}
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === d.id}
                  className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-cream ${
                    value === d.id ? 'bg-cream font-semibold text-ink' : 'text-ink'
                  }`}
                  onClick={() => {
                    onChange(d.id)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
