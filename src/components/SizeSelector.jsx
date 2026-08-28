import { Link } from 'react-router-dom'
import { SIZES } from '../data/colors'

export default function SizeSelector({
  sizes = SIZES,
  availableSizes,
  value,
  onChange,
}) {
  const effectiveAvailable = Array.isArray(availableSizes) && availableSizes.length > 0
    ? availableSizes
    : (Array.isArray(sizes) && sizes.length > 0 ? sizes : SIZES)

  // Display standard sizes or all unique sizes
  const allDisplaySizes = Array.from(new Set([...SIZES, ...effectiveAvailable]))

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Select your size</p>
        <Link
          to="/#size-guide"
          className="text-xs font-medium text-dusty-rose underline-offset-2 hover:underline"
        >
          Not sure about your size? View Size Guide
        </Link>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {allDisplaySizes.map((s) => {
          const isAvailable = effectiveAvailable.includes(s)
          const isSelected = value === s

          return (
            <button
              key={s}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onChange(s)}
              title={!isAvailable ? `Size ${s} is currently unavailable` : `Select size ${s}`}
              aria-pressed={isSelected}
              aria-disabled={!isAvailable}
              className={`min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium transition ${
                !isAvailable
                  ? 'border-border-soft/60 bg-cream/40 text-ink-soft/40 line-through cursor-not-allowed opacity-60'
                  : isSelected
                  ? 'border-ink bg-ink text-ivory shadow-xs ring-2 ring-ink/20'
                  : 'border-border-soft bg-cream text-ink hover:border-gold active:scale-95'
              }`}
            >
              {s}&quot;
            </button>
          )
        })}
      </div>
    </div>
  )
}
