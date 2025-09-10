import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const isExport = limit > 1000 // Detect export requests by high limit
    
    
    
    // Parse filter parameters
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const filtersParam = searchParams.get('filters')
    const filterLogic = searchParams.get('filterLogic') || 'AND'
    
    // Build query for cargo data
    let query = supabase
      .from('cargo_data')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Only apply range for normal pagination, not for exports
    if (!isExport) {
      query = query.range(offset, offset + limit - 1)
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`rec_id.ilike.%${search}%,orig_oe.ilike.%${search}%,dest_oe.ilike.%${search}%,inb_flight_no.ilike.%${search}%,outb_flight_no.ilike.%${search}%,mail_cat.ilike.%${search}%,mail_class.ilike.%${search}%`)
    }
    
    // Apply advanced filters if provided
    if (filtersParam) {
      try {
        const filters = JSON.parse(filtersParam)
        if (Array.isArray(filters) && filters.length > 0) {
          filters.forEach(filter => {
            const { field, operator, value } = filter
            
            switch (operator) {
              case 'equals':
                query = query.eq(field, value)
                break
              case 'contains':
                query = query.ilike(field, `%${value}%`)
                break
              case 'starts_with':
                query = query.ilike(field, `${value}%`)
                break
              case 'ends_with':
                query = query.ilike(field, `%${value}`)
                break
              case 'greater_than':
                query = query.gt(field, parseFloat(value))
                break
              case 'less_than':
                query = query.lt(field, parseFloat(value))
                break
              case 'not_empty':
                query = query.not(field, 'is', null)
                break
              case 'is_empty':
                query = query.is(field, null)
                break
            }
          })
        }
      } catch (error) {
        console.error('Error parsing filters:', error)
      }
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching cargo data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cargo data', details: error.message },
        { status: 500 }
      )
    }

    // Fetch customer data to resolve customer names
    let customersData: any[] = []
    if (data && data.length > 0) {
      // Get unique customer IDs from the cargo data
      const customerIds = [...new Set(data.map(record => record.assigned_customer).filter(Boolean))]
      
      if (customerIds.length > 0) {
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name, code')
          .in('id', customerIds)
        
        if (customersError) {
          console.error('Error fetching customers:', customersError)
        } else {
          customersData = customers || []
        }
      }
    }

    // Merge customer data with cargo data
    const enrichedData = data?.map(record => {
      const customer = customersData.find(c => c.id === record.assigned_customer)
      return {
        ...record,
        customers: customer || null
      }
    }) || []
    
    // Calculate pagination info
    const totalPages = isExport ? 1 : Math.ceil((count || 0) / limit)
    const hasNextPage = isExport ? false : page < totalPages
    const hasPrevPage = isExport ? false : page > 1
    
    return NextResponse.json({
      data: enrichedData,
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
