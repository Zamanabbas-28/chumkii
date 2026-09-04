import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminProtectedRoute({ children }) {
  const { loading, isAuthenticated, isAdmin } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory text-ink">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-gold/50" />
          <p className="mt-3 text-sm text-ink-soft">Checking access…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-4 text-ink">
        <div className="max-w-md rounded-3xl border border-border-soft bg-cream/40 p-8 text-center">
          <h1 className="font-display text-2xl">Access denied</h1>
          <p className="mt-2 text-sm text-ink-soft">
            This account is signed in but is not an admin.
          </p>
          <a
            href="/admin/login"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory"
          >
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return children
}
