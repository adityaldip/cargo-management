import { NextRequest, NextResponse } from 'next/server'
import { customerRulesOperations } from '@/lib/supabase-operations'

// PATCH /api/rules/priorities - Update multiple rule priorities (for drag & drop)
export async function PATCH(request: NextRequest) {
  try {
    const { rules } = await request.json()
    
    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Rules must be an array' },
        { status: 400 }
      )
    }

    // Two-phase update to avoid unique constraint violations
    // Phase 1: Set temporary negative priorities
    const tempUpdatePromises = rules.map((rule, index) => 
      customerRulesOperations.updatePriority(rule.id, -(index + 1000))
    )
    
    const tempResults = await Promise.all(tempUpdatePromises)
    const hasTempErrors = tempResults.some(result => result.error)
    
    if (hasTempErrors) {
      return NextResponse.json(
        { error: 'Failed to update rule priorities (temp phase)' },
        { status: 500 }
      )
    }

    // Phase 2: Set final priorities
    const finalUpdatePromises = rules.map(rule => 
      customerRulesOperations.updatePriority(rule.id, rule.priority)
    )
    
    const finalResults = await Promise.all(finalUpdatePromises)
    const hasFinalErrors = finalResults.some(result => result.error)
    
    if (hasFinalErrors) {
      return NextResponse.json(
        { error: 'Failed to update rule priorities (final phase)' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
