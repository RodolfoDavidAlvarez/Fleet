import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './config'

export function createClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create Supabase client:', error)
    }
    // Re-throw to prevent silent failures
    throw error
  }
}
