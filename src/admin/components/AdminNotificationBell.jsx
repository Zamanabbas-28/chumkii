import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../../services/adminService'
import { supabase } from '../../lib/supabase'

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listNotifications(40, false)
    setLoading(false)
    if (result.ok) {
      setItems(result.data?.notifications || [])
      setUnread(result.data?.unread || 0)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          load()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (!panelRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const onOpen = async () => {
    setOpen((v) => !v)
    if (!open) await load()
  }

  const onClickItem = async (n) => {
    if (!n.read) {
      await markNotificationsRead([n.id])
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      )
      setUnread((u) => Math.max(0, u - 1))
    }
    setOpen(false)
  }

  const onMarkAll = async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={onOpen}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-soft bg-ivory text-ink hover:bg-cream"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dusty-rose px-1 text-[10px] font-bold text-ivory">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border-soft bg-ivory shadow-xl">
          <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-xs font-semibold text-dusty-rose"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-soft">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-soft">
                No new notifications.
              </p>
            )}
            {items.map((n) => (
              <Link
                key={n.id}
                to={n.order_id ? `/admin/orders/${n.order_id}` : '/admin/orders'}
                onClick={() => onClickItem(n)}
                className={`block border-b border-border-soft/70 px-4 py-3 text-left transition hover:bg-cream/50 ${
                  n.read ? 'opacity-70' : 'bg-soft-lavender/20'
                }`}
              >
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">{n.message}</p>
                <p className="mt-1 text-[10px] text-ink-soft">
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString()
                    : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
