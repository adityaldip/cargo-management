import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('cargo_data')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection test failed:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }
    
    console.log('Connection test successful, total records:', data)
    
    // Test assigned customers query
    const { count: assignedCount, error: assignedError } = await supabase
      .from('cargo_data')
      .select('*', { count: 'exact', head: true })
      .not('assigned_customer', 'is', null)
      .neq('assigned_customer', '')
    
    if (assignedError) {
      console.error('Assigned customers query failed:', assignedError)
      return NextResponse.json({
        success: false,
        error: 'Assigned customers query failed',
        details: assignedError.message,
        hint: assignedError.hint,
        code: assignedError.code
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      totalRecords: data,
      assignedRecords: assignedCount,
      message: 'Connection test successful'
    })
    
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
