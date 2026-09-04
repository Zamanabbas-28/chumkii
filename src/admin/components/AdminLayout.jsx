import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminNotificationBell from './AdminNotificationBell'

const links = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/payments', label: 'Payment Verification', icon: CreditCard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function NavItems({ onNavigate }) {
  return (
    <ul className="space-y-1">
      {links.map(({ to, end, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-ink text-ivory'
                  : 'text-ink-soft hover:bg-cream hover:text-ink'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export default function AdminLayout() {
  const { signOut, profile } = useAdminAuth()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)

  const logout = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ivory text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border-soft bg-ivory md:flex md:flex-col">
        <div className="border-b border-border-soft px-5 py-5">
          <p className="font-display text-2xl tracking-wide">
            Chumki <span className="text-gold">Admin</span>
          </p>
          <p className="mt-1 truncate text-xs text-ink-soft">{profile?.email}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavItems />
        </nav>
        <div className="border-t border-border-soft p-3">
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-ink-soft hover:bg-cream hover:text-ink"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border-soft bg-ivory/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-soft md:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <p className="font-display text-xl md:hidden">
              Chumki <span className="text-gold">Admin</span>
            </p>
          </div>
          <AdminNotificationBell />
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-ivory shadow-xl">
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-4">
              <p className="font-display text-xl">Menu</p>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                onClick={() => setDrawer(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavItems onNavigate={() => setDrawer(false)} />
            </nav>
            <div className="border-t border-border-soft p-3">
              <button
                type="button"
                onClick={logout}
                className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-ink-soft"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
