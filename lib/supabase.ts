import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing - admin operations will not work')
}

// Client for browser (anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Admin client for server operations (service role key or fallback to anon)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error)
  return {
    error: error.message || 'An unexpected error occurred',
    details: error.details || null,
  }
}

// Helper function for safe database operations with timeout
export async function safeSupabaseOperation<T>(
  operation: () => any,
  timeoutMs = 10000
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
    
    const result = await Promise.race([
      operation(),
      timeoutPromise
    ])
    
    if (result.error) {
      const errorInfo = handleSupabaseError(result.error)
      return { data: null, error: errorInfo.error }
    }
    
    return { data: result.data, error: null }
  } catch (error) {
    const errorInfo = handleSupabaseError(error)
    return { data: null, error: errorInfo.error }
  }
}
