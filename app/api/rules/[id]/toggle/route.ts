import { NextRequest, NextResponse } from 'next/server'
import { customerRulesOperations } from '@/lib/supabase-operations'

// PATCH /api/rules/[id]/toggle - Toggle rule active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isActive } = await request.json()
    const { data: rule, error } = await customerRulesOperations.toggleActive(params.id, isActive)
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    return NextResponse.json({ data: rule })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
