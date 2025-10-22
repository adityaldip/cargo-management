import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch all preview price assignment records
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('preview_price_assignment')
      .select(`
        *,
        sector_rates_v2 (
          id,
          text_label,
          sector_rate,
          customers (
            id,
            name,
            code
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching preview price assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new preview price assignment record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sector_rate_id } = body

    const { data, error } = await supabase
      .from('preview_price_assignment')
      .insert([{
        sector_rate_id
      }])
      .select(`
        *,
        sector_rates_v2 (
          id,
          text_label,
          sector_rate,
          customers (
            id,
            name,
            code
          )
        )
      `)
      .single()

    if (error) {
      console.error('Error creating preview price assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
