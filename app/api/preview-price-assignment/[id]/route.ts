import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch single preview price assignment record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching preview price assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update preview price assignment record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { sector_rate_id } = body

    const { data, error } = await supabase
      .from('preview_price_assignment')
      .update({
        sector_rate_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
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
      console.error('Error updating preview price assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete preview price assignment record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('preview_price_assignment')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting preview price assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
