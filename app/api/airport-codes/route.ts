import { NextRequest, NextResponse } from 'next/server'
import { airportCodeOperations } from '@/lib/supabase-operations'

// GET /api/airport-codes - Get all airport codes
export async function GET() {
  try {
    const { data: airportCodes, error } = await airportCodeOperations.getAll()
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    return NextResponse.json({ data: airportCodes })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/airport-codes - Create new airport code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data: airportCode, error } = await airportCodeOperations.create(body)
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    return NextResponse.json({ data: airportCode }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
