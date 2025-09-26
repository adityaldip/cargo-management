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
    
    // Build query based on whether to include assigned records
    let query = supabaseAdmin
      .from('cargo_data')
      .select(field)
      .not(field, 'is', null)
      .not(field, 'eq', '')
      .order(field)
      .limit(50000) // Large limit to get most/all data
    
    // If not including assigned records, filter for unassigned only
    if (!includeAssigned) {
      query = query.is('rate_id', null) // Only get unassigned records
      console.log('Filtering for unassigned records only')
    } else {
      console.log('Including all records (assigned and unassigned)')
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase error fetching field values:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch field values', 
        details: error.message 
      }, { status: 500 })
    }

    console.log(`Fetched ${data?.length || 0} total records`)
    
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

    return NextResponse.json({ values: uniqueValues })
    
  } catch (error) {
    console.error('Error in field-values API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
