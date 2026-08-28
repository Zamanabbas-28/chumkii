import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatBDT } from '../utils/format'
import ProductPlaceholder from './ProductPlaceholder'
import WishlistButton from './WishlistButton'

export default function ProductCard({ product }) {
  const palette = product.colorPalette.map((c) => c.hex)
  const fromPrice = product.variants?.stack?.price ?? product.price

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col"
    >
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full transition duration-500 group-hover:scale-[1.03]">
            <ProductPlaceholder name={product.name} colors={palette} />
          </div>
        )}
        {product.availableColors && product.availableColors.length > 1 && (
          <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-sm">
            Color Options
          </span>
        )}
        {product.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ivory">
            Featured
          </span>
        )}
        <div className="absolute bottom-3 right-3">
          <WishlistButton productId={product.id} />
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col space-y-2 px-0.5">
        <Link to={`/product/${product.id}`} className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-ink sm:text-2xl">{product.name}</h3>
          <p className="shrink-0 text-sm font-semibold text-ink">
            From {formatBDT(fromPrice)}
          </p>
        </Link>
        <p className="text-sm leading-relaxed text-ink-soft">
          {product.shortDescription}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex -space-x-1">
            {product.colorPalette.map((c) => (
              <span
                key={c.hex + c.name}
                title={c.name}
                className="h-5 w-5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <span className="text-xs text-ink-soft">
            Stack · Big · Small
          </span>
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-ivory transition hover:bg-ink/90"
        >
          View & buy
        </Link>
      </div>
    </motion.article>
  )
}
