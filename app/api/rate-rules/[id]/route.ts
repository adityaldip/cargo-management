import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch rate rule by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { data: rateRule, error } = await supabaseAdmin
      .from('rate_rules')
      .select('*')
      .eq('id', params.id)
      .single()


    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rateRule, error: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update rate rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()


    // Validate ID parameter
    if (!params.id) {
      return NextResponse.json(
        { error: 'Rate rule ID is required' },
        { status: 400 }
      )
    }

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('rate_rules')
      .select('id')
      .eq('id', params.id)
      .single()


    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rate rule not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data: rateRule, error } = await (supabaseAdmin as any)
      .from('rate_rules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rateRule, error: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete rate rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID parameter
    if (!params.id) {
      return NextResponse.json(
        { error: 'Rate rule ID is required' },
        { status: 400 }
      )
    }

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('rate_rules')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rate rule not found' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('rate_rules')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: null, error: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
