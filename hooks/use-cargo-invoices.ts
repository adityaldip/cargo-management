import { useState, useEffect } from 'react'
import type { CargoInvoice } from '@/types/cargo-data'

interface UseCargoInvoicesOptions {
  page?: number
  limit?: number
  customer?: string
  dateFrom?: string
  dateTo?: string
}

interface CargoInvoicesResponse {
  data: CargoInvoice[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useCargoInvoices(options: UseCargoInvoicesOptions = {}) {
  const [invoices, setInvoices] = useState<CargoInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.customer) params.append('customer', options.customer)
      if (options.dateFrom) params.append('dateFrom', options.dateFrom)
      if (options.dateTo) params.append('dateTo', options.dateTo)

      const response = await fetch(`/api/cargo-data/invoices?${params.toString()}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`Failed to fetch invoices: ${response.status} ${errorText}`)
      }

      const result: CargoInvoicesResponse = await response.json()
      setInvoices(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching cargo invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [options.page, options.limit, options.customer, options.dateFrom, options.dateTo])

  return {
    invoices,
    loading,
    error,
    pagination,
    refetch: fetchInvoices
  }
}
