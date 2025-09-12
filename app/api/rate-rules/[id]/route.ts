import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Fetch rate rule by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DEBUG: Fetching rate rule by ID ===')
    console.log('Requested ID:', params.id)
    
    // First, let's see what rate rules exist in the database
    const { data: allRules, error: allRulesError } = await supabaseAdmin
      .from('rate_rules')
      .select('id, name')
      .limit(10)
    
    console.log('All rate rules in database:', allRules)
    console.log('All rules error:', allRulesError)

    const { data: rateRule, error } = await supabaseAdmin
      .from('rate_rules')
      .select('*')
      .eq('id', params.id)
      .single()

    console.log('Specific rule query result:', { rateRule, error })

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

    console.log('=== DEBUG: Rate rule update API ===')
    console.log('Params ID:', params.id)
    console.log('Params ID type:', typeof params.id)
    console.log('Request body:', body)

    // Validate ID parameter
    if (!params.id) {
      console.log('ERROR: No ID parameter provided')
      return NextResponse.json(
        { error: 'Rate rule ID is required' },
        { status: 400 }
      )
    }

    // Check if rule exists
    console.log('Checking if rule exists with ID:', params.id)
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('rate_rules')
      .select('id')
      .eq('id', params.id)
      .single()

    console.log('Existing rule query result:', { existingRule, fetchError })

    if (fetchError || !existingRule) {
      console.log('ERROR: Rule not found or fetch error:', fetchError)
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

    const { data: rateRule, error } = await supabaseAdmin
      .from('rate_rules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating rate rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rateRule, error: null })
  } catch (error) {
    console.error('Rate rule update error:', error)
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
      console.error('Error deleting rate rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: null, error: null })
  } catch (error) {
    console.error('Rate rule deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
