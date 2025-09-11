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
    
    // Build query to get cargo data grouped by customer for invoice generation
    let query = supabaseAdmin
      .from('cargo_data')
      .select(`
        id,
        rec_id,
        assigned_customer,
        assigned_rate,
        rate_value,
        rate_currency,
        total_kg,
        created_at,
        orig_oe,
        dest_oe,
        mail_cat,
        mail_class,
        invoice,
        customer_name_number,
        rates (
          id,
          name,
          description,
          rate_type,
          base_rate,
          currency,
          multiplier
        )
      `)
      .not('assigned_customer', 'is', null)
      .not('rate_id', 'is', null)
    
    // Apply filters
    if (customer) {
      query = query.eq('assigned_customer', customer)
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }
    
    // Order by customer and date
    query = query.order('assigned_customer').order('created_at', { ascending: false })
    
    const { data: cargoData, error } = await query
    
    if (error) {
      console.error('Error fetching cargo data for invoices:', error)
      return NextResponse.json(
        { error: `Failed to fetch cargo data for invoices: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Fetched cargo data:', cargoData?.length || 0, 'records')
    
    // If no cargo data, return empty result
    if (!cargoData || cargoData.length === 0) {
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
    
    // Fetch customer data to resolve customer names
    const customerIds = [...new Set(cargoData.map((record: any) => record.assigned_customer).filter(Boolean))]
    let customersData: any[] = []
    
    if (customerIds.length > 0) {
      try {
        const { data: customers, error: customersError } = await supabaseAdmin
          .from('customers')
          .select('id, name, code')
          .in('id', customerIds)
        
        if (customersError) {
          console.error('Error fetching customers:', customersError)
        } else {
          customersData = customers || []
          console.log('✅ Found customers:', customersData.length)
        }
      } catch (error) {
        console.error('Error in customer fetch operation:', error)
      }
    }
    
    // Group cargo data by customer and generate invoice summaries
    const invoiceData = cargoData.reduce((acc: Record<string, any>, record: any) => {
      const customer = record.assigned_customer
      if (!customer) return acc
      
      // Find customer name
      const customerInfo = customersData.find((c: any) => c.id === customer)
      const customerName = customerInfo?.name || record.customer_name_number || customer
      
      if (!acc[customer]) {
        acc[customer] = {
          customer,
          customerName,
          totalAmount: 0,
          totalWeight: 0,
          totalItems: 0,
          routes: new Set(),
          items: [],
          latestDate: record.created_at,
          currency: record.rate_currency || 'EUR'
        }
      }
      
      // Calculate rate per kg and total amount
      let ratePerKg = 0
      let totalAmount = 0
      
      if (record.rates) {
        const rate = record.rates
        if (rate.rate_type === 'per_kg') {
          ratePerKg = rate.base_rate || 0
          totalAmount = (record.total_kg || 0) * ratePerKg
        } else if (rate.rate_type === 'fixed') {
          ratePerKg = (rate.base_rate || 0) / (record.total_kg || 1) // Convert fixed rate to per kg
          totalAmount = rate.base_rate || 0
        } else if (rate.rate_type === 'multiplier') {
          ratePerKg = (rate.base_rate || 0) * (rate.multiplier || 1)
          totalAmount = (record.total_kg || 0) * ratePerKg
        }
      } else if (record.rate_value && record.rate_value > 0) {
        // Use existing rate_value as total amount, calculate rate per kg
        totalAmount = record.rate_value
        ratePerKg = (record.total_kg || 0) > 0 ? totalAmount / (record.total_kg || 0) : 0
      } else {
        // Fallback: assume per_kg rate with default base rate based on currency
        const defaultRate = record.rate_currency === 'USD' ? 2.5 : 2.5 // Default rate per kg
        ratePerKg = defaultRate
        totalAmount = (record.total_kg || 0) * ratePerKg
      }
      
      // Round to 2 decimal places
      ratePerKg = Math.round(ratePerKg * 100) / 100
      totalAmount = Math.round(totalAmount * 100) / 100
      
      acc[customer].totalAmount += totalAmount
      acc[customer].totalWeight += record.total_kg || 0
      acc[customer].totalItems += 1
      acc[customer].routes.add(`${record.orig_oe} → ${record.dest_oe}`)
      
      // Add detailed item information
      acc[customer].items.push({
        id: record.id,
        recId: record.rec_id,
        route: `${record.orig_oe} → ${record.dest_oe}`,
        mailCat: record.mail_cat,
        mailClass: record.mail_class,
        weight: record.total_kg,
        rate: ratePerKg,
        amount: totalAmount,
        date: record.created_at,
        invoice: record.invoice,
        origOE: record.orig_oe,
        destOE: record.dest_oe,
        rateInfo: record.rates
      })
      
      // Update latest date
      if (new Date(record.created_at) > new Date(acc[customer].latestDate)) {
        acc[customer].latestDate = record.created_at
      }
      
      return acc
    }, {} as Record<string, any>)
    
    // Convert to array and format for invoice display
    const invoices = Object.values(invoiceData).map((invoice: any, index) => {
      // Verify that the total amount matches the sum of individual items
      const calculatedTotal = invoice.items.reduce((sum: number, item: any) => sum + item.amount, 0)
      const finalAmount = Math.abs(invoice.totalAmount - calculatedTotal) < 0.01 ? invoice.totalAmount : calculatedTotal
      
      return {
        id: `invoice-${index + 1}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        customer: invoice.customerName || invoice.customer, // Use customerName if available
        date: invoice.latestDate,
        dueDate: new Date(new Date(invoice.latestDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: finalAmount,
        status: 'draft' as const,
        items: invoice.totalItems,
        totalWeight: invoice.totalWeight,
        route: Array.from(invoice.routes).join(', '),
        currency: invoice.currency,
        itemsDetails: invoice.items
      }
    })
    
    // Apply pagination to invoices
    const totalPages = Math.ceil(invoices.length / limit)
    const paginatedInvoices = invoices.slice(offset, offset + limit)
    
    return NextResponse.json({
      data: paginatedInvoices,
      pagination: {
        page,
        limit,
        total: invoices.length,
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
