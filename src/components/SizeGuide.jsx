import { useMemo, useState } from 'react'
import { SIZE_DIAMETER_INCHES, SIZES } from '../data/colors'

function recommendSize(value, unit) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null

  let inches = num
  if (unit === 'mm') inches = num / 25.4
  if (unit === 'cm') inches = num / 2.54

  let best = SIZES[0]
  let bestDiff = Infinity
  for (const size of SIZES) {
    const d = Math.abs(SIZE_DIAMETER_INCHES[size] - inches)
    if (d < bestDiff) {
      bestDiff = d
      best = size
    }
  }
  return { size: best, inches }
}

export default function SizeGuide() {
  const [unit, setUnit] = useState('inches')
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  const result = useMemo(() => {
    if (!value.trim()) return null
    return recommendSize(value, unit)
  }, [value, unit])

  const invalid =
    touched &&
    value.trim() !== '' &&
    (result === null || Number(value) <= 0 || Number.isNaN(Number(value)))

  const rangeHint =
    unit === 'inches'
      ? 'Typical values are around 2.2–2.8 inches'
      : unit === 'cm'
        ? 'Typical values are around 5.6–7.1 cm'
        : 'Typical values are around 56–71 mm'

  return (
    <section id="size-guide" className="bg-ivory px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-gold">
          Fit matters
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Size Guide
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          The correct Chumki size is determined by the{' '}
          <strong className="font-semibold text-ink">
            inside diameter of the bangle
          </strong>
          . We currently offer {SIZES.join(', ')}.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <div
              key={s}
              className="rounded-2xl border border-border-soft bg-cream/70 px-5 py-4 text-center"
            >
              <p className="font-display text-2xl text-ink">{s}</p>
              <p className="mt-1 text-xs text-ink-soft">
                ≈ {SIZE_DIAMETER_INCHES[s]} in inside Ø
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Diameter mapping is approximate and easy to update if Chumki confirms
          a specific sizing standard.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-border-soft bg-cream/40 p-6">
            <h3 className="font-display text-2xl text-ink">
              Measure an existing bangle
            </h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Take a bangle that already fits comfortably.</li>
              <li>Place it flat on a table.</li>
              <li>
                Measure the inside diameter from one inner edge to the opposite
                inner edge.
              </li>
              <li>Choose the closest available Chumki size.</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-border-soft bg-cream/40 p-6">
            <h3 className="font-display text-2xl text-ink">Measure your hand</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Bring your thumb and little finger together.</li>
              <li>
                Measure around the widest part of your hand (usually across the
                knuckles).
              </li>
              <li>
                Divide that circumference by π (≈ 3.14) to estimate inside
                diameter, then pick the closest Chumki size — or use a
                well-fitting bangle when you can.
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-border-soft bg-soft-lavender/30 p-6 sm:p-8">
          <h3 className="font-display text-2xl text-ink">
            Interactive size finder
          </h3>
          <p className="mt-2 text-sm text-ink-soft">
            Enter your measured inside diameter and we&apos;ll suggest the
            closest Chumki size.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ['inches', 'Inches'],
              ['cm', 'Centimetres'],
              ['mm', 'Millimetres'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setUnit(id)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                  unit === id
                    ? 'bg-ink text-ivory'
                    : 'bg-ivory text-ink-soft border border-border-soft'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="size-input"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Inside diameter ({unit})
              </label>
              <input
                id="size-input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setTouched(true)
                }}
                placeholder={
                  unit === 'inches' ? 'e.g. 2.4' : unit === 'cm' ? 'e.g. 6.1' : 'e.g. 61'
                }
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-ivory px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-ink-soft">{rangeHint}</p>

          {invalid && (
            <p className="mt-3 text-sm text-dusty-rose" role="alert">
              Please enter a valid positive number for your measurement.
            </p>
          )}

          {result && !invalid && value.trim() && (
            <div className="mt-5 rounded-2xl bg-ivory px-5 py-4">
              <p className="text-sm text-ink-soft">Closest Chumki size</p>
              <p className="font-display text-4xl text-ink">{result.size}</p>
              <p className="mt-1 text-xs text-ink-soft">
                Based on ≈ {result.inches.toFixed(2)} in inside diameter.
                Always double-check with a bangle that already fits when
                possible.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
