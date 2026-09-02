import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatBDT } from '../utils/format'
import WishlistButton from './WishlistButton'

function getVariantHint(variants) {
  if (!variants) return ''
  const parts = []
  if (variants.stack) parts.push('Stack')
  if (variants.big) parts.push('Big')
  if (variants.medium) parts.push('Med')
  if (variants.small) parts.push('Small')
  if (variants.piece) parts.push('Piece')
  return parts.join(' · ')
}

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false)
  const fromPrice = product.variants?.stack?.price ?? product.variants?.piece?.price ?? product.price
  const variantHint = getVariantHint(product.variants)
  const showColorBadge = product.availableColors && product.availableColors.length > 1

  if (!product.image || imageFailed) {
    return null
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4 }}
      className="group flex min-w-0 flex-col"
    >
      <Link
        to={`/product/${product.id}`}
        className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-border-soft/60 bg-cream/30 p-2 sm:p-4"
      >
        <img
          src={product.image}
          alt={`${product.name} bangle set by Chumki`}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
        {(showColorBadge || product.featured) && (
          <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1 sm:left-3 sm:top-3">
            {showColorBadge && (
              <span className="rounded-full bg-ivory/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink shadow-sm sm:px-2.5 sm:text-[11px]">
                Colors
              </span>
            )}
            {product.featured && (
              <span className="rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ivory sm:px-2.5 sm:text-[11px]">
                Featured
              </span>
            )}
          </div>
        )}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
          <WishlistButton productId={product.id} />
        </div>
      </Link>

      <div className="mt-3 flex min-w-0 flex-1 flex-col space-y-1.5 px-0.5 sm:mt-4 sm:space-y-2">
        <Link to={`/product/${product.id}`} className="block min-w-0 space-y-0.5">
          <h3 className="line-clamp-2 font-display text-base leading-snug text-ink sm:text-lg md:text-xl">
            {product.name}
          </h3>
          <p className="text-xs font-semibold text-ink sm:text-sm">
            From {formatBDT(fromPrice)}
          </p>
        </Link>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-ink-soft sm:text-xs md:text-sm">
          {product.shortDescription}
        </p>
        <div className="space-y-1.5 pt-1">
          <div className="flex -space-x-1">
            {product.colorPalette?.map((c) => (
              <span
                key={c.hex + c.name}
                title={c.name}
                className="h-4 w-4 rounded-full border border-white shadow-sm sm:h-5 sm:w-5"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          {variantHint && (
            <p className="truncate text-[10px] text-ink-soft sm:text-xs" title={variantHint}>
              {variantHint}
            </p>
          )}
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-auto inline-flex min-h-10 items-center justify-center rounded-full bg-ink px-3 text-xs font-semibold text-ivory transition hover:bg-ink/90 sm:min-h-11 sm:px-4 sm:text-sm"
        >
          View & buy
        </Link>
      </div>
    </motion.article>
  )
}
