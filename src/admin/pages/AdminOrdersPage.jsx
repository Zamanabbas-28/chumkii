import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listOrders } from '../../services/adminService'
import { formatBDT } from '../../utils/format'
import { ORDER_STATUS } from '../../utils/orderStatus'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadges'

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: ORDER_STATUS.payment_pending, label: 'Payment Required' },
  { id: ORDER_STATUS.payment_verification, label: 'Awaiting Verification' },
  { id: ORDER_STATUS.confirmed, label: 'Order Confirmed' },
  { id: ORDER_STATUS.in_production, label: 'Preparing Your Chumki' },
  { id: ORDER_STATUS.ready_for_delivery, label: 'Ready for Delivery' },
  { id: ORDER_STATUS.shipped, label: 'On the Way' },
  { id: ORDER_STATUS.delivered, label: 'Delivered' },
  { id: ORDER_STATUS.cancelled, label: 'Cancelled' },
]

const PAYMENT_FILTERS = [
  { id: '', label: 'All payments' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'verification_pending', label: 'Awaiting Verification' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
]

function dateRange(preset) {
  const now = new Date()
  const startOfDay = (d) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const addDays = (d, n) => {
    const x = new Date(d)
    x.setDate(x.getDate() + n)
    return x
  }
  const today = startOfDay(now)
  switch (preset) {
    case 'today':
      return { from: today.toISOString(), to: addDays(today, 1).toISOString() }
    case 'yesterday': {
      const y = addDays(today, -1)
      return { from: y.toISOString(), to: today.toISOString() }
    }
    case '7d':
      return { from: addDays(today, -6).toISOString(), to: addDays(today, 1).toISOString() }
    case '30d':
      return { from: addDays(today, -29).toISOString(), to: addDays(today, 1).toISOString() }
    default:
      return { from: null, to: null }
  }
}

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(params.get('q') || '')
  const [search, setSearch] = useState(params.get('q') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [paymentStatus, setPaymentStatus] = useState(params.get('payment') || '')
  const [datePreset, setDatePreset] = useState(params.get('date') || '')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const range = useMemo(() => {
    if (datePreset === 'custom') {
      const from = customFrom ? new Date(customFrom).toISOString() : null
      let to = null
      if (customTo) {
        const end = new Date(customTo)
        end.setHours(23, 59, 59, 999)
        to = end.toISOString()
      }
      return { from, to }
    }
    return dateRange(datePreset)
  }, [datePreset, customFrom, customTo])

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listOrders({
      search,
      status,
      paymentStatus,
      dateFrom: range.from,
      dateTo: range.to,
      page,
      pageSize: 20,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setData(result.data)
  }, [search, status, paymentStatus, range.from, range.to, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const next = new URLSearchParams()
    if (search) next.set('q', search)
    if (status) next.set('status', status)
    if (paymentStatus) next.set('payment', paymentStatus)
    if (datePreset) next.set('date', datePreset)
    setParams(next, { replace: true })
  }, [search, status, paymentStatus, datePreset, setParams])

  const orders = data?.orders || []
  const total = data?.total || 0
  const pageSize = data?.page_size || 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">Search, filter, and manage customer orders.</p>
      </div>

      <div className="space-y-3 rounded-3xl border border-border-soft bg-cream/20 p-4">
        <label className="block">
          <span className="sr-only">Search orders</span>
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search order #, name, phone, transaction ID…"
            className="min-h-11 w-full rounded-2xl border border-border-soft bg-ivory px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              onClick={() => {
                setStatus(f.id)
                setPage(1)
              }}
              className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-semibold ${
                status === f.id
                  ? 'bg-ink text-ivory'
                  : 'border border-border-soft bg-ivory text-ink-soft'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {PAYMENT_FILTERS.map((f) => (
            <button
              key={f.id || 'pay-all'}
              type="button"
              onClick={() => {
                setPaymentStatus(f.id)
                setPage(1)
              }}
              className={`min-h-10 rounded-full px-3 text-xs font-semibold ${
                paymentStatus === f.id
                  ? 'bg-ink text-ivory'
                  : 'border border-border-soft bg-ivory text-ink-soft'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['', 'All time'],
            ['today', 'Today'],
            ['yesterday', 'Yesterday'],
            ['7d', 'Last 7 days'],
            ['30d', 'Last 30 days'],
            ['custom', 'Custom'],
          ].map(([id, label]) => (
            <button
              key={id || 'all-time'}
              type="button"
              onClick={() => {
                setDatePreset(id)
                setPage(1)
              }}
              className={`min-h-10 rounded-full px-3 text-xs font-semibold ${
                datePreset === id
                  ? 'bg-ink text-ivory'
                  : 'border border-border-soft bg-ivory text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {datePreset === 'custom' && (
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-semibold text-ink-soft">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value)
                  setPage(1)
                }}
                className="mt-1 block min-h-10 rounded-xl border border-border-soft bg-ivory px-3 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              To
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value)
                  setPage(1)
                }}
                className="mt-1 block min-h-10 rounded-xl border border-border-soft bg-ivory px-3 text-sm"
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-2xl border border-dusty-rose/30 bg-blush/10 px-4 py-3 text-sm text-dusty-rose">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-cream" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-soft px-4 py-10 text-center text-sm text-ink-soft">
          No orders match your filters.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-border-soft lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cream/50 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-3 py-3">Order #</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3">Subtotal</th>
                  <th className="px-3 py-3">Delivery</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border-soft">
                    <td className="px-3 py-3 font-medium">{o.order_number}</td>
                    <td className="px-3 py-3">
                      <p>{o.customer_name}</p>
                      <p className="text-xs text-ink-soft">{o.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{o.item_count}</td>
                    <td className="px-3 py-3">{formatBDT(o.subtotal)}</td>
                    <td className="px-3 py-3">{formatBDT(o.delivery_charge)}</td>
                    <td className="px-3 py-3 font-semibold">{formatBDT(o.total)}</td>
                    <td className="px-3 py-3">
                      <PaymentStatusBadge status={o.payment_status} />
                    </td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="font-semibold text-dusty-rose"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/admin/orders/${o.id}`}
                className="block rounded-2xl border border-border-soft bg-ivory p-4"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold">{o.order_number}</p>
                    <p className="text-sm text-ink-soft">{o.customer_name}</p>
                    <p className="text-xs text-ink-soft">
                      {new Date(o.created_at).toLocaleString()} · {o.item_count} item
                      {o.item_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="font-semibold">{formatBDT(o.total)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PaymentStatusBadge status={o.payment_status} />
                  <OrderStatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-ink-soft">
              Page {page} of {totalPages} · {total} orders
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
