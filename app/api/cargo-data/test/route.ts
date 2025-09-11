import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('cargo_data')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database connection test failed:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Test if table exists and has data
    const { count, error: countError } = await supabaseAdmin
      .from('cargo_data')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Count query failed:', countError)
      return NextResponse.json({
        success: false,
        error: countError.message,
        details: countError
      }, { status: 500 })
    }

    // Test sample query
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('cargo_data')
      .select('id, assigned_customer, total_kg, created_at')
      .limit(5)

    if (sampleError) {
      console.error('Sample query failed:', sampleError)
      return NextResponse.json({
        success: false,
        error: sampleError.message,
        details: sampleError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        totalRecords: count,
        sampleRecords: sampleData?.length || 0,
        sampleData: sampleData || []
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
