import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Two-phase update to avoid unique constraint violations
    // Phase 1: Set temporary negative priorities
    const tempUpdatePromises = ruleUpdates.map((rule, index) => 
      supabaseAdmin
        .from('rate_rules')
        .update({ priority: -(index + 1000) })
        .eq('id', rule.id)
    )
    
    const tempResults = await Promise.all(tempUpdatePromises)
    const hasTempErrors = tempResults.some(result => result.error)
    
    if (hasTempErrors) {
      console.error('Failed to update rate rule priorities (temp phase):', tempResults)
      return NextResponse.json(
        { error: 'Failed to update rate rule priorities (temp phase)' },
        { status: 500 }
      )
    }

    // Phase 2: Set final priorities
    const finalUpdatePromises = ruleUpdates.map(rule => 
      supabaseAdmin
        .from('rate_rules')
        .update({ priority: rule.priority })
        .eq('id', rule.id)
    )
    
    const finalResults = await Promise.all(finalUpdatePromises)
    const hasFinalErrors = finalResults.some(result => result.error)
    
    if (hasFinalErrors) {
      console.error('Failed to update rate rule priorities (final phase):', finalResults)
      return NextResponse.json(
        { error: 'Failed to update rate rule priorities (final phase)' },
        { status: 500 }
      )
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
