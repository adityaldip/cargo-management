import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/customers/[id]/codes - Get all codes for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const customerId = params.id

    const { data: codes, error } = await supabase
      .from('customer_codes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching customer codes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer codes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: codes })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/customers/[id]/codes - Create a new customer code
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const customerId = params.id
    const body = await request.json()
    const { code, accounting_label } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const { data: newCode, error } = await supabase
      .from('customer_codes')
      .insert({
        customer_id: customerId,
        code: code.trim().toUpperCase(),
        accounting_label: accounting_label?.trim() || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer code:', error)
      return NextResponse.json(
        { error: 'Failed to create customer code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newCode })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
