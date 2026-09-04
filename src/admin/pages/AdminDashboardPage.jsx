import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../../services/adminService'
import { formatBDT } from '../../utils/format'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadges'
import { supabase } from '../../lib/supabase'

const STATUS_CARDS = [
  { key: 'payment_pending', label: 'Awaiting Payment' },
  { key: 'payment_verification', label: 'Awaiting Verification' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_production', label: 'Preparing' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const result = await getDashboardStats()
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    setStats(result.data)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const byStatus = stats?.by_status || {}
  const awaiting = Number(stats?.awaiting_verification || 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-cream" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">Overview of Chumki orders and payments.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-dusty-rose/30 bg-blush/10 px-4 py-3 text-sm text-dusty-rose">
          {error}
        </p>
      )}

      {awaiting > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-gold/40 bg-cream/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Payment Verification Required</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {awaiting} payment{awaiting === 1 ? '' : 's'} awaiting verification
            </p>
          </div>
          <Link
            to="/admin/payments"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
          >
            Review Payments
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border-soft bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-gold">Total Orders</p>
          <p className="mt-2 font-display text-3xl">{stats?.total_orders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-gold">Today&apos;s Orders</p>
          <p className="mt-2 font-display text-3xl">{stats?.today_orders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-gold">Today&apos;s Revenue</p>
          <p className="mt-2 font-display text-3xl">{formatBDT(stats?.today_revenue ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-ivory p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-gold">Awaiting Verification</p>
          <p className="mt-2 font-display text-3xl">{awaiting}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {STATUS_CARDS.map((c) => (
          <Link
            key={c.key}
            to={`/admin/orders?status=${c.key}`}
            className="rounded-2xl border border-border-soft bg-cream/30 p-3 transition hover:border-gold/40"
          >
            <p className="text-[11px] font-semibold text-ink-soft">{c.label}</p>
            <p className="mt-1 font-display text-2xl">{byStatus[c.key] || 0}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-dusty-rose">
            View all
          </Link>
        </div>

        {(stats?.recent_orders || []).length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border-soft px-4 py-8 text-center text-sm text-ink-soft">
            No orders have arrived yet. Your Chumki dashboard will show them here.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border-soft md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-cream/50 text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recent_orders || []).map((o) => (
                    <tr key={o.id} className="border-t border-border-soft">
                      <td className="px-4 py-3 font-medium">{o.order_number}</td>
                      <td className="px-4 py-3">{o.customer_name}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{o.item_count}</td>
                      <td className="px-4 py-3">{formatBDT(o.total)}</td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={o.payment_status} />
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="text-sm font-semibold text-dusty-rose"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {(stats?.recent_orders || []).map((o) => (
                <Link
                  key={o.id}
                  to={`/admin/orders/${o.id}`}
                  className="block rounded-2xl border border-border-soft bg-ivory p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{o.order_number}</p>
                      <p className="text-sm text-ink-soft">{o.customer_name}</p>
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
          </>
        )}
      </section>
    </div>
  )
}
