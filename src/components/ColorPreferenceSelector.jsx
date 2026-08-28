import { useState } from 'react'
import { Sparkles, MessageCircle, Check } from 'lucide-react'
import ContactChoiceModal from './ContactChoiceModal'

export default function ColorPreferenceSelector({
  label = 'Color Preference',
  description,
  colorOptions = [],
  originalLabel = 'Keep Original Color',
  originalPalette = [],
  value = 'original',
  onChange,
  productName = '',
  targetPart = '',
  showDmPrompt = false,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const isOriginalSelected = value === 'original' || !value

  const dmText = `Hi Chumki! ✨ I'm checking out ${productName ? `"${productName}"` : 'a bangle stack'}${
    targetPart ? ` (${targetPart})` : ''
  }, and I was wondering if a custom/different color preference is possible?`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-ink">
          {label}
        </label>
        {isOriginalSelected ? (
          <span className="text-xs font-medium text-ink-soft">
            As shown in photo
          </span>
        ) : (
          <span className="text-xs font-semibold text-dusty-rose">
            Custom preference chosen
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-ink-soft leading-relaxed">{description}</p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Keep Original Option */}
        <button
          type="button"
          onClick={() => onChange('original')}
          className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
            isOriginalSelected
              ? 'border-gold bg-cream/80 ring-2 ring-gold/40 shadow-sm'
              : 'border-border-soft bg-ivory hover:bg-cream/40'
          }`}
          aria-pressed={isOriginalSelected}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-soft bg-ivory shadow-xs">
            {originalPalette && originalPalette.length > 0 ? (
              <div className="flex -space-x-1 overflow-hidden rounded-full">
                {originalPalette.slice(0, 2).map((c, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border border-white"
                    style={{ backgroundColor: c.hex || '#c4a574' }}
                  />
                ))}
              </div>
            ) : (
              <Sparkles size={14} className="text-gold" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink leading-tight">
              {originalLabel}
            </p>
            <p className="text-[11px] text-ink-soft">As pictured in stack</p>
          </div>
          {isOriginalSelected && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-ivory text-xs font-bold">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>

        {/* Available Color Options */}
        {colorOptions.map((c) => {
          const selected = value === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                selected
                  ? 'border-gold bg-cream/80 ring-2 ring-gold/40 shadow-sm'
                  : 'border-border-soft bg-ivory hover:bg-cream/40'
              }`}
              aria-pressed={selected}
            >
              <span
                className="h-7 w-7 shrink-0 rounded-full border border-white/60 shadow-xs"
                style={{ backgroundColor: c.hex }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink leading-tight">
                  {c.name}
                </p>
                <p className="text-[11px] text-ink-soft">Silk thread preference</p>
              </div>
              {selected && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-ivory text-xs font-bold">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {showDmPrompt && (
        <div className="rounded-2xl border border-dashed border-border-soft bg-cream/40 p-3 text-xs leading-relaxed text-ink-soft sm:flex sm:items-center sm:justify-between sm:gap-3">
          <div className="mb-2 sm:mb-0">
            <span className="font-semibold text-ink">Looking for another color? ✨</span>{' '}
            For color preferences not listed here, please DM us and we&apos;ll check what&apos;s possible.
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-ivory shadow-xs transition hover:bg-ink/90 active:scale-95"
          >
            <MessageCircle size={13} className="text-gold" />
            DM Us
          </button>
        </div>
      )}

      <ContactChoiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customMessage={dmText}
      />
    </div>
  )
}
