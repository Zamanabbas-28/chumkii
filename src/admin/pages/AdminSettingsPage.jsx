import { useEffect, useState } from 'react'
import { getAdminSettings, updateAdminSetting } from '../../services/adminService'
import { PAYMENT_CONFIG } from '../../config/paymentConfig'

export default function AdminSettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    ;(async () => {
      const result = await getAdminSettings()
      setLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEmail(result.data?.admin_notification_email || '')
    })()
  }, [])

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    const result = await updateAdminSetting('admin_notification_email', email)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMessage('Notification email saved.')
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Store notification and payment info.</p>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-3xl bg-cream" />
      ) : (
        <form
          onSubmit={onSave}
          className="space-y-4 rounded-3xl border border-border-soft bg-ivory p-5 sm:p-6"
        >
          <label className="block text-sm">
            <span className="font-semibold">Admin notification email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 min-h-12 w-full rounded-2xl border border-border-soft bg-cream/40 px-4 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
            <span className="mt-1 block text-xs text-ink-soft">
              Used for new order and payment proof emails (via Resend Edge Function).
            </span>
          </label>

          {error && (
            <p className="text-sm text-dusty-rose" role="alert">
              {error}
            </p>
          )}
          {message && <p className="text-sm text-emerald">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      <div className="rounded-3xl border border-border-soft bg-cream/30 p-5 text-sm">
        <p className="font-semibold">Advance payment (read-only)</p>
        <p className="mt-2 text-ink-soft">
          Methods:{' '}
          {PAYMENT_CONFIG.methods.map((m) => m.label).join(' / ')}
        </p>
        <p className="text-ink-soft">Pay to: {PAYMENT_CONFIG.payToNumber}</p>
        <p className="mt-2 text-xs text-ink-soft">
          Change these in <code className="text-ink">src/config/paymentConfig.js</code>.
        </p>
      </div>
    </div>
  )
}
