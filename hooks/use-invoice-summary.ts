import { useState, useEffect } from 'react'

interface InvoiceSummary {
  invoice_id: string
  invoice_number: string
  customer_name: string
  invoice_date: string
  due_date: string
  status: string
  currency: string
  total_items: number
  total_weight: number
  total_amount: number
  first_item_date: string
  last_item_date: string
  unique_routes: number
  unique_mail_categories: number
  average_rate: number
  min_rate: number
  max_rate: number
  processing_status: 'processed' | 'pending' | 'partial'
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UseInvoiceSummaryOptions {
  page?: number
  limit?: number
  customer?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface UseInvoiceSummaryReturn {
  invoices: InvoiceSummary[]
  pagination: Pagination
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useInvoiceSummary(options: UseInvoiceSummaryOptions = {}): UseInvoiceSummaryReturn {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: (options.limit || 10).toString(),
        sortBy: options.sortBy || 'invoice_date',
        sortOrder: options.sortOrder || 'desc'
      })

      if (options.customer) {
        params.append('customer', options.customer)
      }

      if (options.status) {
        params.append('status', options.status)
      }

      const response = await fetch(`/api/invoices/summary?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice summary')
      }

      const data = await response.json()
      
      setInvoices(data.invoices)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching invoice summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [options.page, options.limit, options.customer, options.status, options.sortBy, options.sortOrder])

  const refetch = () => {
    fetchInvoices()
  }

  return {
    invoices,
    pagination,
    loading,
    error,
    refetch
  }
}

// Hook for getting single invoice summary
export function useInvoiceSummaryById(invoiceId: string | null) {
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoice = async () => {
    if (!invoiceId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/invoices/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoice summary')
      }

      const data = await response.json()
      setInvoice(data.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching invoice summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice
  }
}
