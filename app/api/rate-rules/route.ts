import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all rate rules with rate information
export async function GET() {
  try {    
    // First, let's check what's in the rate_rules table
    const { data: rawRateRules, error: rawError } = await supabaseAdmin
      .from('rate_rules')
      .select('*')
      .order('priority', { ascending: true })
       
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
      return NextResponse.json({ error: ratesError.message }, { status: 500 })
    }

    // Manually join rate rules with rates
    const joinedRateRules = rateRules?.map((rule: any) => {
      const rate = allRates?.find((r: any) => r.id === rule.rate_id)
      return {
        ...rule,
        rates: rate || null
      }
    }) || []


    // Final validation: ensure we only return rate rules that exist in the raw data
    const validRateRules = joinedRateRules.filter((rule: any) => 
      rawRateRules?.some((rawRule: any) => rawRule.id === rule.id)
    )

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
