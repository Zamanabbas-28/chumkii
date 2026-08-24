import { motion } from 'framer-motion'
import { CATEGORIES } from '../data/categories'
import { scrollToId } from '../utils/format'

export default function CategorySection({ onSelectCategory }) {
  return (
    <section id="styles" className="bg-ivory px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Shop by style
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Find a mood that feels like you
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Explore different handcrafted directions — then customize colours and
          details to make a stack your own.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => {
                if (cat.id === 'custom') {
                  scrollToId('customize')
                } else {
                  onSelectCategory?.(cat.id)
                  scrollToId('designs')
                }
              }}
              className="group rounded-2xl border border-border-soft bg-cream/60 p-6 text-left transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-cream hover:shadow-sm"
            >
              <span
                className="mb-4 block h-1 w-10 rounded-full transition group-hover:w-14"
                style={{ backgroundColor: cat.accent }}
              />
              <h3 className="font-display text-xl text-ink sm:text-2xl">
                {cat.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {cat.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
