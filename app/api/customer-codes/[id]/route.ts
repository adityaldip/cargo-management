import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PUT /api/customer-codes/[id] - Update a customer code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const codeId = params.id
    const body = await request.json()
    const { code, accounting_label } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const { data: updatedCode, error } = await supabase
      .from('customer_codes')
      .update({
        code: code.trim().toUpperCase(),
        accounting_label: accounting_label?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', codeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer code:', error)
      return NextResponse.json(
        { error: 'Failed to update customer code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedCode })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/customer-codes/[id]/toggle - Toggle customer code active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const codeId = params.id
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    const { data: updatedCode, error } = await supabase
      .from('customer_codes')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', codeId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling customer code:', error)
      return NextResponse.json(
        { error: 'Failed to toggle customer code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedCode })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/customer-codes/[id] - Delete a customer code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const codeId = params.id

    const { error } = await supabase
      .from('customer_codes')
      .delete()
      .eq('id', codeId)

    if (error) {
      console.error('Error deleting customer code:', error)
      return NextResponse.json(
        { error: 'Failed to delete customer code' },
        { status: 500 }
      )
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
