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
    const filters = searchParams.get('filters')
    const filterLogic = searchParams.get('filterLogic')
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Build query with joins to rates table
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
    
    // Apply legacy filters
    if (customer) {
      query = query.eq('assigned_customer', customer)
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }
    
    // Apply new filter conditions
    if (filters) {
      try {
        const filterConditions = JSON.parse(filters)
        
        // Apply filter conditions based on logic
        if (filterLogic === 'OR') {
          // For OR logic, build OR conditions
          const orConditions: string[] = []
          
          filterConditions.forEach((condition: any) => {
            const { field, operator, value } = condition
            
            // Map frontend field names to database column names
            const dbField = field === 'assigned_customer' ? 'assigned_customer' :
                           field === 'assigned_rate' ? 'assigned_rate' :
                           field === 'total_kg' ? 'total_kg' :
                           field === 'inb_flight_date' ? 'inb_flight_date' :
                           field === 'outb_flight_date' ? 'outb_flight_date' :
                           field === 'rec_id' ? 'rec_id' :
                           field === 'orig_oe' ? 'orig_oe' :
                           field === 'dest_oe' ? 'dest_oe' :
                           field === 'mail_cat' ? 'mail_cat' :
                           field === 'mail_class' ? 'mail_class' :
                           field === 'invoice' ? 'invoice' :
                           field
            
            switch (operator) {
              case 'equals':
                orConditions.push(`${dbField}.eq.${value}`)
                break
              case 'contains':
                orConditions.push(`${dbField}.ilike.%${value}%`)
                break
              case 'starts_with':
                orConditions.push(`${dbField}.ilike.${value}%`)
                break
              case 'ends_with':
                orConditions.push(`${dbField}.ilike.%${value}`)
                break
              case 'greater_than':
                orConditions.push(`${dbField}.gt.${parseFloat(value)}`)
                break
              case 'less_than':
                orConditions.push(`${dbField}.lt.${parseFloat(value)}`)
                break
              case 'not_empty':
                orConditions.push(`and(${dbField}.not.is.null,${dbField}.neq.)`)
                break
              case 'is_empty':
                orConditions.push(`or(${dbField}.is.null,${dbField}.eq.)`)
                break
            }
          })
          
          if (orConditions.length > 0) {
            query = query.or(orConditions.join(','))
          }
        } else {
          // For AND logic (default), apply filters sequentially
          filterConditions.forEach((condition: any) => {
            const { field, operator, value } = condition
            
            // Map frontend field names to database column names
            const dbField = field === 'assigned_customer' ? 'assigned_customer' :
                           field === 'assigned_rate' ? 'assigned_rate' :
                           field === 'total_kg' ? 'total_kg' :
                           field === 'inb_flight_date' ? 'inb_flight_date' :
                           field === 'outb_flight_date' ? 'outb_flight_date' :
                           field === 'rec_id' ? 'rec_id' :
                           field === 'orig_oe' ? 'orig_oe' :
                           field === 'dest_oe' ? 'dest_oe' :
                           field === 'mail_cat' ? 'mail_cat' :
                           field === 'mail_class' ? 'mail_class' :
                           field === 'invoice' ? 'invoice' :
                           field
            
            switch (operator) {
              case 'equals':
                query = query.eq(dbField, value)
                break
              case 'contains':
                query = query.ilike(dbField, `%${value}%`)
                break
              case 'starts_with':
                query = query.ilike(dbField, `${value}%`)
                break
              case 'ends_with':
                query = query.ilike(dbField, `%${value}`)
                break
              case 'greater_than':
                query = query.gt(dbField, parseFloat(value))
                break
              case 'less_than':
                query = query.lt(dbField, parseFloat(value))
                break
              case 'not_empty':
                query = query.not(dbField, 'is', null).neq(dbField, '')
                break
              case 'is_empty':
                query = query.or(`${dbField}.is.null,${dbField}.eq.`)
                break
            }
          })
        }
      } catch (error) {
        console.error('Error parsing filters:', error)
      }
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('cargo_data')
      .select('*', { count: 'exact', head: true })
    
    // Apply legacy filters to count query
    if (customer) {
      countQuery = countQuery.eq('assigned_customer', customer)
    }
    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom)
    }
    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo)
    }
    
    // Apply new filter conditions to count query
    if (filters) {
      try {
        const filterConditions = JSON.parse(filters)
        
        // Apply filter conditions based on logic
        if (filterLogic === 'OR') {
          // For OR logic, build OR conditions
          const orConditions: string[] = []
          
          filterConditions.forEach((condition: any) => {
            const { field, operator, value } = condition
            
            // Map frontend field names to database column names
            const dbField = field === 'assigned_customer' ? 'assigned_customer' :
                           field === 'assigned_rate' ? 'assigned_rate' :
                           field === 'total_kg' ? 'total_kg' :
                           field === 'inb_flight_date' ? 'inb_flight_date' :
                           field === 'outb_flight_date' ? 'outb_flight_date' :
                           field === 'rec_id' ? 'rec_id' :
                           field === 'orig_oe' ? 'orig_oe' :
                           field === 'dest_oe' ? 'dest_oe' :
                           field === 'mail_cat' ? 'mail_cat' :
                           field === 'mail_class' ? 'mail_class' :
                           field === 'invoice' ? 'invoice' :
                           field
            
            switch (operator) {
              case 'equals':
                orConditions.push(`${dbField}.eq.${value}`)
                break
              case 'contains':
                orConditions.push(`${dbField}.ilike.%${value}%`)
                break
              case 'starts_with':
                orConditions.push(`${dbField}.ilike.${value}%`)
                break
              case 'ends_with':
                orConditions.push(`${dbField}.ilike.%${value}`)
                break
              case 'greater_than':
                orConditions.push(`${dbField}.gt.${parseFloat(value)}`)
                break
              case 'less_than':
                orConditions.push(`${dbField}.lt.${parseFloat(value)}`)
                break
              case 'not_empty':
                orConditions.push(`and(${dbField}.not.is.null,${dbField}.neq.)`)
                break
              case 'is_empty':
                orConditions.push(`or(${dbField}.is.null,${dbField}.eq.)`)
                break
            }
          })
          
          if (orConditions.length > 0) {
            countQuery = countQuery.or(orConditions.join(','))
          }
        } else {
          // For AND logic (default), apply filters sequentially
          filterConditions.forEach((condition: any) => {
            const { field, operator, value } = condition
            
            // Map frontend field names to database column names
            const dbField = field === 'assigned_customer' ? 'assigned_customer' :
                           field === 'assigned_rate' ? 'assigned_rate' :
                           field === 'total_kg' ? 'total_kg' :
                           field === 'inb_flight_date' ? 'inb_flight_date' :
                           field === 'outb_flight_date' ? 'outb_flight_date' :
                           field === 'rec_id' ? 'rec_id' :
                           field === 'orig_oe' ? 'orig_oe' :
                           field === 'dest_oe' ? 'dest_oe' :
                           field === 'mail_cat' ? 'mail_cat' :
                           field === 'mail_class' ? 'mail_class' :
                           field === 'invoice' ? 'invoice' :
                           field
            
            switch (operator) {
              case 'equals':
                countQuery = countQuery.eq(dbField, value)
                break
              case 'contains':
                countQuery = countQuery.ilike(dbField, `%${value}%`)
                break
              case 'starts_with':
                countQuery = countQuery.ilike(dbField, `${value}%`)
                break
              case 'ends_with':
                countQuery = countQuery.ilike(dbField, `%${value}`)
                break
              case 'greater_than':
                countQuery = countQuery.gt(dbField, parseFloat(value))
                break
              case 'less_than':
                countQuery = countQuery.lt(dbField, parseFloat(value))
                break
              case 'not_empty':
                countQuery = countQuery.not(dbField, 'is', null).neq(dbField, '')
                break
              case 'is_empty':
                countQuery = countQuery.or(`${dbField}.is.null,${dbField}.eq.`)
                break
            }
          })
        }
      } catch (error) {
        console.error('Error parsing filters for count query:', error)
      }
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
    
    // Fetch customer data separately and merge
    let enrichedData: any[] = data || []
    if (enrichedData.length > 0) {
      // Get unique customer codes from the cargo data
      const customerCodes = [...new Set(enrichedData.map((item: any) => item.assigned_customer).filter(Boolean))]
            
      if (customerCodes.length > 0) {
        // The assigned_customer field contains customer IDs (UUIDs), not codes
        // So we need to match by customer ID
        const { data: customersById, error: customerError } = await supabaseAdmin
          .from('customers')
          .select('id, name, code')
          .in('id', customerCodes)
                
        let customerMap = new Map()
        
        if (!customerError && customersById && customersById.length > 0) {
          // Create a map for quick lookup by ID
          customerMap = new Map(customersById.map((c: any) => [c.id, c.name]))
        } else {          
          // If no matches by ID, try to match by code as fallback
          const { data: customersByCode, error: codeError } = await supabaseAdmin
            .from('customers')
            .select('id, name, code')
            .in('code', customerCodes)
                   
          if (!codeError && customersByCode && customersByCode.length > 0) {
            // Create a map for quick lookup by code
            customerMap = new Map(customersByCode.map((c: any) => [c.code, c.name]))
          }
        }
        
        // Enrich the data with customer names
        enrichedData = enrichedData.map((item: any) => {
          let customerName = item.assigned_customer // Default fallback
          
          // Try to find customer name using the map
          if (customerMap.has(item.assigned_customer)) {
            customerName = customerMap.get(item.assigned_customer)
          }
          
          return {
            ...item,
            customer_name: customerName
          }
        })
      }
    }
    
    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: page < Math.ceil((count || 0) / limit),
        hasPrevPage: page > 1
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