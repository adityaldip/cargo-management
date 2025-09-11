import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const customer = searchParams.get('customer')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Use the optimized invoice_summary_view for much faster performance
    let query = supabaseAdmin
      .from('invoice_summary_view')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (customer) {
      query = query.ilike('customer_name', `%${customer}%`)
    }
    
    if (dateFrom) {
      query = query.gte('invoice_date', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('invoice_date', dateTo)
    }
    
    // Order by invoice date (most recent first)
    query = query.order('invoice_date', { ascending: false })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: invoiceSummaries, error, count } = await query
    
    if (error) {
      console.error('Error fetching invoice summaries:', error)
      return NextResponse.json(
        { error: `Failed to fetch invoice summaries: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Fetched invoice summaries:', invoiceSummaries?.length || 0, 'records')
    
    // If no invoice summaries, return empty result
    if (!invoiceSummaries || invoiceSummaries.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }
    
    // Get detailed items for each invoice using the detail view
    const invoiceIds = invoiceSummaries.map((summary: any) => summary.invoice_id)
    
    const { data: invoiceDetails, error: detailsError } = await supabaseAdmin
      .from('invoice_detail_view')
      .select('*')
      .in('invoice_id', invoiceIds)
    
    if (detailsError) {
      console.error('Error fetching invoice details:', detailsError)
      // Continue without details - we'll have summary data
    }
    
    // Group details by invoice_id
    const detailsByInvoice = (invoiceDetails || []).reduce((acc: Record<string, any[]>, detail: any) => {
      if (!acc[detail.invoice_id]) {
        acc[detail.invoice_id] = []
      }
      acc[detail.invoice_id].push(detail)
      return acc
    }, {})
    
    // Format invoices for the frontend
    const invoices = invoiceSummaries.map((summary: any, index: number) => {
      const itemsDetails = detailsByInvoice[summary.invoice_id] || []
      
      return {
        id: summary.invoice_id || `invoice-${index}-${Date.now()}`,
        invoiceNumber: summary.invoice_number,
        customer: summary.customer_name,
        date: summary.invoice_date,
        dueDate: new Date(new Date(summary.invoice_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: summary.total_amount,
        status: summary.status as 'draft' | 'pending' | 'paid' | 'overdue',
        items: summary.total_items,
        totalWeight: summary.total_weight,
        route: `${summary.unique_routes} routes`,
        currency: summary.currency,
        itemsDetails: itemsDetails.map((item: any, itemIndex: number) => ({
          id: item.id || `item-${index}-${itemIndex}-${Date.now()}`,
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
    })
    
    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })
    
  } catch (error) {
    console.error('Error in cargo-data invoices API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
