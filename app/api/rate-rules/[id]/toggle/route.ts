import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// PATCH - Toggle rate rule active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { is_active } = await request.json()

    // Validate ID parameter
    if (!params.id) {
      return NextResponse.json(
        { error: 'Rate rule ID is required' },
        { status: 400 }
      )
    }

    // Validate is_active parameter
    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean value' },
        { status: 400 }
      )
    }

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('rate_rules')
      .select('id, is_active')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rate rule not found' },
        { status: 404 }
      )
    }

    const { data: rateRule, error } = await supabaseAdmin
      .from('rate_rules')
      .update({ 
        is_active, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling rate rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: rateRule, error: null })
  } catch (error) {
    console.error('Rate rule toggle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
