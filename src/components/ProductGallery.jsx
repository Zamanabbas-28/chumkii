import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import ProductPlaceholder from './ProductPlaceholder'

export default function ProductGallery({ product }) {
  const images =
    product.images?.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : []
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const palette = product.colorPalette?.map((c) => c.hex) || []

  useEffect(() => {
    setIndex(0)
  }, [product.id])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox])

  const media = (
    <button
      type="button"
      onClick={() => images.length && setLightbox(true)}
      className="aspect-square w-full overflow-hidden rounded-3xl bg-cream"
    >
      {images[index] ? (
        <img
          src={images[index]}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <ProductPlaceholder name={product.name} colors={palette} />
      )}
    </button>
  )

  return (
    <div>
      {media}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                i === index ? 'border-gold' : 'border-transparent'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {lightbox && images[index] && (
            <motion.div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-ink/70"
                aria-label="Close"
                onClick={() => setLightbox(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="relative z-10 max-h-[90svh] w-full max-w-3xl overflow-hidden rounded-2xl bg-ivory p-4"
              >
                <button
                  type="button"
                  onClick={() => setLightbox(false)}
                  className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/80 text-ivory"
                  aria-label="Close lightbox"
                >
                  <X size={18} />
                </button>
                <img
                  src={images[index]}
                  alt={product.name}
                  className="mx-auto max-h-[80svh] w-auto max-w-full object-contain"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
