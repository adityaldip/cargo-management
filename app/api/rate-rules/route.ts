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

// GET - Fetch all rate rules with rate information
export async function GET() {
  try {
    console.log('=== DEBUG: Rate Rules API GET ===')
    
    // First, let's check what's in the rate_rules table
    const { data: rawRateRules, error: rawError } = await supabaseAdmin
      .from('rate_rules')
      .select('*')
      .order('priority', { ascending: true })
    
    console.log('Raw rate rules count:', rawRateRules?.length)
    console.log('Raw rate rules:', rawRateRules?.map(r => ({ id: r.id, name: r.name, rate_id: r.rate_id })))
    
    // Check for rate rules without valid rate_ids
    const orphanedRules = rawRateRules?.filter(r => !r.rate_id)
    if (orphanedRules && orphanedRules.length > 0) {
      console.log('WARNING: Found rate rules without rate_id:', orphanedRules.map(r => ({ id: r.id, name: r.name })))
    }
    
    // Get rate rules first, then manually join with rates
    const { data: rateRules, error } = await supabaseAdmin
      .from('rate_rules')
      .select(`
        id,
        name,
        description,
        is_active,
        priority,
        conditions,
        rate_id,
        match_count,
        last_run,
        created_at,
        updated_at
      `)
      .not('rate_id', 'is', null)
      .order('priority', { ascending: true })

    if (error) {
      console.log('Error fetching rate rules:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get all rates for manual joining
    const { data: allRates, error: ratesError } = await supabaseAdmin
      .from('rates')
      .select(`
        id,
        name,
        description,
        rate_type,
        base_rate,
        currency,
        multiplier,
        tags,
        is_active
      `)

    if (ratesError) {
      console.log('Error fetching rates:', ratesError)
      return NextResponse.json({ error: ratesError.message }, { status: 500 })
    }

    // Manually join rate rules with rates
    const joinedRateRules = rateRules?.map(rule => {
      const rate = allRates?.find(r => r.id === rule.rate_id)
      return {
        ...rule,
        rates: rate || null
      }
    }) || []

    console.log('Rate rules count:', rateRules?.length)
    console.log('All rates count:', allRates?.length)
    console.log('Joined rate rules count:', joinedRateRules.length)
    console.log('Joined rate rules:', joinedRateRules.map(r => ({ 
      id: r.id, 
      name: r.name, 
      rate_id: r.rate_id,
      rate_name: r.rates?.name 
    })))

    // Final validation: ensure we only return rate rules that exist in the raw data
    const validRateRules = joinedRateRules.filter(rule => 
      rawRateRules?.some(rawRule => rawRule.id === rule.id)
    )

    console.log('Final validated rate rules count:', validRateRules.length)
    console.log('Final validated rate rules:', validRateRules.map(r => ({ 
      id: r.id, 
      name: r.name, 
      rate_id: r.rate_id,
      rate_name: r.rates?.name 
    })))

    return NextResponse.json({ data: validRateRules, error: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new rate rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.rate_id || typeof body.rate_id !== 'string') {
      return NextResponse.json(
        { error: 'Rate ID is required and must be a string' },
        { status: 400 }
      )
    }

    // Set default values
    const ruleData = {
      ...body,
      priority: body.priority || 1,
      is_active: body.is_active !== undefined ? body.is_active : true,
      conditions: body.conditions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: rateRule, error } = await supabaseAdmin
      .from('rate_rules')
      .insert(ruleData)
      .select(`
        *,
        rates (
          id,
          name,
          description,
          rate_type,
          base_rate,
          currency,
          multiplier,
          tags,
          is_active
        )
      `)
      .single()

    if (error) {
      console.error('Error creating rate rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rateRule, error: null })
  } catch (error) {
    console.error('Rate rule creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
