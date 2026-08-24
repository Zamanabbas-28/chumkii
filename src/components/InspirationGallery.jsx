import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { products } from '../data/products'
import ProductPlaceholder from './ProductPlaceholder'

export default function InspirationGallery() {
  const [active, setActive] = useState(null)
  const items = products.slice(0, 6)

  useEffect(() => {
    if (active === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  const item = active !== null ? items[active] : null
  const palette = item?.colorPalette?.map((c) => c.hex) || []

  return (
    <section id="inspiration" className="bg-cream/50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Lookbook
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl md:text-5xl">
          A Little Chumki Inspiration ✨
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Colour placeholders for now — replace with real photos anytime.
        </p>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((g, index) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActive(index)}
              className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-ivory text-left shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[4/5] w-full">
                {g.image ? (
                  <img
                    src={g.image}
                    alt={g.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ProductPlaceholder
                    name={g.name}
                    colors={g.colorPalette.map((c) => c.hex)}
                  />
                )}
              </div>
              <span className="block px-4 py-3 font-display text-lg text-ink">
                {g.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {item && (
            <motion.div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-ink/70"
                aria-label="Close lightbox"
                onClick={() => setActive(null)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={item.name}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative z-10 max-h-[90svh] w-full max-w-lg overflow-hidden rounded-2xl bg-ivory"
              >
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/80 text-ivory"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <div className="aspect-square w-full">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ProductPlaceholder name={item.name} colors={palette} />
                  )}
                </div>
                <p className="border-t border-border-soft px-4 py-3 font-display text-xl text-ink">
                  {item.caption || item.name}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}
