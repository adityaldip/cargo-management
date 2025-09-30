import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filters = searchParams.get('filters')
    const filterLogic = searchParams.get('filterLogic')
    
    // Initialize statistics
    let totalWeight = 0
    let totalRate = 0
    let recordCount = 0
    
    // Fetch all records in batches to avoid Supabase's 1000 record limit
    const batchSize = 1000
    let currentPage = 1
    let hasMoreData = true
    
    console.log('🔄 Starting stats calculation with batched approach...')
    
    while (hasMoreData) {
      // Build query for current batch
      let query = supabase
        .from('cargo_data')
        .select('total_kg, assigned_rate, rate_value')
        .range((currentPage - 1) * batchSize, currentPage * batchSize - 1)
      
      // Apply search filter if provided
      if (search) {
        query = query.or(`rec_id.ilike.%${search}%,orig_oe.ilike.%${search}%,dest_oe.ilike.%${search}%,inb_flight_no.ilike.%${search}%,outb_flight_no.ilike.%${search}%,mail_cat.ilike.%${search}%,mail_class.ilike.%${search}%`)
      }
      
      // Apply filter conditions if provided
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
          console.error('Error parsing filters in stats API:', error)
        }
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching cargo data stats batch:', error)
        return NextResponse.json(
          { error: 'Failed to fetch statistics', details: error.message },
          { status: 500 }
        )
      }
      
      // Process batch data
      if (data && data.length > 0) {
        const batchWeight = data.reduce((sum, record: any) => sum + (record.total_kg || 0), 0)
        const batchRate = data.reduce((sum, record: any) => sum + (record.assigned_rate || record.rate_value || 0), 0)
        
        totalWeight += batchWeight
        totalRate += batchRate
        recordCount += data.length
        
        console.log(`📊 Batch ${currentPage}: ${data.length} records, Weight: ${batchWeight.toFixed(1)}kg, Rate: €${batchRate.toFixed(2)}`)
        
        // If we got less than batchSize records, we've reached the end
        if (data.length < batchSize) {
          hasMoreData = false
        } else {
          currentPage++
        }
      } else {
        hasMoreData = false
      }
    }
    
    // Calculate final statistics
    const avgWeight = recordCount > 0 ? totalWeight / recordCount : 0
    const avgRate = recordCount > 0 ? totalRate / recordCount : 0
    
    console.log(`✅ Stats calculation complete: ${recordCount} records, Total Weight: ${totalWeight.toFixed(1)}kg, Total Rate: €${totalRate.toFixed(2)}`)
    
    return NextResponse.json({
      totalWeight,
      totalRate,
      recordCount,
      avgWeight,
      avgRate
    })
    
  } catch (error) {
    console.error('Error in cargo-data stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
