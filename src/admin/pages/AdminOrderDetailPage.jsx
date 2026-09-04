import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addOrderNote,
  getOrder,
  getPaymentProofSignedUrl,
  rejectPayment,
  updateOrderStatus,
  verifyPayment,
} from '../../services/adminService'
import { formatBDT } from '../../utils/format'
import { getOrderStatusLabel } from '../../utils/orderStatus'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadges'
import { X, ZoomIn } from 'lucide-react'

const NEXT_STATUSES = {
  payment_pending: ['payment_verification', 'cancelled'],
  payment_verification: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['ready_for_delivery', 'cancelled'],
  ready_for_delivery: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function variantLabel(item) {
  const custom = item.customization_data || {}
  if (custom.variantLabel) return custom.variantLabel
  const t = item.variant_type
  if (t === 'full_stack') return 'Full Stack'
  if (t === 'big') return 'Big Bangle'
  if (t === 'medium') return 'Medium Bangle'
  if (t === 'small') return 'Small Bangle'
  if (t === 'piece') return 'Per piece'
  return t || '—'
}

function colorLines(item) {
  const c = item.customization_data || {}
  const lines = []
  if (c.isOriginalColor) {
    lines.push('Original Colors')
    return lines
  }
  if (c.bigColorLabel || (c.bigColorPreference && c.bigColorPreference !== 'original')) {
    lines.push(`Big: ${c.bigColorLabel || c.bigColorPreference}`)
  }
  if (c.mediumColorLabel || (c.mediumColorPreference && c.mediumColorPreference !== 'original')) {
    lines.push(`Medium: ${c.mediumColorLabel || c.mediumColorPreference}`)
  }
  if (c.smallColorLabel || (c.smallColorPreference && c.smallColorPreference !== 'original')) {
    lines.push(`Small: ${c.smallColorLabel || c.smallColorPreference}`)
  }
  if (c.pieceColorLabel || (c.pieceColorPreference && c.pieceColorPreference !== 'original')) {
    lines.push(`Color: ${c.pieceColorLabel || c.pieceColorPreference}`)
  }
  return lines
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState('')
  const [noteText, setNoteText] = useState('')
  const [proofUrl, setProofUrl] = useState(null)
  const [proofOpen, setProofOpen] = useState(false)
  const [proofLoading, setProofLoading] = useState(false)
  const [activePaymentId, setActivePaymentId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getOrder(orderId)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setBundle(result.data)
    setError(null)
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  const order = bundle?.order
  const items = bundle?.items || []
  const payments = bundle?.payments || []
  const history = bundle?.status_history || []
  const notes = bundle?.notes || []

  const pendingPayment = useMemo(
    () => payments.find((p) => p.payment_status === 'verification_pending'),
    [payments],
  )

  const allowedNext = order ? NEXT_STATUSES[order.status] || [] : []

  const openProof = async (path) => {
    setProofLoading(true)
    setProofOpen(true)
    setProofUrl(null)
    const result = await getPaymentProofSignedUrl(path)
    setProofLoading(false)
    if (result.ok) setProofUrl(result.url)
    else setActionError(result.error)
  }

  const onVerify = async () => {
    if (!activePaymentId) return
    setBusy(true)
    setActionError(null)
    const result = await verifyPayment(activePaymentId)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setVerifyOpen(false)
    setActivePaymentId(null)
    await load()
  }

  const onReject = async () => {
    if (!activePaymentId) return
    setBusy(true)
    setActionError(null)
    const result = await rejectPayment(activePaymentId, rejectReason)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setRejectOpen(false)
    setRejectReason('')
    setActivePaymentId(null)
    await load()
  }

  const onStatus = async () => {
    if (!nextStatus) return
    setBusy(true)
    setActionError(null)
    const result = await updateOrderStatus(orderId, nextStatus)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setStatusOpen(false)
    setNextStatus('')
    await load()
  }

  const onAddNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setBusy(true)
    const result = await addOrderNote(orderId, noteText)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setNoteText('')
    await load()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-cream" />
        <div className="h-40 animate-pulse rounded-3xl bg-cream" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="rounded-3xl border border-border-soft bg-cream/30 p-8 text-center">
        <h1 className="font-display text-2xl">Order not found</h1>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <Link to="/admin/orders" className="mt-4 inline-block text-sm font-semibold text-dusty-rose">
          ← Back to orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <Link to="/admin/orders" className="text-sm text-ink-soft hover:text-ink">
          ← Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl">{order.order_number}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={payments[0]?.payment_status} />
          </div>
        </div>
      </div>

      {actionError && (
        <p className="rounded-2xl border border-dusty-rose/30 bg-blush/10 px-4 py-3 text-sm text-dusty-rose">
          {actionError}
        </p>
      )}

      {pendingPayment && (
        <div className="rounded-3xl border border-gold/40 bg-cream/50 p-4 sm:p-5">
          <p className="text-sm font-semibold">Payment awaiting verification</p>
          <p className="mt-1 text-sm text-ink-soft">
            {pendingPayment.payment_method === 'bkash' ? 'bKash' : 'Rocket'} ·{' '}
            {formatBDT(pendingPayment.payment_amount)}
            {pendingPayment.transaction_id
              ? ` · Tx: ${pendingPayment.transaction_id}`
              : ''}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openProof(pendingPayment.payment_proof_path)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft bg-ivory px-4 text-sm font-semibold"
            >
              <ZoomIn size={16} /> View Screenshot
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePaymentId(pendingPayment.id)
                setVerifyOpen(true)
              }}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-ivory"
            >
              Verify Payment
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePaymentId(pendingPayment.id)
                setRejectOpen(true)
              }}
              className="inline-flex min-h-11 items-center rounded-full border border-dusty-rose/40 px-4 text-sm font-semibold text-dusty-rose"
            >
              Reject Payment
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-border-soft bg-ivory p-5">
            <h2 className="font-display text-xl">Customer</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Name</dt>
                <dd className="font-medium text-right">{order.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Phone</dt>
                <dd className="font-medium text-right">{order.phone}</dd>
              </div>
              {order.email && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Email</dt>
                  <dd className="font-medium text-right">{order.email}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">District</dt>
                <dd className="font-medium text-right">{order.district}</dd>
              </div>
              {order.area && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Area</dt>
                  <dd className="font-medium text-right">{order.area}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink-soft">Address</dt>
                <dd className="mt-1 font-medium">{order.full_address}</dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="text-ink-soft">Customer notes</dt>
                  <dd className="mt-1 font-medium">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-3xl border border-border-soft bg-ivory p-5">
            <h2 className="font-display text-xl">Items</h2>
            <ul className="mt-4 space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-border-soft/70 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-xs text-ink-soft">
                        {variantLabel(item)}
                        {item.size ? ` · Size ${item.size}"` : ''} · Qty {item.quantity}
                      </p>
                      {colorLines(item).map((line) => (
                        <p key={line} className="text-xs text-ink-soft">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="text-right text-sm">
                      <p>{formatBDT(item.unit_price)} each</p>
                      <p className="font-semibold">{formatBDT(item.total_price)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border-soft pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="text-ink">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Delivery</span>
                <span className="text-ink">{formatBDT(order.delivery_charge)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatBDT(order.total)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Advance</span>
                <span className="text-ink">{formatBDT(order.advance_amount)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Remaining</span>
                <span className="text-ink">{formatBDT(order.remaining_amount)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-border-soft bg-ivory p-5">
            <h2 className="font-display text-xl">Order status</h2>
            <p className="mt-2 text-sm">
              Current: <strong>{getOrderStatusLabel(order.status)}</strong>
            </p>
            {allowedNext.length > 0 && (
              <div className="mt-4 space-y-2">
                <label className="block text-xs font-semibold text-ink-soft">
                  Change status
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="mt-1 min-h-11 w-full rounded-2xl border border-border-soft bg-cream/40 px-3 text-sm"
                  >
                    <option value="">Select…</option>
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>
                        {getOrderStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!nextStatus}
                  onClick={() => setStatusOpen(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-ivory disabled:opacity-40"
                >
                  Update status
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border-soft bg-ivory p-5">
            <h2 className="font-display text-xl">Payment history</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">No payment submitted yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {payments.map((p) => (
                  <li key={p.id} className="rounded-2xl border border-border-soft bg-cream/30 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <PaymentStatusBadge status={p.payment_status} />
                      <span className="text-xs text-ink-soft">
                        {new Date(p.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2">
                      {p.payment_method === 'bkash' ? 'bKash' : 'Rocket'} ·{' '}
                      {formatBDT(p.payment_amount)}
                    </p>
                    {p.transaction_id && (
                      <p className="text-xs text-ink-soft">Tx: {p.transaction_id}</p>
                    )}
                    {p.rejection_reason && (
                      <p className="mt-1 text-xs text-dusty-rose">{p.rejection_reason}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => openProof(p.payment_proof_path)}
                      className="mt-2 text-xs font-semibold text-dusty-rose"
                    >
                      View screenshot
                    </button>
                    {p.payment_status === 'verification_pending' && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePaymentId(p.id)
                            setVerifyOpen(true)
                          }}
                          className="text-xs font-semibold text-emerald"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePaymentId(p.id)
                            setRejectOpen(true)
                          }}
                          className="text-xs font-semibold text-dusty-rose"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-border-soft bg-ivory p-5">
            <h2 className="font-display text-xl">Timeline</h2>
            <ol className="mt-3 space-y-3 border-l border-border-soft pl-4">
              {history.length === 0 && (
                <li className="text-sm text-ink-soft">No status history yet.</li>
              )}
              {history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                  <p className="font-semibold">{getOrderStatusLabel(h.new_status)}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(h.created_at).toLocaleString()}
                    {h.note ? ` · ${h.note}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-border-soft bg-ivory p-5">
            <h2 className="font-display text-xl">Internal notes</h2>
            <p className="mt-1 text-xs text-ink-soft">Never shown to customers.</p>
            <form onSubmit={onAddNote} className="mt-3 space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="e.g. Customer requested evening delivery"
                className="w-full rounded-2xl border border-border-soft bg-cream/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              />
              <button
                type="submit"
                disabled={busy || !noteText.trim()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border-soft text-sm font-semibold disabled:opacity-40"
              >
                Add note
              </button>
            </form>
            <ul className="mt-4 space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-cream/40 px-3 py-2 text-sm">
                  <p>{n.note}</p>
                  <p className="mt-1 text-[10px] text-ink-soft">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <AdminConfirmDialog
        open={verifyOpen}
        title="Verify payment?"
        description="Confirm that you have verified this payment. The order will move to Order Confirmed."
        confirmLabel="Verify Payment"
        loading={busy}
        onCancel={() => !busy && setVerifyOpen(false)}
        onConfirm={onVerify}
      />

      <AdminConfirmDialog
        open={rejectOpen}
        title="Reject payment?"
        description="The customer can submit a new payment proof. Previous screenshots are kept."
        confirmLabel="Reject Payment"
        tone="danger"
        loading={busy}
        onCancel={() => !busy && setRejectOpen(false)}
        onConfirm={onReject}
      >
        <label className="block text-sm">
          <span className="font-semibold">Reason</span>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-2xl border border-border-soft bg-cream/40 px-3 text-sm"
          >
            <option value="">Select a reason…</option>
            <option value="Incorrect amount">Incorrect amount</option>
            <option value="Invalid transaction ID">Invalid transaction ID</option>
            <option value="Screenshot unclear">Screenshot unclear</option>
            <option value="Payment not received">Payment not received</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={statusOpen}
        title="Update order status?"
        description={
          nextStatus
            ? `Mark this order as ${getOrderStatusLabel(nextStatus)}?`
            : ''
        }
        confirmLabel="Confirm"
        loading={busy}
        onCancel={() => !busy && setStatusOpen(false)}
        onConfirm={onStatus}
      />

      {proofOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/70"
            aria-label="Close"
            onClick={() => setProofOpen(false)}
          />
          <div className="relative z-10 max-h-[92svh] w-full max-w-3xl overflow-auto rounded-3xl border border-border-soft bg-ivory p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-xl">Payment screenshot</p>
              <button
                type="button"
                onClick={() => setProofOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {proofLoading && (
              <p className="py-16 text-center text-sm text-ink-soft">Loading screenshot…</p>
            )}
            {!proofLoading && proofUrl && (
              <>
                <img
                  src={proofUrl}
                  alt="Payment proof"
                  className="mx-auto max-h-[75svh] w-auto max-w-full object-contain"
                />
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-dusty-rose"
                >
                  Open in new tab
                </a>
              </>
            )}
            {!proofLoading && !proofUrl && (
              <p className="py-10 text-center text-sm text-dusty-rose">
                Screenshot could not be loaded.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
