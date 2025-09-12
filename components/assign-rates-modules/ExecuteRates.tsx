"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Download, Filter, Loader2, RefreshCw } from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { useRateRulesData } from "./hooks"
import { FilterPopup, FilterCondition, FilterField } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"
import { supabase } from "@/lib/supabase"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { downloadFile } from "@/lib/export-utils"

export function ExecuteRates() {
  // Data fetching state
  const [cargoData, setCargoData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Pagination state - like database-preview.tsx
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(50)
  
  // Server-side pagination state
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  
  // Filter application state
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  
  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportCurrentBatch, setExportCurrentBatch] = useState(0)
  const [exportTotalBatches, setExportTotalBatches] = useState(0)
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("execute-rates")
  
  // Toast for notifications
  const { toast } = useToast()
  
  // Define filter fields based on actual cargo_data columns
  const filterFields: FilterField[] = [
    { key: 'inb_flight_date', label: 'Inb. Flight Date', type: 'date' },
    { key: 'outb_flight_date', label: 'Outb. Flight Date', type: 'date' },
    { key: 'rec_id', label: 'Rec. ID', type: 'text' },
    { key: 'des_no', label: 'Des. No.', type: 'text' },
    { key: 'rec_numb', label: 'Rec. Number', type: 'text' },
    { key: 'orig_oe', label: 'Orig. OE', type: 'text' },
    { key: 'dest_oe', label: 'Dest. OE', type: 'text' },
    { key: 'inb_flight_no', label: 'Inb. Flight No.', type: 'text' },
    { key: 'outb_flight_no', label: 'Outb. Flight No.', type: 'text' },
    { key: 'mail_cat', label: 'Mail Category', type: 'text' },
    { key: 'mail_class', label: 'Mail Class', type: 'text' },
    { key: 'total_kg', label: 'Total Weight (kg)', type: 'number' },
    { key: 'invoice', label: 'Invoice', type: 'text' },
    { key: 'customer_name_number', label: 'Contractee Name', type: 'text' },
    { key: 'assigned_customer', label: 'Contractee ID', type: 'text' },
    { key: 'rate_name', label: 'Rate Name', type: 'text' },
    { key: 'rate_value', label: 'Rate Value', type: 'number' },
    { key: 'rate_currency', label: 'Rate Currency', type: 'text' }
  ]


  // Fetch cargo data from Supabase - only assigned rates with server-side pagination
  const fetchCargoData = async (page: number = currentPage, limit: number = recordsPerPage, isRefresh = false, customFilters?: FilterCondition[], customLogic?: "AND" | "OR") => {
    try {
      console.log(`🔄 fetchCargoData called: page=${page}, limit=${limit}, isRefresh=${isRefresh}`)
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Use custom filters if provided, otherwise use current state
      const activeFilters = customFilters || filterConditions
      const activeLogic = customLogic || filterLogic
      const hasFilters = customFilters ? customFilters.length > 0 : hasActiveFilters
      
      console.log('🔍 Using filters:', activeFilters, 'logic:', activeLogic)

      // Build base query for assigned rates
      let countQuery = supabase
        .from('cargo_data')
        .select('*', { count: 'exact', head: true })
        .not('rate_id', 'is', null)

      let dataQuery = supabase
        .from('cargo_data')
        .select('*')
        .not('rate_id', 'is', null)

      // Apply filters if any
      if (hasFilters && activeFilters.length > 0) {
        console.log('🔍 Applying filters:', activeFilters)
        
        activeFilters.forEach((condition, index) => {
          const { field, operator, value } = condition
          
          if (value && value.trim() !== '') {
            switch (operator) {
              case 'equals':
                countQuery = countQuery.eq(field, value)
                dataQuery = dataQuery.eq(field, value)
                break
              case 'contains':
                countQuery = countQuery.ilike(field, `%${value}%`)
                dataQuery = dataQuery.ilike(field, `%${value}%`)
                break
              case 'starts_with':
                countQuery = countQuery.ilike(field, `${value}%`)
                dataQuery = dataQuery.ilike(field, `${value}%`)
                break
              case 'ends_with':
                countQuery = countQuery.ilike(field, `%${value}`)
                dataQuery = dataQuery.ilike(field, `%${value}`)
                break
              case 'greater_than':
                const numValue = parseFloat(value)
                if (!isNaN(numValue)) {
                  countQuery = countQuery.gt(field, numValue)
                  dataQuery = dataQuery.gt(field, numValue)
                }
                break
              case 'less_than':
                const numValue2 = parseFloat(value)
                if (!isNaN(numValue2)) {
                  countQuery = countQuery.lt(field, numValue2)
                  dataQuery = dataQuery.lt(field, numValue2)
                }
                break
              case 'not_empty':
                countQuery = countQuery.not(field, 'is', null).neq(field, '')
                dataQuery = dataQuery.not(field, 'is', null).neq(field, '')
                break
              case 'is_empty':
                countQuery = countQuery.or(`${field}.is.null,${field}.eq.`)
                dataQuery = dataQuery.or(`${field}.is.null,${field}.eq.`)
                break
            }
          }
        })
      }

      // Get total count with filters applied
      const { count: totalCount, error: countError } = await countQuery

      if (countError) {
        throw new Error(`Failed to get count: ${countError.message}`)
      }

      // Calculate pagination
      const total = totalCount || 0
      const totalPages = Math.ceil(total / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      // Fetch paginated data with filters applied
      const { data: cargo, error: cargoError } = await dataQuery
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (cargoError) {
        throw new Error(`Failed to fetch cargo data: ${cargoError.message}`)
      }

      // Fetch rate data and customer data to resolve names
      let enrichedCargo: any[] = cargo || []
      if (cargo && cargo.length > 0) {
        // Get unique rate IDs and customer IDs from the cargo data
        const rateIds = [...new Set(cargo.map((record: any) => record.rate_id).filter(Boolean))]
        const customerIds = [...new Set(cargo.map((record: any) => record.assigned_customer).filter(Boolean))]
        
        console.log('🔍 Rate IDs to lookup:', rateIds)
        console.log('🔍 Customer IDs to lookup:', customerIds)
        console.log('🔍 Sample cargo records:', cargo.slice(0, 3))
        
        // Fetch rates and customers in parallel
        const [ratesResult, customersResult] = await Promise.allSettled([
          rateIds.length > 0 ? supabase
            .from('rates')
            .select('id, name, description, rate_type, base_rate, currency, multiplier')
            .in('id', rateIds) : Promise.resolve({ data: [], error: null }),
          customerIds.length > 0 ? supabase
            .from('customers')
            .select('id, name, code')
            .in('id', customerIds) : Promise.resolve({ data: [], error: null })
        ])
        
        const ratesData = ratesResult.status === 'fulfilled' ? ratesResult.value.data : []
        const customersData = customersResult.status === 'fulfilled' ? customersResult.value.data : []
        
        if (ratesResult.status === 'rejected') {
          console.error('Error fetching rates:', ratesResult.reason)
        } else {
          console.log('✅ Found rates:', ratesData?.length || 0)
        }
        
        if (customersResult.status === 'rejected') {
          console.error('Error fetching customers:', customersResult.reason)
        } else {
          console.log('✅ Found customers:', customersData?.length || 0)
        }
        
        // Merge rate and customer data with cargo data
        enrichedCargo = cargo.map((record: any) => {
          const rate: any = ratesData?.find((r: any) => r.id === record.rate_id)
          const customer: any = customersData?.find((c: any) => c.id === record.assigned_customer)
          
          // Calculate rate value if it's 0.00 or null
          let calculatedRateValue = record.rate_value
          
          // Debug: Log all record data
          console.log(`🔍 Record ${record.rec_id}: rate_value=${record.rate_value}, rate_id=${record.rate_id}, total_kg=${record.total_kg}`)
          console.log(`🔍 Found rate:`, rate)
          console.log(`🔍 Found customer:`, customer)
          
          if ((record.rate_value === 0 || record.rate_value === null || record.rate_value === '0.00' || parseFloat(record.rate_value) === 0) && rate) {
            console.log(`💰 Calculating rate for ${record.rec_id}: type=${rate.rate_type}, base_rate=${rate.base_rate}, total_kg=${record.total_kg}`)
            
            if (rate.rate_type === 'per_kg') {
              calculatedRateValue = (record.total_kg || 0) * (rate.base_rate || 0)
            } else if (rate.rate_type === 'fixed') {
              calculatedRateValue = rate.base_rate || 0
            } else if (rate.rate_type === 'multiplier') {
              calculatedRateValue = (record.total_kg || 0) * (rate.base_rate || 0) * (rate.multiplier || 1)
            }
            // Round to 2 decimal places
            calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
            
            console.log(`💰 Calculated rate for ${record.rec_id}: calculated=${calculatedRateValue}`)
          } else if ((record.rate_value === 0 || record.rate_value === null || record.rate_value === '0.00' || parseFloat(record.rate_value) === 0) && !rate) {
            console.log(`⚠️ No rate found for ${record.rec_id}, using default calculation`)
            // Fallback: assume per_kg rate with default base rate based on currency
            const defaultRate = record.rate_currency === 'USD' ? 2.5 : 2.5 // Default rate per kg
            calculatedRateValue = (record.total_kg || 0) * defaultRate
            calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
            console.log(`💰 Fallback calculation for ${record.rec_id}: ${calculatedRateValue}`)
          } else {
            console.log(`💰 Using existing rate value for ${record.rec_id}: ${calculatedRateValue}`)
          }
          
          return {
            ...record,
            rates: rate || null,
            customers: customer || null,
            calculated_rate_value: calculatedRateValue
          }
        })
      }

      setCargoData(enrichedCargo)
      setTotalRecords(total)
      setTotalPages(totalPages)
      setHasNextPage(hasNextPage)
      setHasPrevPage(hasPrevPage)
      
      console.log(`✅ fetchCargoData completed: ${cargo?.length || 0} records, total=${total}, page=${page}`)
    } catch (err) {
      console.error('Error fetching cargo data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cargo data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchCargoData()
  }, [])

  const calculateTotalRevenue = () => {
    return cargoData.reduce((total, record) => {
      return total + (parseFloat(record.calculated_rate_value) || 0)
    }, 0)
  }

  // Filter handlers
  const handleApplyFilters = async (conditions: FilterCondition[], logic: "AND" | "OR") => {
    console.log('🔍 Applying filters:', conditions, logic)
    setIsApplyingFilters(true)
    setCurrentPage(1) // Reset to first page when filters change
    
    // Set filters in state
    setFilters(conditions, logic)
    
    // Immediately reload data with the new filters
    await fetchCargoData(1, recordsPerPage, false, conditions, logic)
    setIsApplyingFilters(false)
  }

  const handleClearFilters = async () => {
    console.log('🧹 Clearing filters')
    setIsApplyingFilters(true)
    setCurrentPage(1)
    
    // Clear filters in state
    clearFilters()
    
    // Immediately reload data without filters
    await fetchCargoData(1, recordsPerPage, false, [], "AND")
    setIsApplyingFilters(false)
  }

  // Export all data functionality - batched approach to fetch all data
  const handleExportData = async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportCurrentBatch(0)
    setExportTotalBatches(0)
    
    try {
      console.log(`🔄 Starting export of ${totalRecords} assigned rate records using batched approach...`)
      
      // Use batched approach to fetch all data
      const batchSize = 1000 // Fetch 1000 records per batch
      const totalBatches = Math.ceil(totalRecords / batchSize)
      let allData: any[] = []
      
      setExportTotalBatches(totalBatches)
      console.log(`📦 Will fetch ${totalBatches} batches of ${batchSize} records each`)
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const currentPage = batch + 1
        setExportCurrentBatch(currentPage)
        
        // Calculate progress percentage
        const progressPercent = Math.round((batch / totalBatches) * 100)
        setExportProgress(progressPercent)
        
        console.log(`📦 Fetching batch ${batch + 1}/${totalBatches}...`)
        
        // Build query for this batch
        let dataQuery = supabase
          .from('cargo_data')
          .select('*')
          .not('rate_id', 'is', null)
        
        // Apply filters if any
        if (hasActiveFilters && filterConditions.length > 0) {
          filterConditions.forEach((condition) => {
            const { field, operator, value } = condition
            
            if (value && value.trim() !== '') {
              switch (operator) {
                case 'equals':
                  dataQuery = dataQuery.eq(field, value)
                  break
                case 'contains':
                  dataQuery = dataQuery.ilike(field, `%${value}%`)
                  break
                case 'starts_with':
                  dataQuery = dataQuery.ilike(field, `${value}%`)
                  break
                case 'ends_with':
                  dataQuery = dataQuery.ilike(field, `%${value}`)
                  break
                case 'greater_than':
                  const numValue = parseFloat(value)
                  if (!isNaN(numValue)) {
                    dataQuery = dataQuery.gt(field, numValue)
                  }
                  break
                case 'less_than':
                  const numValue2 = parseFloat(value)
                  if (!isNaN(numValue2)) {
                    dataQuery = dataQuery.lt(field, numValue2)
                  }
                  break
                case 'not_empty':
                  dataQuery = dataQuery.not(field, 'is', null).neq(field, '')
                  break
                case 'is_empty':
                  dataQuery = dataQuery.or(`${field}.is.null,${field}.eq.`)
                  break
              }
            }
          })
        }
        
        // Fetch paginated data for this batch
        const { data: batchData, error: batchError } = await dataQuery
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * batchSize, currentPage * batchSize - 1)
        
        if (batchError) {
          throw new Error(`Failed to fetch batch ${batch + 1}: ${batchError.message}`)
        }
        
        if (batchData && batchData.length > 0) {
          allData.push(...batchData)
          console.log(`📦 Batch ${batch + 1} completed: ${batchData.length} records (Total so far: ${allData.length})`)
        }
      }
      
      // Set progress to 100% when all batches are done
      setExportProgress(100)
      console.log(`✅ All batches completed! Total records fetched: ${allData.length}`)

      // Fetch rate data and customer data to resolve names for all records
      let enrichedData: any[] = allData
      if (allData.length > 0) {
        // Get unique rate IDs and customer IDs from the cargo data
        const rateIds = [...new Set(allData.map((record: any) => record.rate_id).filter(Boolean))]
        const customerIds = [...new Set(allData.map((record: any) => record.assigned_customer).filter(Boolean))]
        
        console.log('🔍 Export - Rate IDs to lookup:', rateIds)
        console.log('🔍 Export - Customer IDs to lookup:', customerIds)
        
        // Fetch rates and customers in parallel
        const [ratesResult, customersResult] = await Promise.allSettled([
          rateIds.length > 0 ? supabase
            .from('rates')
            .select('id, name, description, rate_type, base_rate, currency, multiplier')
            .in('id', rateIds) : Promise.resolve({ data: [], error: null }),
          customerIds.length > 0 ? supabase
            .from('customers')
            .select('id, name, code')
            .in('id', customerIds) : Promise.resolve({ data: [], error: null })
        ])
        
        const ratesData = ratesResult.status === 'fulfilled' ? ratesResult.value.data : []
        const customersData = customersResult.status === 'fulfilled' ? customersResult.value.data : []
        
        if (ratesResult.status === 'rejected') {
          console.error('Error fetching rates for export:', ratesResult.reason)
        } else {
          console.log('✅ Export - Found rates:', ratesData?.length || 0)
        }
        
        if (customersResult.status === 'rejected') {
          console.error('Error fetching customers for export:', customersResult.reason)
        } else {
          console.log('✅ Export - Found customers:', customersData?.length || 0)
        }
        
        // Merge rate and customer data with cargo data
        enrichedData = allData.map((record: any) => {
          const rate: any = ratesData?.find((r: any) => r.id === record.rate_id)
          const customer: any = customersData?.find((c: any) => c.id === record.assigned_customer)
          
          // Calculate rate value if it's 0.00 or null
          let calculatedRateValue = record.rate_value
          if ((record.rate_value === 0 || record.rate_value === null) && rate) {
            if (rate.rate_type === 'per_kg') {
              calculatedRateValue = (record.total_kg || 0) * (rate.base_rate || 0)
            } else if (rate.rate_type === 'fixed') {
              calculatedRateValue = rate.base_rate || 0
            } else if (rate.rate_type === 'multiplier') {
              calculatedRateValue = (record.total_kg || 0) * (rate.base_rate || 0) * (rate.multiplier || 1)
            }
            // Round to 2 decimal places
            calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
          }
          
          return {
            ...record,
            rates: rate || null,
            customers: customer || null,
            calculated_rate_value: calculatedRateValue
          }
        })
      }

      // Generate CSV content
      const csvContent = generateCSV(enrichedData)
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `assigned_rate_data_export_${timestamp}.csv`
      
      // Download the file
      downloadFile(csvContent, filename, 'text/csv')

      console.log(`✅ Successfully exported ${enrichedData.length} records to ${filename}`)
      
      // Show success toast
      toast({
        title: "Export Completed! 🎉",
        description: `Successfully exported ${enrichedData.length.toLocaleString()} assigned rate records to ${filename}`,
        duration: 5000,
      })
      
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Export Failed ❌",
        description: `Error occurred while exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setExportCurrentBatch(0)
      setExportTotalBatches(0)
    }
  }

  // Generate CSV content for assigned rate data
  const generateCSV = (data: any[]): string => {
    let csv = ""
    
    // Add headers
    const headers = [
      'Inb. Flight Date',
      'Outb. Flight Date', 
      'Rec. ID',
      'Des. No.',
      'Rec. Number',
      'Orig. OE',
      'Dest. OE',
      'Inb. Flight No.',
      'Outb. Flight No.',
      'Mail Category',
      'Mail Class',
      'Total Weight (kg)',
      'Invoice',
      'Contractee Name',
      'Rate Name',
      'Rate Value',
      'Rate Currency',
      'Assigned At'
    ]
    csv += headers.join(",") + "\n"
    
    // Add data rows
    data.forEach((record: any) => {
      const row = [
        record.inb_flight_date || '',
        record.outb_flight_date || '',
        record.rec_id || '',
        record.des_no || '',
        record.rec_numb || '',
        record.orig_oe || '',
        record.dest_oe || '',
        record.inb_flight_no || '',
        record.outb_flight_no || '',
        record.mail_cat || '',
        record.mail_class || '',
        record.total_kg || '0.0',
        record.invoice || '',
        record.customers?.name || record.customer_name_number || '',
        record.rates?.name || record.rate_name || '',
        record.calculated_rate_value || '0.00',
        record.rate_currency || record.rates?.currency || 'EUR',
        record.assigned_at ? new Date(record.assigned_at).toLocaleDateString() : ''
      ]
      csv += row.map(field => `"${field}"`).join(",") + "\n"
    })
    
    return csv
  }

  // Calculate pagination for server-side data
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + cargoData.length // Use actual data length from server
  
  // Use server pagination values
  const paginationTotalPages = totalPages
  const paginationTotalRecords = totalRecords
  const paginationHasPrevPage = hasPrevPage
  const paginationHasNextPage = hasNextPage

  // Calculate statistics for the current page data
  const totalItems = totalRecords // Use total records from server
  const totalWeight = cargoData.reduce((sum, record) => sum + parseFloat(String(record.total_kg || 0)), 0)
  const avgWeight = cargoData.length > 0 ? totalWeight / cargoData.length : 0
  const assignedCount = totalRecords // All records are assigned since we filter them

  return (
    <div className="space-y-4 pt-2">
      {/* Error Banner */}
      {error && (
        <WarningBanner 
          message={error}
          className="mb-4"
        />
      )}

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-black flex items-center gap-2">
              Assigned Rate Data Preview
            </CardTitle>
            <p className="text-sm text-gray-600">Showing only cargo records with assigned rates for contractees</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log('🔄 Refresh button clicked')
                try {
                  await fetchCargoData(currentPage, recordsPerPage, true)
                  console.log('✅ Refresh completed successfully')
                } catch (error) {
                  console.error('❌ Refresh failed:', error)
                }
              }}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                disabled={isApplyingFilters || isExporting}
                className={hasActiveFilters ? "border-blue-300 bg-blue-50 text-blue-700" : ""}
              >
                {isApplyingFilters ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4 mr-2" />
                )}
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">
                    {filterConditions.length}
                  </span>
                )}
              </Button>
              
              {/* Filter Popup */}
              {isFilterOpen && (
                <FilterPopup
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                  onApply={handleApplyFilters}
                  fields={filterFields}
                  initialConditions={filterConditions}
                  initialLogic={filterLogic}
                  title="Filter Rate Data"
                />
              )}
            </div>
            <Button
              onClick={handleExportData}
              className="bg-black text-white hover:bg-gray-800"
              size="sm"
              disabled={totalRecords === 0 || isExporting || isApplyingFilters}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            {hasActiveFilters && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500">
                  {filterConditions.length} filter{filterConditions.length !== 1 ? 's' : ''} active
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={isApplyingFilters}
                  className="h-6 text-xs text-gray-500 hover:text-gray-700"
                >
                  {isApplyingFilters ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : null}
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            {hasActiveFilters ? (
              <span>Filtered: <strong className="text-black">{totalItems.toLocaleString()}</strong> records</span>
            ) : (
              <span>Total Records: <strong className="text-black">{totalItems.toLocaleString()}</strong></span>
            )}
            <span>Total Weight: <strong className="text-black">{totalWeight.toFixed(1)} kg</strong></span>
            <span>Avg Weight: <strong className="text-black">{avgWeight.toFixed(1)} kg</strong></span>
            <span>Total Revenue: <strong className="text-black">€{calculateTotalRevenue().toFixed(2)}</strong></span>
          </div>
        </div>
      </CardHeader>
      
      {/* Export Progress Bar Section */}
      {isExporting && (
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Exporting Assigned Rate Data...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{exportProgress}%</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, exportProgress))}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex-1">
                {exportCurrentBatch > 0 && exportTotalBatches > 0 
                  ? `Fetching batch ${exportCurrentBatch} of ${exportTotalBatches}...`
                  : 'Preparing export...'
                }
              </span>
            </div>
          </div>
        </div>
      )}
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading cargo data...</span>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <Table className="border border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="border">Inb.Flight Date</TableHead>
                <TableHead className="border">Outb.Flight Date</TableHead>
                <TableHead className="border">Rec. ID</TableHead>
                <TableHead className="border">Des. No.</TableHead>
                <TableHead className="border">Rec. Numb.</TableHead>
                <TableHead className="border">Orig. OE</TableHead>
                <TableHead className="border">Dest. OE</TableHead>
                <TableHead className="border">Inb. Flight No.</TableHead>
                <TableHead className="border">Outb. Flight No.</TableHead>
                <TableHead className="border">Mail Cat.</TableHead>
                <TableHead className="border">Mail Class</TableHead>
                <TableHead className="border text-right">Total kg</TableHead>
                <TableHead className="border">Invoice</TableHead>
                <TableHead className="border bg-yellow-200">Contractee</TableHead>
                <TableHead className="border bg-yellow-200">Rate Name</TableHead>
                <TableHead className="border bg-yellow-200">Base Rate</TableHead>
                <TableHead className="border text-right bg-yellow-200">Rate Value</TableHead>
                <TableHead className="border bg-yellow-200">Currency</TableHead>
                <TableHead className="border bg-yellow-200">Assigned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargoData.map((record, index) => (
                <TableRow key={record.id || index}>
                  <TableCell className="border">{record.inb_flight_date || 'N/A'}</TableCell>
                  <TableCell className="border">{record.outb_flight_date || 'N/A'}</TableCell>
                  <TableCell className="border font-mono text-xs">{record.rec_id || 'N/A'}</TableCell>
                  <TableCell className="border">{record.des_no || 'N/A'}</TableCell>
                  <TableCell className="border">{record.rec_numb || 'N/A'}</TableCell>
                  <TableCell className="border">{record.orig_oe || 'N/A'}</TableCell>
                  <TableCell className="border">{record.dest_oe || 'N/A'}</TableCell>
                  <TableCell className="border">{record.inb_flight_no || 'N/A'}</TableCell>
                  <TableCell className="border">{record.outb_flight_no || 'N/A'}</TableCell>
                  <TableCell className="border">{record.mail_cat || 'N/A'}</TableCell>
                  <TableCell className="border">{record.mail_class || 'N/A'}</TableCell>
                  <TableCell className="border text-right">{record.total_kg || '0.0'}</TableCell>
                  <TableCell className="border">{record.invoice || 'N/A'}</TableCell>
                  <TableCell className="border text-xs bg-yellow-200">
                    {record.customers?.name || record.customer_name_number || 'N/A'}
                  </TableCell>
                  <TableCell className="border text-xs bg-yellow-200">
                    {record.rates?.name || record.rate_name || 'Unknown Rate'}
                  </TableCell>
                  <TableCell className="border text-xs bg-yellow-200">
                    {record.rates?.base_rate || record.base_rate || 'N/A'}
                  </TableCell>
                  <TableCell className="border text-xs bg-yellow-200 text-right">
                    {(() => {
                      const value = record.calculated_rate_value
                      console.log(`🎯 Displaying rate for ${record.rec_id}: calculated_rate_value=${value}, type=${typeof value}`)
                      return value ? `${parseFloat(value).toFixed(2)}` : '0.00'
                    })()}
                  </TableCell>
                  <TableCell className="border text-xs bg-yellow-200">
                    {record.rate_currency || record.rates?.currency || 'EUR'}
                  </TableCell>
                  <TableCell className="border text-xs bg-yellow-200">
                    {record.assigned_at ? new Date(record.assigned_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}

        {/* Pagination Controls - like database-preview.tsx */}
        <Pagination
          currentPage={currentPage}
          totalPages={paginationTotalPages}
          totalRecords={paginationTotalRecords}
          recordsPerPage={recordsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={(newPage) => {
            setCurrentPage(newPage)
            fetchCargoData(newPage, recordsPerPage)
          }}
          onRecordsPerPageChange={async (newLimit) => {
            setRecordsPerPage(newLimit)
            setCurrentPage(1)
            await fetchCargoData(1, newLimit)
          }}
          disabled={loading}
          hasPrevPage={paginationHasPrevPage}
          hasNextPage={paginationHasNextPage}
          recordsPerPageOptions={[25, 50, 100, 200]}
        />
        
        {!loading && totalItems === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No cargo data with assigned rates found</p>
          </div>
        )}
        
      </CardContent>
    </Card>
    </div>
  )
}
