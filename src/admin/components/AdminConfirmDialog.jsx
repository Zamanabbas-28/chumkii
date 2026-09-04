import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  const titleId = useId()
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, loading, onCancel])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-dusty-rose text-ivory hover:bg-dusty-rose/90'
      : 'bg-ink text-ivory hover:bg-ink/90'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        aria-label="Close dialog"
        disabled={loading}
        onClick={() => !loading && onCancel?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-border-soft bg-ivory p-6 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-2xl text-ink">
            {title}
          </h2>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-cream"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-soft px-5 text-sm font-semibold text-ink"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
