import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPaymentQueue } from '../../services/adminService'
import { formatBDT } from '../../utils/format'

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listPaymentQueue(page, 20)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setData(result.data)
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const payments = data?.payments || []
  const total = data?.total || 0
  const pageSize = data?.page_size || 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Payment Verification</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Review payment proofs waiting for confirmation.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-dusty-rose/30 bg-blush/10 px-4 py-3 text-sm text-dusty-rose">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-cream" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-soft px-4 py-12 text-center text-sm text-ink-soft">
          You&apos;re all caught up — no payments awaiting verification.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {payments.map((p) => (
              <li
                key={p.payment_id}
                className="rounded-3xl border border-border-soft bg-ivory p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{p.order_number}</p>
                    <p className="text-sm text-ink-soft">{p.customer_name}</p>
                    <p className="mt-1 text-sm">
                      {formatBDT(p.payment_amount)} ·{' '}
                      {p.payment_method === 'bkash' ? 'bKash' : 'Rocket'}
                      {p.transaction_id ? ` · ${p.transaction_id}` : ''}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Submitted {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/admin/orders/${p.order_id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-soft">
              Page {page} of {totalPages} · {total} pending
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-10 rounded-full border border-border-soft px-4 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="min-h-10 rounded-full border border-border-soft px-4 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
