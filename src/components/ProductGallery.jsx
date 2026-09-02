import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
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

  const prevImage = useCallback(() => {
    if (images.length > 1) {
      setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
    }
  }, [images.length])

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setIndex((i) => (i === images.length - 1 ? 0 : i + 1))
    }
  }, [images.length])

  // Handle keyboard navigation for lightbox & gallery
  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightbox, prevImage, nextImage])

  // Handle drag/swipe gesture on mobile
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50
    if (info.offset.x > swipeThreshold) {
      prevImage()
    } else if (info.offset.x < -swipeThreshold) {
      nextImage()
    }
  }

  const altText = `${product.name} bangle set by Chumki${
    images.length > 1 ? ` (view ${index + 1} of ${images.length})` : ''
  }`

  return (
    <div className="min-w-0 space-y-4">
      {/* Main Image Container */}
      <div className="group relative flex aspect-square w-full max-w-full items-center justify-center overflow-hidden rounded-3xl border border-border-soft/60 bg-cream/40 p-4 sm:p-6">
        {images.length > 0 ? (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            drag={images.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative flex h-full w-full min-w-0 items-center justify-center touch-pan-y cursor-grab active:cursor-grabbing"
          >
            <img
              src={images[index]}
              alt={altText}
              className="h-auto max-h-full w-auto max-w-full select-none object-contain drop-shadow-xs"
              draggable={false}
            />
          </motion.div>
        ) : (
          <ProductPlaceholder name={product.name} colors={palette} />
        )}

        {/* Zoom button */}
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute right-3.5 top-3.5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-sm backdrop-blur-xs transition hover:bg-ivory hover:scale-105 active:scale-95"
            aria-label="Inspect high-resolution photo"
          >
            <ZoomIn size={16} />
          </button>
        )}

        {/* Left/Right Desktop Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-md backdrop-blur-xs transition hover:bg-ivory hover:scale-105 active:scale-95 sm:inline-flex"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-md backdrop-blur-xs transition hover:bg-ivory hover:scale-105 active:scale-95 sm:inline-flex"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Mobile Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-5 bg-ink' : 'w-2 bg-ink/30'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Selector Strip */}
      {images.length > 1 && (
        <div className="min-w-0 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex w-max min-w-full items-center gap-2.5 sm:gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 p-1 bg-cream/40 transition-all ${
                i === index
                  ? 'border-gold ring-2 ring-gold/30 shadow-xs'
                  : 'border-border-soft hover:border-border-soft/80'
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </button>
          ))}
          </div>
        </div>
      )}

      {/* High-Resolution Inspection Lightbox Modal */}
      {createPortal(
        <AnimatePresence>
          {lightbox && images[index] && (
            <motion.div
              className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="High-resolution image inspection"
            >
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
                onClick={() => setLightbox(false)}
                aria-hidden="true"
              />

              {/* Lightbox Content Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative z-10 flex max-h-[92svh] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-border-soft/40 bg-ivory p-4 sm:p-8 shadow-2xl"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setLightbox(false)}
                  className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream text-ink transition hover:bg-border-soft active:scale-95"
                  aria-label="Close lightbox"
                >
                  <X size={20} />
                </button>

                {/* Lightbox Image with Contain */}
                <div className="relative flex max-h-[85svh] w-full items-center justify-center sm:max-h-[75svh]">
                  <img
                    src={images[index]}
                    alt={altText}
                    className="max-h-[85svh] w-auto max-w-full select-none object-contain sm:max-h-[75svh]"
                  />
                </div>

                {/* Lightbox Controls */}
                {images.length > 1 && (
                  <div className="mt-4 flex items-center justify-between w-full max-w-xs px-2">
                    <button
                      type="button"
                      onClick={prevImage}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-cream text-ink hover:bg-border-soft transition active:scale-95"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs font-semibold text-ink-soft">
                      {index + 1} / {images.length}
                    </span>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-cream text-ink hover:bg-border-soft transition active:scale-95"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
