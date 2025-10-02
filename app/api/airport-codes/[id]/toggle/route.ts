import { NextRequest, NextResponse } from 'next/server'
import { airportCodeOperations } from '@/lib/supabase-operations'

// PATCH /api/airport-codes/[id]/toggle - Toggle airport code active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_active } = body
    
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
    }
    
    const { data: airportCode, error } = await airportCodeOperations.toggleActive(params.id, is_active)
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    return NextResponse.json({ data: airportCode })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
