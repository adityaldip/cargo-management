import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const field = searchParams.get('field')
    const includeAssigned = searchParams.get('includeAssigned') === 'true'
    
    console.log('Field-values API called with field:', field, 'includeAssigned:', includeAssigned)
    
    if (!field) {
      return NextResponse.json({ error: 'Field parameter is required' }, { status: 400 })
    }

    // Validate field name to prevent SQL injection
    const allowedFields = [
      'inb_flight_date', 'outb_flight_date', 'rec_id', 'des_no', 'rec_numb',
      'orig_oe', 'dest_oe', 'inb_flight_no', 'outb_flight_no', 'mail_cat',
      'mail_class', 'total_kg', 'invoice', 'assigned_customer', 'assigned_rate'
    ]
    
    if (!allowedFields.includes(field)) {
      console.error('Invalid field name:', field)
      return NextResponse.json({ error: 'Invalid field name' }, { status: 400 })
    }

    console.log('Fetching unique values for field:', field)
    
    // Fetch all data using pagination to bypass Supabase's 1000 limit
    let allData: any[] = []
    let offset = 0
    const pageSize = 1000
    let hasMore = true
    let totalCount = 0
    
    console.log('Fetching data with pagination to bypass 1000 limit...')
    
    while (hasMore) {
      // Build query for current page
      let query = supabaseAdmin
        .from('cargo_data')
        .select(field, { count: 'exact' })
        .not(field, 'is', null)
        .not(field, 'eq', '')
        .order(field)
        .range(offset, offset + pageSize - 1)
      
      // If not including assigned records, filter for unassigned only
      if (!includeAssigned) {
        query = query.is('rate_id', null)
      }
      
      const { data: pageData, error, count } = await query
      
      if (error) {
        console.error('Supabase error fetching field values:', error)
        return NextResponse.json({ 
          error: 'Failed to fetch field values', 
          details: error.message 
        }, { status: 500 })
      }
      
      if (pageData && pageData.length > 0) {
        allData = [...allData, ...pageData]
        totalCount = count || 0
        console.log(`Fetched page ${Math.floor(offset / pageSize) + 1}: ${pageData.length} records (total so far: ${allData.length})`)
        
        // Check if we got less than pageSize, meaning we're done
        if (pageData.length < pageSize) {
          hasMore = false
        } else {
          offset += pageSize
        }
      } else {
        hasMore = false
      }
    }
    
    const data = allData
    const count = totalCount

    console.log(`Fetched ${data?.length || 0} total records`)
    console.log(`Total count available: ${count}`)
    
    // Log pagination info
    const pagesFetched = Math.ceil(data.length / 1000)
    console.log(`Fetched ${pagesFetched} pages of data`)
    
    if (!data || data.length === 0) {
      console.log('No data found for field:', field)
      return NextResponse.json({ values: [] })
    }

    // Extract unique values and sort them
    const uniqueValues = [...new Set(data.map(row => row[field]))]
      .filter(value => value !== null && value !== undefined && value !== '')
      .sort()

    console.log(`Found ${uniqueValues.length} unique values for field ${field}`)
    console.log('Sample values:', uniqueValues.slice(0, 10))
    
    // If we have a lot of data, we might want to implement pagination in the future
    if (uniqueValues.length > 50000) {
      console.warn(`⚠️ Large dataset: ${uniqueValues.length} unique values. Consider implementing pagination.`)
    }

    return NextResponse.json({ 
      values: uniqueValues,
      totalCount: count,
      totalFetched: data.length,
      pagesFetched: Math.ceil(data.length / 1000)
    })
    
  } catch (error) {
    console.error('Error in field-values API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
