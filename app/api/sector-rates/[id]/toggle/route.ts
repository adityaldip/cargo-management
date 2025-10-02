import { NextRequest, NextResponse } from 'next/server'
import { sectorRateOperations } from '@/lib/supabase-operations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_active } = body
    
    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean value' },
        { status: 400 }
      )
    }
    
    const { data: sectorRate, error } = await sectorRateOperations.toggleActive(params.id, is_active)
    
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
    
    return NextResponse.json({ data: transformedSectorRate })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
