import { useState } from 'react'
import { MessageCircle, Sparkles, Send } from 'lucide-react'
import ContactChoiceModal from './ContactChoiceModal'

export default function CustomizationCTA({
  title = 'Want something made just for you? ✨',
  description = "Looking for a unique color combination, specific threading, or a fully personalized set? Send us a message and we'll help you create something special.",
  buttonText = 'DM Us for Customization',
  compact = false,
  customMessage = "Hi Chumki! ✨ I'd like to ask about a customized bangle design.",
  className = '',
}) {
  const [modalOpen, setModalOpen] = useState(false)

  if (compact) {
    return (
      <>
        <div
          className={`rounded-2xl border border-dashed border-gold/40 bg-cream/60 p-4 text-center sm:p-5 ${className}`}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-gold">
            <Sparkles size={14} className="text-gold" />
            <span>Custom Orders</span>
          </div>
          <p className="mt-1 text-sm font-display text-ink sm:text-base">
            {title}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
            {description}
          </p>
          <div className="mt-3.5 flex justify-center">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-ivory shadow-xs transition hover:bg-ink/90 active:scale-95"
            >
              <MessageCircle size={15} className="text-gold" />
              {buttonText}
            </button>
          </div>
        </div>

        <ContactChoiceModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          customMessage={customMessage}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl border border-border-soft bg-gradient-to-br from-cream/90 via-ivory to-soft-lavender/30 p-6 shadow-sm sm:p-10 ${className}`}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blush/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-gold shadow-xs">
            <Sparkles size={14} className="text-gold" />
            Bespoke & Custom Orders
          </span>
          <h3 className="mt-3 font-display text-2xl text-ink sm:text-3xl md:text-4xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-ink px-7 text-sm font-semibold text-ivory shadow-md transition hover:bg-ink/90 active:scale-[0.98]"
            >
              <Send size={16} className="text-gold" />
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      <ContactChoiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customMessage={customMessage}
      />
    </>
  )
}
