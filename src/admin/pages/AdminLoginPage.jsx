import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminLoginPage() {
  const { signIn, resetPassword, loading, isAdmin, isAuthenticated, authError, setAuthError } =
    useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetMsg, setResetMsg] = useState(null)
  const [localError, setLocalError] = useState(null)

  if (!loading && isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setResetMsg(null)
    setAuthError(null)
    if (!email.trim() || !password) {
      setLocalError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (!result.ok) setLocalError(result.error)
  }

  const onForgot = async () => {
    setLocalError(null)
    setResetMsg(null)
    if (!email.trim()) {
      setLocalError('Enter your email first, then tap Forgot password.')
      return
    }
    setSubmitting(true)
    const result = await resetPassword(email)
    setSubmitting(false)
    if (result.ok) {
      setResetMsg('If that email is registered, a reset link has been sent.')
    } else {
      setLocalError(result.error)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ivory text-ink">
      <div
        className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-soft-lavender/40 blur-3xl"
        aria-hidden
      />
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <div className="rounded-3xl border border-border-soft bg-ivory/90 p-6 shadow-sm sm:p-8">
          <p className="font-display text-3xl tracking-wide">
            Chumki <span className="text-gold">✦</span>
          </p>
          <h1 className="mt-2 font-display text-2xl text-ink">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to manage orders and payments.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>

            {(localError || authError) && (
              <p className="rounded-2xl border border-dusty-rose/30 bg-blush/10 px-3 py-2 text-sm text-dusty-rose" role="alert">
                {localError || authError}
              </p>
            )}
            {resetMsg && (
              <p className="rounded-2xl border border-border-soft bg-cream/50 px-3 py-2 text-sm text-ink-soft">
                {resetMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-ivory disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            onClick={onForgot}
            disabled={submitting}
            className="mt-4 w-full text-center text-sm font-medium text-dusty-rose underline-offset-2 hover:underline"
          >
            Forgot password?
          </button>

          <p className="mt-8 text-center text-xs text-ink-soft">
            <Link to="/" className="underline-offset-2 hover:underline">
              ← Back to storefront
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
