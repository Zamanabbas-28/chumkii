import { motion } from 'framer-motion'
import { scrollToId } from '../utils/format'
import ProductPlaceholder from './ProductPlaceholder'

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-cream via-ivory to-soft-lavender/60 pt-24"
    >
      <div
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-blush/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pb-24 lg:pt-12">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-display text-5xl text-ink sm:text-6xl"
          >
            Chumki
            <span className="text-gold">✦</span>
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="mt-3 max-w-lg font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl"
          >
            Handmade bangles you can shop — stack, big, or small — and customize with colours & silver threading.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base"
          >
            Shop ready-made stacks, pick your size, add to cart, and checkout.
            Photos coming soon — every design uses a colour placeholder until
            you upload real shots.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <button
              type="button"
              onClick={() => scrollToId('designs')}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 text-sm font-semibold text-ivory transition hover:bg-ink/90"
            >
              Shop now
            </button>
            <button
              type="button"
              onClick={() => scrollToId('customize')}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-soft bg-ivory/80 px-7 text-sm font-semibold text-ink transition hover:border-gold"
            >
              Customize yours
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border border-border-soft shadow-sm"
        >
          <ProductPlaceholder
            name="Hero"
            colors={['#1a2744', '#f0e6d8', '#c4a574']}
          />
        </motion.div>
      </div>
    </section>
  )
}
