import { motion } from 'framer-motion'

export default function ProductSelector({ variants, value, onChange }) {
  const entries = Object.entries(variants || {})

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink">What would you like?</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {entries.map(([id, v]) => {
          const selected = value === id
          return (
            <motion.button
              key={id}
              type="button"
              layout
              onClick={() => onChange(id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected
                  ? 'border-gold bg-cream shadow-sm ring-1 ring-gold/40'
                  : 'border-border-soft bg-ivory hover:border-gold/40'
              }`}
            >
              <p className="font-display text-lg text-ink">{v.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {v.description}
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
