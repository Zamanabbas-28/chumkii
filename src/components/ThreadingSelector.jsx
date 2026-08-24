import { motion } from 'framer-motion'
import { formatBDT } from '../utils/format'

export default function ThreadingSelector({ options, value, onChange }) {
  return (
    <div>
      <h3 className="font-display text-2xl text-ink">Threading details</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Decorative threading wraps over your base colour — it does not replace it.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = value === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              layout
              onClick={() => onChange(opt.id)}
              className={`overflow-hidden rounded-2xl border text-left transition ${
                selected
                  ? 'border-gold bg-cream shadow-sm ring-1 ring-gold/30'
                  : 'border-border-soft bg-ivory hover:border-gold/40'
              }`}
            >
              {opt.preview ? (
                <div className="aspect-[16/10] overflow-hidden bg-cream">
                  <img
                    src={opt.preview}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-cream to-soft-lavender/40">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Clean finish
                  </span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg text-ink">{opt.name}</p>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {opt.price > 0 ? `+${formatBDT(opt.price)}` : formatBDT(0)}
                  </span>
                </div>
                {opt.description && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {opt.description}
                  </p>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
