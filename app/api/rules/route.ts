import { NextRequest, NextResponse } from 'next/server'
import { customerRulesOperations } from '@/lib/supabase-operations'

// GET /api/rules - Get all customer rules
export async function GET() {
  try {
    const { data: rules, error } = await customerRulesOperations.getAll()
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }
    
    return NextResponse.json({ data: rules })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/rules - Create new rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data: rule, error } = await customerRulesOperations.create(body)
    
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    
    return NextResponse.json({ data: rule }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
