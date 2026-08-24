import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  )
}

/** Shared Supabase browser client (anon key only — never service_role). */
export const supabase =
  url && anonKey ? createClient(url, anonKey) : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}
