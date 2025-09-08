import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/customer-codes - Get all customer codes with customer info
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const customerIds = searchParams.get('customer_ids')

    let query = supabase
      .from('customer_codes')
      .select(`
        *,
        customers!inner(
          id,
          name,
          code,
          is_active
        )
      `)
      .order('created_at', { ascending: true })

    // If specific customer IDs are provided, filter by them
    if (customerIds) {
      const ids = customerIds.split(',').filter(id => id.trim())
      if (ids.length > 0) {
        query = query.in('customer_id', ids)
      }
    }

    const { data: codes, error } = await query

    if (error) {
      console.error('Error fetching customer codes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer codes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: codes })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
