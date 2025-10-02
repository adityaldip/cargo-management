import { NextRequest, NextResponse } from 'next/server'
import { sectorRateOperations } from '@/lib/supabase-operations'

export async function GET() {
  try {
    const { data: sectorRates, error } = await sectorRateOperations.getAll()
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    // Transform database field names to frontend field names
    const transformedSectorRates = sectorRates?.map((sectorRate: any) => ({
      id: sectorRate.id,
      origin: sectorRate.origin,
      destination: sectorRate.destination,
      origin_airport_id: sectorRate.origin_airport_id,
      destination_airport_id: sectorRate.destination_airport_id,
      sector_rate: sectorRate.sector_rate,
      flight_num_preview: sectorRate.flight_num_preview,
      is_active: sectorRate.is_active,
      created_at: sectorRate.created_at,
      updated_at: sectorRate.updated_at
    })) || []
    
    return NextResponse.json({ data: transformedSectorRates })
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
    const { data: sectorRate, error } = await sectorRateOperations.create({
      origin: body.origin,
      destination: body.destination,
      origin_airport_id: body.origin_airport_id,
      destination_airport_id: body.destination_airport_id,
      sector_rate: body.sector_rate,
      flight_num_preview: body.flight_num_preview,
      is_active: body.is_active !== undefined ? body.is_active : true
    })
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    // Transform database field names to frontend field names
    const transformedSectorRate = {
      id: (sectorRate as any).id,
      origin: (sectorRate as any).origin,
      destination: (sectorRate as any).destination,
      origin_airport_id: (sectorRate as any).origin_airport_id,
      destination_airport_id: (sectorRate as any).destination_airport_id,
      sector_rate: (sectorRate as any).sector_rate,
      flight_num_preview: (sectorRate as any).flight_num_preview,
      is_active: (sectorRate as any).is_active,
      created_at: (sectorRate as any).created_at,
      updated_at: (sectorRate as any).updated_at
    }
    
    return NextResponse.json({ data: transformedSectorRate }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
