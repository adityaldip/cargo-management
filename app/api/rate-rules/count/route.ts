import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Counting cargo data for rate rules - mode: ALL DATA')
    
    // Count total cargo data (always all data now)
    const { count, error } = await supabaseAdmin
      .from('cargo_data')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Error counting cargo data:', error)
      return NextResponse.json(
        { error: 'Failed to count cargo data', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        recordsToProcess: count || 0,
        totalRecords: count || 0,
        processingMode: 'ALL_DATA',
        message: `Found ${count || 0} total cargo records to process`
      }
    })
    
  } catch (error) {
    console.error('Error in rate rules count API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
