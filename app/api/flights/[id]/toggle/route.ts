import { NextRequest, NextResponse } from 'next/server'
import { flightOperations } from '@/lib/supabase-operations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { data: flight, error } = await flightOperations.toggleActive(params.id, body.is_active)
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    // Transform database field names to frontend field names
    const transformedFlight = {
      id: (flight as any).id,
      flightNumber: (flight as any).flight_number,
      origin: (flight as any).origin,
      destination: (flight as any).destination,
      originAirportId: (flight as any).origin_airport_id,
      destinationAirportId: (flight as any).destination_airport_id,
      status: (flight as any).status,
      is_active: (flight as any).is_active,
      created_at: (flight as any).created_at,
      updated_at: (flight as any).updated_at
    }
    
    return NextResponse.json({ data: transformedFlight })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
