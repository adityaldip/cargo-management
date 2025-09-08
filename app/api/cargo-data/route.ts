import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    
    // Parse filter parameters
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Build query
    let query = supabase
      .from('cargo_data')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`rec_id.ilike.%${search}%,orig_oe.ilike.%${search}%,dest_oe.ilike.%${search}%,inb_flight_no.ilike.%${search}%,outb_flight_no.ilike.%${search}%,mail_cat.ilike.%${search}%,mail_class.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching cargo data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cargo data', details: error.message },
        { status: 500 }
      )
    }
    
    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage,
        offset
      }
    })
    
  } catch (error) {
    console.error('Error in cargo-data API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Get total count only (for statistics)
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    let query = supabase
      .from('cargo_data')
      .select('id', { count: 'exact', head: true })
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`rec_id.ilike.%${search}%,orig_oe.ilike.%${search}%,dest_oe.ilike.%${search}%,inb_flight_no.ilike.%${search}%,outb_flight_no.ilike.%${search}%,mail_cat.ilike.%${search}%,mail_class.ilike.%${search}%`)
    }
    
    const { count, error } = await query
    
    if (error) {
      console.error('Error getting cargo data count:', error)
      return NextResponse.json(
        { error: 'Failed to get count', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ count: count || 0 })
    
  } catch (error) {
    console.error('Error in cargo-data count API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
