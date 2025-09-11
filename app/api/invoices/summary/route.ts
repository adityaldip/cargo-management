import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customer = searchParams.get('customer')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'invoice_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Calculate offset
    const offset = (page - 1) * limit
    
    // Build query using the view
    let query = supabase
      .from('invoice_summary_view')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (customer) {
      query = query.ilike('customer_name', `%${customer}%`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching invoice summary:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoice summary' },
        { status: 500 }
      )
    }
    
    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      invoices: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
    
  } catch (error) {
    console.error('Error in invoice summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get single invoice summary
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { invoiceId } = await request.json()
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('invoice_summary_view')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single()
    
    if (error) {
      console.error('Error fetching invoice summary:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invoice summary' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ invoice: data })
    
  } catch (error) {
    console.error('Error in invoice summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
