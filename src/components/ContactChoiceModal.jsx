import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Sparkles, ArrowUpRight } from 'lucide-react'
import { getWhatsAppUrl, getInstagramUrl } from '../config/contact'
import InstagramIcon from './InstagramIcon'

export default function ContactChoiceModal({
  isOpen,
  onClose,
  title = 'How would you like to reach us? ✨',
  subtitle = "Tell us what you'd like to customize and we'll be happy to help.",
  customMessage = "Hi Chumki! ✨ I'd like to ask about a customized bangle.",
}) {
  const waUrl = getWhatsAppUrl(customMessage)
  const igUrl = getInstagramUrl()

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-choice-title"
          aria-describedby="contact-choice-desc"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal / Bottom Sheet Card */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl border border-border-soft bg-ivory p-6 pb-8 shadow-2xl sm:p-8"
          >
            {/* Mobile Sheet Handle Bar */}
            <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-border-soft sm:hidden" />

            {/* Header with Close button */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-gold shadow-2xs">
                  <Sparkles size={13} className="text-gold" />
                  Custom Order
                </span>
                <h2
                  id="contact-choice-title"
                  className="mt-2.5 font-display text-2xl text-ink sm:text-3xl"
                >
                  {title}
                </h2>
                <p
                  id="contact-choice-desc"
                  className="mt-1.5 text-xs text-ink-soft sm:text-sm leading-relaxed"
                >
                  {subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream hover:text-ink active:scale-95"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Exactly Two Platform Choices */}
            <div className="mt-6 space-y-3">
              {/* WhatsApp Button */}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="group flex min-h-[4.25rem] w-full items-center justify-between gap-4 rounded-2xl border border-border-soft bg-emerald/5 p-4 text-left transition hover:border-emerald/40 hover:bg-emerald/10 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald text-ivory shadow-xs">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-lg font-medium text-ink">
                          WhatsApp
                        </span>
                        <span className="rounded-full bg-emerald/20 px-2 py-0.5 text-[10px] font-bold text-emerald">
                          Fastest
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">
                        Chat with us directly on WhatsApp
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory text-ink shadow-2xs transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight size={16} />
                  </div>
                </a>
              )}

              {/* Instagram Button */}
              {igUrl && (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="group flex min-h-[4.25rem] w-full items-center justify-between gap-4 rounded-2xl border border-border-soft bg-dusty-rose/5 p-4 text-left transition hover:border-dusty-rose/40 hover:bg-dusty-rose/10 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-dusty-rose to-gold text-ivory shadow-xs">
                      <InstagramIcon size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="font-display text-lg font-medium text-ink">
                        Instagram
                      </span>
                      <p className="text-xs text-ink-soft">
                        Send us a DM on @chumkii.ii
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory text-ink shadow-2xs transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight size={16} />
                  </div>
                </a>
              )}
            </div>

            {/* Reassurance footer */}
            <p className="mt-5 text-center text-[11px] text-ink-soft">
              We respond to inquiries as quickly as possible during studio hours ✨
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
