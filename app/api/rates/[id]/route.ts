import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch rate by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: rate, error } = await supabaseAdmin
      .from('rates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rate, error: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update rate
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate ID parameter
    if (!params.id) {
      return NextResponse.json(
        { error: 'Rate ID is required' },
        { status: 400 }
      )
    }

    // Check if rate exists
    const { data: existingRate, error: fetchError } = await supabaseAdmin
      .from('rates')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingRate) {
      return NextResponse.json(
        { error: 'Rate not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data: rate, error } = await supabaseAdmin
      .from('rates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating rate:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rate, error: null })
  } catch (error) {
    console.error('Rate update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete rate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID parameter
    if (!params.id) {
      return NextResponse.json(
        { error: 'Rate ID is required' },
        { status: 400 }
      )
    }

    // Check if rate exists
    const { data: existingRate, error: fetchError } = await supabaseAdmin
      .from('rates')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingRate) {
      return NextResponse.json(
        { error: 'Rate not found' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('rates')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting rate:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: null, error: null })
  } catch (error) {
    console.error('Rate deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
