import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const customer = searchParams.get('customer')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Build query
    let query = supabaseAdmin
      .from('cargo_data')
      .select(`
        *,
        rates (
          id,
          name,
          description,
          rate_type,
          base_rate,
          currency
        )
      `)
    
    // Apply filters
    if (customer) {
      query = query.eq('assigned_customer', customer)
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('cargo_data')
      .select('*', { count: 'exact', head: true })
    
    if (customer) {
      countQuery = countQuery.eq('assigned_customer', customer)
    }
    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom)
    }
    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo)
    }
    
    const { count } = await countQuery
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching cargo data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cargo data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    console.error('Error in cargo-data API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('cargo_data')
      .insert(body)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating cargo data:', error)
      return NextResponse.json(
        { error: 'Failed to create cargo data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
    
  } catch (error) {
    console.error('Error in cargo-data POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}