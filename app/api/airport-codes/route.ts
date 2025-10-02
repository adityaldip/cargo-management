import { NextResponse } from 'next/server'
import { airportCodeOperations } from '@/lib/supabase-operations'

export async function GET() {
  try {
    const { data: airportCodes, error } = await airportCodeOperations.getAll()
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    // Transform database field names to frontend field names
    const transformedAirportCodes = airportCodes?.map((airport: any) => ({
      id: airport.id,
      code: airport.code,
      is_active: airport.is_active,
      is_eu: airport.is_eu,
      created_at: airport.created_at,
      updated_at: airport.updated_at
    })) || []
    
    return NextResponse.json({ data: transformedAirportCodes })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, is_eu } = body
    
    if (!code || typeof is_eu !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: code and is_eu' },
        { status: 400 }
      )
    }
    
    const { data: airportCode, error } = await airportCodeOperations.create({
      code: code.trim().toUpperCase(),
      is_eu: is_eu
    })
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: airportCode 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}