import { NextRequest, NextResponse } from 'next/server'
import { airportCodeOperations } from '@/lib/supabase-operations'

// GET /api/airport-codes/[id] - Get airport code by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: airportCode, error } = await airportCodeOperations.getById(params.id)
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    if (!airportCode) {
      return NextResponse.json({ error: 'Airport code not found' }, { status: 404 })
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

// PUT /api/airport-codes/[id] - Update airport code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { data: airportCode, error } = await airportCodeOperations.update(params.id, body)
    
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

// DELETE /api/airport-codes/[id] - Delete airport code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await airportCodeOperations.delete(params.id)
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
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
