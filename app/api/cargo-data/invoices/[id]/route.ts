import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }
    
    // Get invoice summary from the view
    const { data: invoiceSummary, error: summaryError } = await supabaseAdmin
      .from('invoice_summary_view')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single()
    
    if (summaryError) {
      console.error('Error fetching invoice summary:', summaryError)
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    // Get detailed items for this invoice using the same invoice_id
    const { data: invoiceDetails, error: detailsError } = await supabaseAdmin
      .from('invoice_detail_view')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })
    
    if (detailsError) {
      console.error('Error fetching invoice details:', detailsError)
      return NextResponse.json(
        { error: 'Failed to fetch invoice details' },
        { status: 500 }
      )
    }
    
    // Format the complete invoice data
    const invoice = {
      id: invoiceSummary.invoice_id || `invoice-${Date.now()}`,
      invoiceNumber: invoiceSummary.invoice_number,
      customer: invoiceSummary.customer_name,
      date: invoiceSummary.invoice_date,
      dueDate: new Date(new Date(invoiceSummary.invoice_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: invoiceSummary.total_amount,
      status: invoiceSummary.status as 'draft' | 'pending' | 'paid' | 'overdue',
      items: invoiceSummary.total_items,
      totalWeight: invoiceSummary.total_weight,
      route: `${invoiceSummary.unique_routes} routes`,
      currency: invoiceSummary.currency,
      itemsDetails: (invoiceDetails || []).map((item: any, index: number) => ({
        id: item.id || `item-${index}-${Date.now()}`,
        recId: item.recId,
        route: item.route,
        mailCat: item.mailCat,
        mailClass: item.mailClass,
        weight: item.weight,
        rate: item.rate,
        amount: item.amount,
        date: item.date,
        invoice: item.invoice,
        origOE: item.origOE,
        destOE: item.destOE,
        rateInfo: {
          id: item.rate_id,
          name: item.rate_name,
          description: item.rate_description,
          rate_type: item.rate_type,
          base_rate: item.base_rate,
          currency: item.rate_currency
        }
      }))
    }
    
    return NextResponse.json({ invoice })
    
  } catch (error) {
    console.error('Error in invoice detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
