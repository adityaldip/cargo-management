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

    // Two-phase update strategy to avoid unique constraint violations
    // Phase 1: Set temporary negative priorities
    const tempUpdates = ruleUpdates.map((update, index) => ({
      id: update.id,
      priority: -(index + 1000) // Use negative numbers to avoid conflicts
    }))

    for (const update of tempUpdates) {
      const { error } = await supabaseAdmin
        .from('rate_rules')
        .update({ 
          priority: update.priority,
          updated_at: new Date().toISOString() 
        })
        .eq('id', update.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Phase 2: Set final priorities
    for (const update of ruleUpdates) {
      const { error } = await supabaseAdmin
        .from('rate_rules')
        .update({ 
          priority: update.priority,
          updated_at: new Date().toISOString() 
        })
        .eq('id', update.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Fetch updated rules
    const { data: updatedRules, error: fetchError } = await supabaseAdmin
      .from('rate_rules')
      .select('*')
      .order('priority', { ascending: true })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedRules, error: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
