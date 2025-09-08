import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    // Build base query
    let query = supabase
      .from('cargo_data')
      .select('total_kg, assigned_rate')
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`rec_id.ilike.%${search}%,orig_oe.ilike.%${search}%,dest_oe.ilike.%${search}%,inb_flight_no.ilike.%${search}%,outb_flight_no.ilike.%${search}%,mail_cat.ilike.%${search}%,mail_class.ilike.%${search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching cargo data stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: error.message },
        { status: 500 }
      )
    }
    
    // Calculate statistics
    const totalWeight = data?.reduce((sum, record) => sum + (record.total_kg || 0), 0) || 0
    const totalRate = data?.reduce((sum, record) => sum + (record.assigned_rate || 0), 0) || 0
    const recordCount = data?.length || 0
    const avgWeight = recordCount > 0 ? totalWeight / recordCount : 0
    const avgRate = recordCount > 0 ? totalRate / recordCount : 0
    
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
