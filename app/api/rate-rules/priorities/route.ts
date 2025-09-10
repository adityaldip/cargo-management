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

// PATCH - Update multiple rate rule priorities
export async function PATCH(request: NextRequest) {
  try {
    const { ruleUpdates } = await request.json()

    // Validate input
    if (!Array.isArray(ruleUpdates)) {
      return NextResponse.json(
        { error: 'Invalid input: ruleUpdates must be an array' },
        { status: 400 }
      )
    }

    if (ruleUpdates.length === 0) {
      return NextResponse.json(
        { error: 'No rule updates provided' },
        { status: 400 }
      )
    }

    // Validate each update has required fields
    for (const update of ruleUpdates) {
      if (!update.id || typeof update.priority !== 'number') {
        return NextResponse.json(
          { error: 'Each rule update must have id and priority fields' },
          { status: 400 }
        )
      }
    }

    // Use Supabase RPC for atomic transaction
    const { data, error } = await supabaseAdmin.rpc('update_rate_rule_priorities', {
      rule_updates: ruleUpdates.map(update => ({
        id: update.id,
        priority: update.priority
      }))
    })

    if (error) {
      console.error('Database transaction error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch updated rules to return
    const { data: updatedRules, error: fetchError } = await supabaseAdmin
      .from('rate_rules')
      .select('*')
      .order('priority', { ascending: true })

    if (fetchError) {
      console.error('Error fetching updated rules:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedRules, error: null })
  } catch (error) {
    console.error('Rate rule priorities update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
