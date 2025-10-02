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
  
  let userFriendlyMessage = error.message || 'An unexpected error occurred'
  
  // Handle specific database constraint errors
  if (error.message) {
    if (error.message.includes('duplicate key value violates unique constraint')) {
      if (error.message.includes('flights_flight_number_key')) {
        userFriendlyMessage = 'This flight number already exists. Please choose a different flight number.'
      } else if (error.message.includes('customers_code_key')) {
        userFriendlyMessage = 'This customer code already exists. Please choose a different code.'
      } else if (error.message.includes('airport_code_code_key')) {
        userFriendlyMessage = 'This airport code already exists. Please choose a different code.'
      } else {
        userFriendlyMessage = 'This record already exists. Please check for duplicates.'
      }
    } else if (error.message.includes('violates foreign key constraint')) {
      userFriendlyMessage = 'Invalid reference. Please check your selections.'
    } else if (error.message.includes('violates check constraint')) {
      userFriendlyMessage = 'Invalid data provided. Please check your input values.'
    } else if (error.message.includes('null value in column')) {
      userFriendlyMessage = 'Required field is missing. Please fill in all required fields.'
    }
  }
  
  return {
    error: userFriendlyMessage,
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
