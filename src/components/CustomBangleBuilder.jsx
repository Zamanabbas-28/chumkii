import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Upload, X, ShoppingBag } from 'lucide-react'
import {
  COLORS,
  SIZES,
  STYLES,
  SHAPES,
  SIZE_TYPES,
  DETAIL_OPTIONS,
} from '../data/customizationOptions'
import { THREADING_OPTIONS, getThreadingById } from '../data/threadingOptions'
import { calcCustomPrice } from '../utils/pricing'
import { formatBDT } from '../utils/format'
import { useCart } from '../context/CartContext'
import ColorSelector from './ColorSelector'
import BanglePreview from './BanglePreview'
import ThreadingSelector from './ThreadingSelector'
import SizeSelector from './SizeSelector'

const STEP_META = [
  { id: 'shape', label: 'Shape' },
  { id: 'type', label: 'Type' },
  { id: 'colors', label: 'Colors' },
  { id: 'style', label: 'Style' },
  { id: 'details', label: 'Details' },
  { id: 'threading', label: 'Threading' },
  { id: 'review', label: 'Review' },
]

const initial = {
  shape: null,
  sizeType: null,
  size: '2.4',
  baseColor: 'lavender',
  accentColors: ['silver'],
  styleId: 'stone-work',
  detailId: 'matching',
  threadingId: 'none',
  inspirationPreview: null,
  inspirationName: '',
  quantity: 1,
}

export default function CustomBangleBuilder() {
  const { addItem, setCartOpen } = useCart()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [added, setAdded] = useState(false)

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const visibleSteps = useMemo(() => {
    if (form.shape === 'square') {
      return STEP_META.filter((s) => s.id !== 'type')
    }
    return STEP_META
  }, [form.shape])

  useEffect(() => {
    setStep((s) => Math.min(s, visibleSteps.length - 1))
  }, [visibleSteps.length])

  const stepId = visibleSteps[step]?.id

  const baseHex =
    COLORS.find((c) => c.id === form.baseColor)?.hex || '#a78bbf'
  const accentHexes = form.accentColors
    .map((id) => COLORS.find((c) => c.id === id)?.hex)
    .filter(Boolean)

  const resolvedType = form.shape === 'square' ? 'small' : form.sizeType || 'small'

  const pricing = calcCustomPrice({
    shape: form.shape || 'round',
    sizeType: resolvedType,
    styleId: form.styleId,
    detailId: form.detailId,
    threadingId: form.threadingId,
    quantity: form.quantity,
  })

  const validate = () => {
    const e = {}
    if (stepId === 'shape' && !form.shape) e.shape = 'Choose a shape.'
    if (stepId === 'type' && !form.sizeType) e.sizeType = 'Choose Big or Small.'
    if (stepId === 'colors') {
      if (!form.baseColor) e.baseColor = 'Choose a base colour.'
      if (!form.accentColors.length) e.accentColors = 'Pick at least one accent.'
      if (!form.size) e.size = 'Choose a size.'
    }
    if (stepId === 'style' && !form.styleId) e.styleId = 'Choose a style.'
    if (stepId === 'details' && !form.detailId) e.detailId = 'Choose details.'
    if (stepId === 'threading' && !form.threadingId) e.threadingId = 'Choose threading.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    if (stepId === 'shape' && form.shape === 'square') {
      update({ sizeType: 'small' })
    }
    setStep((s) => Math.min(visibleSteps.length - 1, s + 1))
  }

  const back = () => setStep((s) => Math.max(0, s - 1))

  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () =>
      update({ inspirationPreview: reader.result, inspirationName: file.name })
    reader.readAsDataURL(file)
  }

  const addToCart = () => {
    const base = COLORS.find((c) => c.id === form.baseColor)
    const accents = form.accentColors
      .map((id) => COLORS.find((c) => c.id === id)?.name)
      .filter(Boolean)
    addItem({
      kind: 'custom',
      productId: 'custom',
      name: 'Custom Chumki',
      shape: form.shape,
      sizeType: resolvedType,
      size: form.size,
      baseColor: form.baseColor,
      color: base?.name,
      colorHex: baseHex,
      accentColors: form.accentColors,
      accentLabel: accents.join(', '),
      accentHex: accentHexes[0] || '#c0c0c0',
      styleId: form.styleId,
      detailId: form.detailId,
      threadingId: form.threadingId,
      price: pricing.unit,
      quantity: form.quantity,
    })
    setAdded(true)
  }

  if (added) {
    return (
      <div className="rounded-3xl border border-border-soft bg-cream/50 p-6 sm:p-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald/15 text-emerald">
          <Check size={22} />
        </div>
        <h3 className="font-display text-2xl text-ink sm:text-3xl">
          Added to your Chumki cart ✨
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          Keep browsing or open your bag to checkout when you&apos;re ready.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setAdded(false)
              setStep(0)
              setForm(initial)
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-ivory"
          >
            Continue shopping
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-soft px-6 text-sm font-semibold"
          >
            View cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {visibleSteps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (i < step) setStep(i)
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              i === step
                ? 'bg-ink text-ivory'
                : i < step
                  ? 'bg-blush/30 text-ink'
                  : 'bg-cream text-ink-soft'
            }`}
          >
            {i + 1} {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              {stepId === 'shape' && (
                <div>
                  <h3 className="font-display text-2xl text-ink">
                    Choose your bangle shape
                  </h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {SHAPES.map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() =>
                          update({
                            shape: sh.id,
                            sizeType: sh.id === 'square' ? 'small' : form.sizeType,
                          })
                        }
                        className={`rounded-2xl border p-5 text-left ${
                          form.shape === sh.id
                            ? 'border-gold bg-cream ring-1 ring-gold/30'
                            : 'border-border-soft bg-ivory'
                        }`}
                      >
                        <div className="mb-3 h-24">
                          <BanglePreview
                            compact
                            shape={sh.id}
                            sizeType="big"
                            baseColor="#c4878a"
                            accentColors={['#c4a574']}
                            threadingId="none"
                          />
                        </div>
                        <p className="font-display text-xl">{sh.name}</p>
                        <p className="mt-1 text-xs text-ink-soft">{sh.description}</p>
                      </button>
                    ))}
                  </div>
                  {errors.shape && (
                    <p className="mt-2 text-sm text-dusty-rose">{errors.shape}</p>
                  )}
                </div>
              )}

              {stepId === 'type' && (
                <div>
                  <h3 className="font-display text-2xl text-ink">
                    Choose your bangle size type
                  </h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {SIZE_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => update({ sizeType: t.id })}
                        className={`rounded-2xl border p-5 text-left ${
                          form.sizeType === t.id
                            ? 'border-gold bg-cream ring-1 ring-gold/30'
                            : 'border-border-soft bg-ivory'
                        }`}
                      >
                        <div className="mb-3 h-24">
                          <BanglePreview
                            compact
                            shape="round"
                            sizeType={t.id}
                            baseColor={baseHex}
                            accentColors={accentHexes}
                          />
                        </div>
                        <p className="font-display text-xl">{t.name}</p>
                        <p className="mt-1 text-xs text-ink-soft">{t.description}</p>
                      </button>
                    ))}
                  </div>
                  {errors.sizeType && (
                    <p className="mt-2 text-sm text-dusty-rose">{errors.sizeType}</p>
                  )}
                </div>
              )}

              {stepId === 'colors' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-2xl text-ink">
                      Colours & size
                    </h3>
                    <p className="mt-1 text-sm text-ink-soft">
                      Base colour stays visible — accents and threading sit on top.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Base colour</p>
                    <ColorSelector
                      colors={COLORS}
                      value={form.baseColor}
                      onChange={(id) => update({ baseColor: id })}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Accent colours</p>
                    <ColorSelector
                      colors={COLORS}
                      multiple
                      values={form.accentColors}
                      onChange={(vals) => update({ accentColors: vals })}
                    />
                  </div>
                  <SizeSelector
                    sizes={SIZES}
                    value={form.size}
                    onChange={(s) => update({ size: s })}
                  />
                  {(errors.baseColor || errors.accentColors || errors.size) && (
                    <p className="text-sm text-dusty-rose">
                      {errors.baseColor || errors.accentColors || errors.size}
                    </p>
                  )}
                </div>
              )}

              {stepId === 'style' && (
                <div>
                  <h3 className="font-display text-2xl text-ink">Design style</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => update({ styleId: style.id })}
                        className={`rounded-2xl border p-4 text-left ${
                          form.styleId === style.id
                            ? 'border-gold bg-cream'
                            : 'border-border-soft bg-ivory'
                        }`}
                      >
                        <p className="font-display text-lg">{style.name}</p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {style.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stepId === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-2xl text-ink">
                      Decorative details
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {DETAIL_OPTIONS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => update({ detailId: d.id })}
                          className={`min-h-11 rounded-full border px-4 text-sm ${
                            form.detailId === d.id
                              ? 'border-dusty-rose bg-blush/20'
                              : 'border-border-soft bg-cream'
                          }`}
                        >
                          {d.name}
                          {d.price > 0 ? ` (+${formatBDT(d.price)})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">
                      Inspiration photo <span className="font-normal text-ink-soft">(optional)</span>
                    </p>
                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gold/50 bg-cream/40 px-4 py-6 text-center">
                      <Upload className="mb-2 text-muted-gold" size={24} />
                      <span className="text-sm">Upload outfit or palette</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => onFile(e.target.files?.[0])}
                      />
                    </label>
                    {form.inspirationPreview && (
                      <div className="relative mt-3 inline-block">
                        <img
                          src={form.inspirationPreview}
                          alt="Inspiration"
                          className="max-h-40 rounded-xl object-contain"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-ivory"
                          onClick={() =>
                            update({ inspirationPreview: null, inspirationName: '' })
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {stepId === 'threading' && (
                <ThreadingSelector
                  options={THREADING_OPTIONS}
                  value={form.threadingId}
                  onChange={(id) => update({ threadingId: id })}
                />
              )}

              {stepId === 'review' && (
                <div className="space-y-5">
                  <h3 className="font-display text-2xl text-ink sm:text-3xl">
                    Your Custom Chumki ✨
                  </h3>
                  <dl className="space-y-2 rounded-2xl border border-border-soft bg-cream/50 p-4 text-sm">
                    {[
                      ['Shape', form.shape === 'square' ? 'Square' : 'Round'],
                      ['Type', resolvedType === 'big' ? 'Big' : 'Small'],
                      ['Size', form.size],
                      [
                        'Base Colour',
                        COLORS.find((c) => c.id === form.baseColor)?.name,
                      ],
                      [
                        'Accent Colour',
                        form.accentColors
                          .map((id) => COLORS.find((c) => c.id === id)?.name)
                          .join(', '),
                      ],
                      [
                        'Design Style',
                        STYLES.find((s) => s.id === form.styleId)?.name,
                      ],
                      [
                        'Decorative Details',
                        DETAIL_OPTIONS.find((d) => d.id === form.detailId)?.name,
                      ],
                      ['Threading', getThreadingById(form.threadingId).name],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex flex-col gap-0.5 border-b border-border-soft/60 py-2 last:border-0 sm:flex-row sm:justify-between"
                      >
                        <dt className="text-ink-soft">{k}</dt>
                        <dd className="font-medium sm:text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="rounded-2xl border border-border-soft bg-ivory p-4 text-sm">
                    <div className="flex justify-between text-ink-soft">
                      <span>Base</span>
                      <span>{formatBDT(pricing.base)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-ink-soft">
                      <span>Customization</span>
                      <span>{formatBDT(pricing.customization)}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-border-soft pt-2 font-semibold">
                      <span>Total</span>
                      <span>{formatBDT(pricing.unit)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addToCart}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-dusty-rose px-6 text-sm font-semibold text-ivory sm:w-auto"
                  >
                    <ShoppingBag size={18} />
                    Add Custom Bangle to Cart
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BanglePreview
            shape={form.shape || 'round'}
            sizeType={resolvedType}
            baseColor={baseHex}
            accentColors={accentHexes}
            styleId={form.styleId}
            threadingId={form.threadingId}
          />
          <p className="mt-3 text-center text-sm font-semibold text-ink">
            {formatBDT(pricing.unit)}
          </p>
        </div>
      </div>

      {stepId !== 'review' && (
        <div className="flex flex-col-reverse gap-3 border-t border-border-soft pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full border border-border-soft px-5 text-sm font-semibold disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-full bg-ink px-6 text-sm font-semibold text-ivory"
          >
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
