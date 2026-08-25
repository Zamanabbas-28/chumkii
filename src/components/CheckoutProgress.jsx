const STEPS = [
  { id: 'cart', label: 'Cart' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
]

/** Map legacy 'confirmed' step id used by older pages */
const ALIASES = {
  confirmed: 'confirmation',
}

export default function CheckoutProgress({ current = 'checkout' }) {
  const normalized = ALIASES[current] || current
  const currentIndex = STEPS.findIndex((s) => s.id === normalized)

  return (
    <nav aria-label="Order progress" className="mb-8">
      <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((step, i) => {
          const active = i === currentIndex
          const done = i < currentIndex
          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              {i > 0 && (
                <span
                  className={`hidden h-px w-4 sm:block sm:w-8 ${
                    done || active ? 'bg-gold' : 'bg-border-soft'
                  }`}
                  aria-hidden
                />
              )}
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    active
                      ? 'bg-ink text-ivory'
                      : done
                        ? 'bg-gold/80 text-ivory'
                        : 'bg-cream text-ink-soft'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-xs font-medium sm:text-sm ${
                    active ? 'text-ink' : 'text-ink-soft'
                  }`}
                >
                  {step.label}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
