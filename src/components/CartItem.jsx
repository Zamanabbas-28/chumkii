import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatBDT } from '../utils/format'
import { getThreadingById } from '../data/threadingOptions'
import ProductPlaceholder from './ProductPlaceholder'
import BanglePreview from './BanglePreview'

export default function CartItem({ item, onRemove, onUpdateQty }) {
  const threading = getThreadingById(item.threadingId || 'none')
  const colors = [item.colorHex || '#c4a574', item.accentHex || '#d4a5a5']

  return (
    <li className="flex gap-3 rounded-2xl border border-border-soft bg-cream/40 p-3">
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
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {item.kind === 'custom' ? (
                <>
                  {item.shape === 'square' ? 'Square' : 'Round'}
                  {item.sizeType ? ` — ${item.sizeType === 'big' ? 'Big' : 'Small'}` : ''}
                  <br />
                  Size {item.size}
                  {item.color ? ` · ${item.color}` : ''}
                  {item.accentLabel ? ` · Accent ${item.accentLabel}` : ''}
                  <br />
                  Threading: {threading.name}
                </>
              ) : (
                <>
                  {item.variantLabel || item.variantId}
                  <br />
                  Size {item.size}
                  {item.color ? ` · ${item.color}` : ''}
                  {item.threadingId && item.threadingId !== 'none' ? (
                    <>
                      <br />
                      Threading: {threading.name}
                    </>
                  ) : null}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            className="text-ink-soft hover:text-dusty-rose"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-ivory px-1">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center"
              onClick={() => onUpdateQty(item.key, item.quantity - 1)}
              aria-label="Decrease"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-5 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center"
              onClick={() => onUpdateQty(item.key, item.quantity + 1)}
              aria-label="Increase"
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
