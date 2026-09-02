import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabasePublic'

const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

/** Shared Supabase browser client (anon key only — never service_role). */
export const supabase = createClient(url, anonKey)

export function isSupabaseConfigured() {
  return Boolean(url && anonKey)
}
