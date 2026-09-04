import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fetchAdminProfile } from '../services/adminService'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const refreshProfile = async () => {
    const result = await fetchAdminProfile()
    if (result.ok && result.isAdmin) {
      setProfile(result.profile)
      return true
    }
    setProfile(result.profile || null)
    return Boolean(result.isAdmin)
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          setLoading(false)
          setAuthError('Supabase is not configured.')
        }
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)

      if (data.session) {
        await refreshProfile()
      }
      if (mounted) setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      if (next) {
        await refreshProfile()
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setAuthError(null)
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Admin login is temporarily unavailable.' }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      const msg =
        error.message?.toLowerCase().includes('invalid')
          ? 'Invalid email or password.'
          : 'Could not sign in. Please try again.'
      setAuthError(msg)
      return { ok: false, error: msg }
    }

    setSession(data.session)
    const isAdmin = await refreshProfile()
    if (!isAdmin) {
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      const msg = 'This account is not authorized for the admin dashboard.'
      setAuthError(msg)
      return { ok: false, error: msg }
    }
    return { ok: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Password reset is temporarily unavailable.' }
    }
    const redirectTo = `${window.location.origin}/admin/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })
    if (error) {
      return { ok: false, error: 'Could not send reset email. Please try again.' }
    }
    return { ok: true }
  }

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      authError,
      isAdmin: profile?.role === 'admin',
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
      resetPassword,
      setAuthError,
    }),
    [session, profile, loading, authError],
  )

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return ctx
}
