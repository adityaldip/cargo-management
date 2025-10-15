import { NextRequest, NextResponse } from 'next/server'
import { sectorRateOperations } from '@/lib/supabase-operations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: sectorRate, error } = await sectorRateOperations.getById(params.id)
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    if (!sectorRate) {
      return NextResponse.json({ error: 'Sector rate not found' }, { status: 404 })
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
      customer: (sectorRate as any).customer,
      origin_oe: (sectorRate as any).origin_oe,
      destination_oe: (sectorRate as any).destination_oe,
      is_active: (sectorRate as any).is_active,
      created_at: (sectorRate as any).created_at,
      updated_at: (sectorRate as any).updated_at
    }
    
    return NextResponse.json({ data: transformedSectorRate })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { data: sectorRate, error } = await sectorRateOperations.update(params.id, {
      origin: body.origin,
      destination: body.destination,
      origin_airport_id: body.origin_airport_id,
      destination_airport_id: body.destination_airport_id,
      sector_rate: body.sector_rate,
      flight_num_preview: body.flight_num_preview,
      customer: body.customer,
      origin_oe: body.origin_oe,
      destination_oe: body.destination_oe,
      is_active: body.is_active
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
      customer: (sectorRate as any).customer,
      origin_oe: (sectorRate as any).origin_oe,
      destination_oe: (sectorRate as any).destination_oe,
      is_active: (sectorRate as any).is_active,
      created_at: (sectorRate as any).created_at,
      updated_at: (sectorRate as any).updated_at
    }
    
    return NextResponse.json({ data: transformedSectorRate })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await sectorRateOperations.delete(params.id)
    
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
