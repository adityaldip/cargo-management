import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PUT /api/customers/[id]/codes/bulk - Bulk update customer codes
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const customerId = params.id
    const body = await request.json()
    const { codes } = body

    if (!codes || !Array.isArray(codes)) {
      return NextResponse.json(
        { error: 'Codes array is required' },
        { status: 400 }
      )
    }

    // First, delete all existing codes for this customer
    const { error: deleteError } = await supabase
      .from('customer_codes')
      .delete()
      .eq('customer_id', customerId)

    if (deleteError) {
      console.error('Error deleting existing codes:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete existing codes' },
        { status: 500 }
      )
    }

    // Then, insert new codes
    const codesToInsert = codes.map((code: any) => ({
      customer_id: customerId,
      code: code.code.trim().toUpperCase(),
      accounting_label: code.accounting_label?.trim() || null,
      is_active: true
    }))

    const { data: newCodes, error: insertError } = await supabase
      .from('customer_codes')
      .insert(codesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting new codes:', insertError)
      return NextResponse.json(
        { error: 'Failed to create customer codes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: newCodes })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
