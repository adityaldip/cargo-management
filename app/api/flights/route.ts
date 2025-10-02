import { NextRequest, NextResponse } from 'next/server'
import { flightOperations } from '@/lib/supabase-operations'

export async function GET() {
  try {
    const { data: flights, error } = await flightOperations.getAll()
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    // Transform database field names to frontend field names
    const transformedFlights = flights?.map((flight: any) => ({
      id: flight.id,
      flightNumber: flight.flight_number,
      origin: flight.origin,
      destination: flight.destination,
      originAirportId: flight.origin_airport_id,
      destinationAirportId: flight.destination_airport_id,
      status: flight.status,
      is_active: flight.is_active,
      created_at: flight.created_at,
      updated_at: flight.updated_at
    })) || []
    
    return NextResponse.json({ data: transformedFlights })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data: flight, error } = await flightOperations.create({
      flight_number: body.flight_number,
      origin: body.origin,
      destination: body.destination,
      origin_airport_id: body.originAirportId,
      destination_airport_id: body.destinationAirportId,
      status: body.status || 'scheduled',
      is_active: body.is_active !== undefined ? body.is_active : true
    })
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
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
    
    return NextResponse.json({ data: transformedFlight }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
