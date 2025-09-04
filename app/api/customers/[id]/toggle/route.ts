import { NextRequest, NextResponse } from 'next/server'
import { customerOperations } from '@/lib/supabase-operations'

// PATCH /api/customers/[id]/toggle - Toggle customer active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isActive } = await request.json()
    const { data: customer, error } = await customerOperations.toggleActive(params.id, isActive)
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
