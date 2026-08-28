import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatBDT } from '../utils/format'
import { getThreadingById } from '../data/threadingOptions'
import ProductPlaceholder from './ProductPlaceholder'
import BanglePreview from './BanglePreview'

export default function CartItem({ item, onRemove, onUpdateQty }) {
  const threading = getThreadingById(item.threadingId || 'none')
  const colors = [item.colorHex || '#c4a574', item.accentHex || '#d4a5a5']

  const renderColorDetails = () => {
    if (item.kind === 'custom') {
      return (
        <>
          {item.shape === 'square' ? 'Square' : 'Round'}
          {item.sizeType ? ` — ${item.sizeType === 'big' ? 'Big' : 'Small'}` : ''}
          <br />
          Size: {item.size}&quot;
          {item.color ? ` · ${item.color}` : ''}
          {item.accentLabel ? ` · Accent ${item.accentLabel}` : ''}
          {item.threadingId && item.threadingId !== 'none' ? (
            <>
              <br />
              Threading: {threading.name}
            </>
          ) : null}
        </>
      )
    }

    const hasBigPref = item.bigColorPreference && item.bigColorPreference !== 'original'
    const hasSmallPref = item.smallColorPreference && item.smallColorPreference !== 'original'
    const hasPiecePref = item.pieceColorPreference && item.pieceColorPreference !== 'original'

    return (
      <>
        <span className="font-medium text-ink">{item.variantLabel || item.variantId}</span>
        {item.size ? ` · Size ${item.size}"` : ''}
        <br />
        {item.isOriginalColor ? (
          <span className="text-ink-soft">Original Colors</span>
        ) : (
          <span className="text-ink-soft">
            {hasBigPref && <span>Big: {item.bigColorLabel || item.bigColorPreference}</span>}
            {hasBigPref && hasSmallPref && <span> · </span>}
            {hasSmallPref && <span>Small: {item.smallColorLabel || item.smallColorPreference}</span>}
            {hasPiecePref && <span>Color: {item.pieceColorLabel || item.pieceColorPreference}</span>}
            {!hasBigPref && !hasSmallPref && !hasPiecePref && (item.color || 'Original Colors')}
          </span>
        )}
      </>
    )
  }

  return (
    <li className="flex gap-3.5 rounded-2xl border border-border-soft bg-cream/40 p-3.5">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ivory">
        {item.kind === 'custom' ? (
          <div className="h-full w-full scale-75">
            <BanglePreview
              compact
              shape={item.shape}
              sizeType={item.sizeType}
              baseColor={item.colorHex}
              accentColors={[item.accentHex]}
              styleId={item.styleId}
              threadingId={item.threadingId}
            />
          </div>
        ) : (
          <ProductPlaceholder name={item.name} colors={colors} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg leading-tight text-ink">
              {item.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {renderColorDetails()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            className="p-1 text-ink-soft hover:text-dusty-rose transition active:scale-90"
            aria-label={`Remove ${item.name} from bag`}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-ivory px-1.5 py-0.5 shadow-xs">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-cream transition active:scale-90"
              onClick={() => onUpdateQty(item.key, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-6 text-center text-xs font-semibold text-ink">
              {item.quantity}
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-cream transition active:scale-90"
              onClick={() => onUpdateQty(item.key, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-sm font-semibold text-ink">
            {formatBDT(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </li>
  )
}
