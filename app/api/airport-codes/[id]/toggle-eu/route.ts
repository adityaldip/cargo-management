import { NextRequest, NextResponse } from 'next/server'
import { airportCodeOperations } from '@/lib/supabase-operations'

// PATCH /api/airport-codes/[id]/toggle-eu - Toggle airport code EU status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_eu } = body
    
    if (typeof is_eu !== 'boolean') {
      return NextResponse.json({ error: 'is_eu must be a boolean' }, { status: 400 })
    }
    
    const { data: airportCode, error } = await airportCodeOperations.toggleEU(params.id, is_eu)
    
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
