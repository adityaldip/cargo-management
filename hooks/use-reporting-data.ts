import { useState, useEffect } from 'react'
import type { ReportData, ReportingFilters, ReportingSummary, ReportingResponse } from '@/types/reporting'

export function useReportingData(filters: ReportingFilters) {
  const [data, setData] = useState<ReportData[]>([])
  const [summary, setSummary] = useState<ReportingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportingData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build query parameters
        const params = new URLSearchParams()
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
        if (filters.dateTo) params.append('dateTo', filters.dateTo)
        if (filters.viewBy) params.append('viewBy', filters.viewBy)
        if (filters.viewPeriod) params.append('viewPeriod', filters.viewPeriod)

        const url = `/api/reporting?${params.toString()}`
        console.log('Fetching reporting data from:', url)

        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reporting data: ${response.statusText}`)
        }

        const result: ReportingResponse = await response.json()
        console.log('Reporting data received:', { 
          dataCount: result.data?.length || 0, 
          summary: result.summary,
          sampleData: result.data?.[0] ? {
            rowLabel: result.data[0].rowLabel,
            total: result.data[0].total,
            revenue: result.data[0].revenue,
            weekKeys: Object.keys(result.data[0]).filter(key => key.startsWith('week')),
            sampleWeeks: {
              week1: result.data[0].week1,
              week2: result.data[0].week2,
              week3: result.data[0].week3,
              week4: result.data[0].week4
            }
          } : null
        })
        
        setData(result.data)
        setSummary(result.summary)
      } catch (err) {
        console.error('Error fetching reporting data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch reporting data')
        setData([])
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReportingData()
  }, [filters.dateFrom, filters.dateTo, filters.viewBy, filters.viewPeriod])

  return {
    data,
    summary,
    loading,
    error,
    refetch: () => {
      // Trigger a refetch by updating a dependency
      setLoading(true)
    }
  }
}
