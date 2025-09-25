"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Download, Filter, Loader2, RefreshCw, ChevronDown, Eye } from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { useRateRulesData } from "./hooks"
import { FilterPopup, FilterCondition, FilterField } from "@/components/ui/filter-popup"
import { DisplayFieldsPopup } from "@/components/ui/display-fields-popup"
import { usePageFilters } from "@/store/filter-store"
import { useExecuteRatesColumnConfigStore, type ColumnConfig } from "@/store/execute-rates-column-config-store"
import { supabase } from "@/lib/supabase"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { downloadFile, downloadXLSFile } from "@/lib/export-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
  
  // Customer assignment state
  const [customers, setCustomers] = useState<Array<{id: string, name: string, code: string, codes: {id: string, code: string, product: string, is_active: boolean}[]}>>([])
  const [customerAssignments, setCustomerAssignments] = useState<Record<string, string>>({})
  const [productAssignments, setProductAssignments] = useState<Record<string, string>>({})
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState<string | null>(null)
  
  // Rate assignment state
  const [rates, setRates] = useState<Array<{id: string, name: string, description: string, rate_type: string, base_rate: number, currency: string, multiplier: number}>>([])
  const [rateAssignments, setRateAssignments] = useState<Record<string, string>>({})
  const [isUpdatingRate, setIsUpdatingRate] = useState<string | null>(null)
  
  // Popover state for customer-product selects
  const [openCustomerSelects, setOpenCustomerSelects] = useState<Record<string, boolean>>({})
  const [openRateSelects, setOpenRateSelects] = useState<Record<string, boolean>>({})
  
  // Ordering state
  const [orderBy, setOrderBy] = useState<'id' | 'assigned_at' | 'created_at'>('assigned_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')
  
  // Memoized customers for better performance
  const memoizedCustomers = useMemo(() => {
    return customers.sort((a, b) => a.name.localeCompare(b.name))
  }, [customers])
  
  // Memoized rates for better performance
  const memoizedRates = useMemo(() => {
    return rates.sort((a, b) => a.name.localeCompare(b.name))
  }, [rates])
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("execute-rates")
  
  // Display fields state
  const [isDisplayFieldsOpen, setIsDisplayFieldsOpen] = useState(false)
  
  // Column config store
  const { columnConfigs, setColumnConfigs } = useExecuteRatesColumnConfigStore()
  
  // Toast for notifications
  const { toast } = useToast()
  
  // Get only visible columns in order
  const visibleColumns = useMemo(() => 
    columnConfigs
      .filter(config => config.visible)
      .sort((a, b) => a.order - b.order),
    [columnConfigs]
  )

  // Calculate responsive column widths based on content
  const getColumnWidth = (columnKey: string): string => {
    const widthMap: Record<string, string> = {
      // ID fields - narrow
      'id': 'w-20',
      'rec_id': 'w-20',
      'des_no': 'w-16',
      'rec_numb': 'w-16',
      
      // Date fields - medium
      'inb_flight_date': 'w-28',
      'outb_flight_date': 'w-28',
      'created_at': 'w-24',
      'updated_at': 'w-24',
      'assigned_at': 'w-32',
      
      // Location fields - medium
      'orig_oe': 'w-16',
      'dest_oe': 'w-16',
      
      // Flight numbers - wider
      'inb_flight_no': 'w-24',
      'outb_flight_no': 'w-24',
      
      // Category fields - medium
      'mail_cat': 'w-20',
      'mail_class': 'w-20',
      
      // Numeric fields - medium
      'total_kg': 'w-20',
      'assigned_rate': 'w-20',
      'rate_value': 'w-20',
      
      // Text fields - wider
      'invoice': 'w-32',
      'assigned_customer': 'w-40',
      'customer_name': 'w-40',
      'customer_name_number': 'w-40',
      'rate_name': 'w-32',
      'rate_currency': 'w-20',
      
      // Default width for unknown fields
      'default': 'w-24'
    }
    
    return widthMap[columnKey] || widthMap['default']
  }

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
        .order(orderBy, { ascending: orderDirection === 'asc' })
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

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    try {
      console.log('🔍 Fetching customers from Supabase...')
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name')

      if (customersError) {
        console.error('❌ Error fetching customers:', customersError)
        return
      }

      if (!customersData || customersData.length === 0) {
        setCustomers([])
        return
      }

      // Get customer IDs for fetching codes
      const customerIds = customersData.map((c: any) => c.id)
      
      // Get all active codes for these customers
      const { data: codesData, error: codesError } = await supabase
        .from('customer_codes')
        .select('id, customer_id, code, product, is_active')
        .in('customer_id', customerIds)
        .eq('is_active', true)
        .order('code')
      
      if (codesError) {
        console.error('❌ Error loading customer codes:', codesError)
        return
      }

      // Combine customers with their codes
      const customersWithCodes = customersData.map((customer: any) => ({
        ...customer,
        codes: (codesData || []).filter((code: any) => code.customer_id === customer.id)
      }))
      
      console.log('✅ Successfully fetched customers with codes:', customersWithCodes?.length || 0)
      setCustomers(customersWithCodes)
    } catch (err) {
      console.error('❌ Error in fetchCustomers:', err)
    }
  }

  // Fetch rates from Supabase
  const fetchRates = async () => {
    try {
      console.log('🔍 Fetching rates from Supabase...')
      const { data: ratesData, error: ratesError } = await supabase
        .from('rates')
        .select('id, name, description, rate_type, base_rate, currency, multiplier')
        .eq('is_active', true)
        .order('name')

      if (ratesError) {
        console.error('❌ Error fetching rates:', ratesError)
        return
      }

      if (!ratesData || ratesData.length === 0) {
        setRates([])
        return
      }
      
      console.log('✅ Successfully fetched rates:', ratesData?.length || 0)
      setRates(ratesData)
    } catch (err) {
      console.error('❌ Error in fetchRates:', err)
    }
  }

  // Fetch cargo data with specific ordering parameters
  const fetchCargoDataWithOrder = async (page: number, limit: number, orderField: 'id' | 'assigned_at' | 'created_at', orderDir: 'asc' | 'desc', isRefresh = false, customFilters?: FilterCondition[], customLogic?: "AND" | "OR") => {
    try {
      console.log(`🔄 fetchCargoDataWithOrder called: page=${page}, limit=${limit}, order=${orderField}, direction=${orderDir}, isRefresh=${isRefresh}`)
      
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
        .order(orderField, { ascending: orderDir === 'asc' })
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
      
      console.log(`✅ fetchCargoDataWithOrder completed: ${cargo?.length || 0} records, total=${total}, page=${page}`)
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
    fetchCustomers()
    fetchRates()
    fetchCargoData()
  }, [])

  // Force re-render when ordering changes to update visual indicators
  useEffect(() => {
    console.log('🔄 Ordering state changed:', orderBy, orderDirection)
  }, [orderBy, orderDirection])

  // Calculate total revenue when component loads or filters change
  useEffect(() => {
    if (!loading && totalRecords > 0) {
      calculateTotalRevenue()
    }
  }, [loading, totalRecords, filterConditions, filterLogic])

  // State for total revenue calculation
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [isCalculatingTotal, setIsCalculatingTotal] = useState(false)

  // Calculate total revenue across ALL records (not just current page)
  const calculateTotalRevenue = async () => {
    if (isCalculatingTotal) return totalRevenue
    
    setIsCalculatingTotal(true)
    try {
      console.log('💰 Calculating total revenue across all records...')
      
      // Build query to get ALL records with assigned rates
      let dataQuery = supabase
        .from('cargo_data')
        .select('*')
        .not('rate_id', 'is', null)
      
      // Apply same filters as current view
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
      
      // Fetch ALL records (no pagination)
      const { data: allCargoData, error } = await dataQuery
      
      if (error) {
        console.error('Error fetching all cargo data for revenue calculation:', error)
        return 0
      }
      
      if (!allCargoData || allCargoData.length === 0) {
        setTotalRevenue(0)
        return 0
      }
      
      // Get unique rate IDs from all data
      const rateIds = [...new Set(allCargoData.map((record: any) => record.rate_id).filter(Boolean))]
      
      // Fetch rates data
      const { data: ratesData } = await supabase
        .from('rates')
        .select('id, name, description, rate_type, base_rate, currency, multiplier')
        .in('id', rateIds)
      
      // Calculate total revenue using same logic as current page
      let total = 0
      allCargoData.forEach((record: any) => {
        const rate: any = ratesData?.find((r: any) => r.id === record.rate_id)
        let calculatedRateValue = record.rate_value || 0
        
        // Same calculation logic as current page
        if ((record.rate_value === 0 || record.rate_value === null || record.rate_value === '0.00' || parseFloat(record.rate_value) === 0) && rate) {
          if (rate.rate_type === 'per_kg') {
            calculatedRateValue = (record.total_kg || 0) * (rate.base_rate || 0)
          } else if (rate.rate_type === 'fixed') {
            calculatedRateValue = rate.base_rate || 0
          } else if (rate.rate_type === 'multiplier') {
            calculatedRateValue = (record.total_kg || 0) * (rate.base_rate || 0) * (rate.multiplier || 1)
          }
          calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
        } else if ((record.rate_value === 0 || record.rate_value === null || record.rate_value === '0.00' || parseFloat(record.rate_value) === 0) && !rate) {
          // Fallback calculation
          const defaultRate = record.rate_currency === 'USD' ? 2.5 : 2.5
          calculatedRateValue = (record.total_kg || 0) * defaultRate
          calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
        }
        
        total += calculatedRateValue
      })
      
      console.log(`💰 Total revenue calculated: €${total.toFixed(2)} across ${allCargoData.length} records`)
      setTotalRevenue(total)
      return total
      
    } catch (error) {
      console.error('Error calculating total revenue:', error)
      return 0
    } finally {
      setIsCalculatingTotal(false)
    }
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

  const handleApplyDisplayFields = (configs: ColumnConfig[]) => {
    setColumnConfigs(configs)
  }

  // Handle customer-product assignment updates
  const handleAssignmentUpdate = async (recordId: string, customerId: string, productId: string) => {
    setIsUpdatingAssignment(recordId)
    
    try {
      const { data, error } = await (supabase as any)
        .from('cargo_data')
        .update({
          assigned_customer: customerId === 'unassigned' ? null : customerId,
          customer_code_id: productId === 'no-product' ? null : productId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', recordId)

      if (error) {
        console.error('Error updating assignment:', error)
        toast({
          title: "Error",
          description: "Failed to update assignment",
          variant: "destructive"
        })
        return
      }

      // Update local state
      setCustomerAssignments(prev => ({ ...prev, [recordId]: customerId }))
      setProductAssignments(prev => ({ ...prev, [recordId]: productId }))
      
      // Update the cargo data in place to avoid reordering
      setCargoData(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              assigned_customer: customerId === 'unassigned' ? undefined : customerId,
              customer_code_id: productId === 'no-product' ? undefined : productId
            } 
          : record
      ))
      
      toast({
        title: "Success",
        description: "Record updated"
      })
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingAssignment(null)
    }
  }

  // Handle rate assignment updates
  const handleRateUpdate = async (recordId: string, rateId: string) => {
    setIsUpdatingRate(recordId)
    
    try {
      console.log('🔄 Starting rate update for record:', recordId, 'rate:', rateId)
      
      // Find the selected rate
      const selectedRate = rates.find(rate => rate.id === rateId)
      if (!selectedRate) {
        throw new Error('Selected rate not found')
      }
      
      console.log('✅ Selected rate found:', selectedRate)

      // Calculate new rate value based on rate type and record weight
      const record = cargoData.find(r => r.id === recordId)
      if (!record) {
        throw new Error('Record not found in cargo data')
      }
      
      console.log('✅ Record found:', record)
      
      let calculatedRateValue = 0
      
      if (selectedRate.rate_type === 'per_kg') {
        calculatedRateValue = (record.total_kg || 0) * (selectedRate.base_rate || 0)
      } else if (selectedRate.rate_type === 'fixed') {
        calculatedRateValue = selectedRate.base_rate || 0
      } else if (selectedRate.rate_type === 'multiplier') {
        calculatedRateValue = (record.total_kg || 0) * (selectedRate.base_rate || 0) * (selectedRate.multiplier || 1)
      }
      // Round to 2 decimal places
      calculatedRateValue = Math.round(calculatedRateValue * 100) / 100
      
      console.log('💰 Calculated rate value:', calculatedRateValue)

      const updateData = {
        rate_id: rateId,
        rate_value: calculatedRateValue,
        rate_currency: selectedRate.currency
      }
      
      console.log('🔄 Updating database with:', updateData)
      console.log('🔍 Supabase client:', supabase)
      console.log('🔍 Record ID type:', typeof recordId, recordId)

      // Test the connection first
      try {
        const { data: testData, error: testError } = await supabase
          .from('cargo_data')
          .select('id')
          .eq('id', recordId)
          .limit(1)
        
        console.log('🔍 Test query result:', { testData, testError })
        
        if (testError) {
          console.error('❌ Test query failed:', testError)
          throw new Error(`Test query failed: ${testError.message}`)
        }
        
        if (!testData || testData.length === 0) {
          throw new Error(`Record with ID ${recordId} not found in database`)
        }
        
        console.log('✅ Test query successful, record exists')
      } catch (testErr) {
        console.error('❌ Test query error:', testErr)
        throw testErr
      }

      const { data, error } = await (supabase as any)
        .from('cargo_data')
        .update(updateData)
        .eq('id', recordId)

      console.log('🔍 Update result:', { data, error })

      if (error) {
        console.error('❌ Database error:', error)
        console.error('❌ Error type:', typeof error)
        console.error('❌ Error constructor:', error?.constructor?.name)
        console.error('❌ Error details:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        })
        toast({
          title: "Database Error",
          description: `Failed to update rate: ${error?.message || 'Unknown database error'}`,
          variant: "destructive"
        })
        return
      }

      console.log('✅ Database update successful:', data)

      // Update local state
      setRateAssignments(prev => ({ ...prev, [recordId]: rateId }))
      
      // Update the cargo data in place to avoid reordering
      setCargoData(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              rate_id: rateId,
              rate_name: selectedRate.name,
              rate_value: calculatedRateValue,
              rate_currency: selectedRate.currency,
              rate_type: selectedRate.rate_type,
              calculated_rate_value: calculatedRateValue,
              rates: selectedRate
            } 
          : record
      ))
      
      console.log('✅ Local state updated successfully')
      
      toast({
        title: "Success",
        description: "Rate updated successfully"
      })
    } catch (error) {
      console.error('❌ Error updating rate:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      toast({
        title: "Error",
        description: `Failed to update rate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setIsUpdatingRate(null)
    }
  }

  // Export all data functionality - batched approach to fetch all data
  const handleExportData = async (format: "csv" | "xls" = "csv") => {
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

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `assigned_rate_data_export_${timestamp}.${format}`
      
      // Export based on format
      if (format === "csv") {
        // Generate CSV content
        const csvContent = generateCSV(enrichedData)
        downloadFile(csvContent, filename, 'text/csv')
      } else if (format === "xls") {
        // Convert to CargoData format for XLS export
        const cargoData = enrichedData.map((record: any) => ({
          id: record.id,
          origOE: record.orig_oe || '',
          destOE: record.dest_oe || '',
          inbFlightNo: record.inb_flight_no || '',
          outbFlightNo: record.outb_flight_no || '',
          mailCat: record.mail_cat || '',
          mailClass: record.mail_class || '',
          totalKg: record.total_kg || 0,
          invoiceExtend: record.invoice || '',
          customer: record.customer_name || record.assigned_customer || record.customer_name_number || null,
          date: record.inb_flight_date || '',
          sector: record.orig_oe && record.dest_oe ? `${record.orig_oe}-${record.dest_oe}` : '',
          euromail: record.mail_cat || '',
          combined: record.rec_id || '',
          totalEur: record.calculated_rate_value || record.assigned_rate || 0,
          vatEur: 0,
          recordId: record.rec_id || '',
          desNo: record.des_no || '',
          recNumb: record.rec_numb || '',
          outbDate: record.outb_flight_date || ''
        }))
        
        const options = {
          format: "excel" as const,
          includeAnalysis: false,
          groupBy: "none" as const,
          includeCharts: false,
          customFields: []
        }
        downloadXLSFile(cargoData, filename, options)
      }

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
                console.log('🔍 Current order:', orderBy, orderDirection)
                try {
                  await fetchCustomers()
                  await fetchRates()
                  // Force refresh with current ordering state
                  await fetchCargoDataWithOrder(currentPage, recordsPerPage, orderBy, orderDirection, true)
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
            
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDisplayFieldsOpen(!isDisplayFieldsOpen)}
                disabled={isApplyingFilters || isExporting}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Display Fields
              </Button>
              
              {isDisplayFieldsOpen && (
                <DisplayFieldsPopup
                  isOpen={isDisplayFieldsOpen}
                  onClose={() => setIsDisplayFieldsOpen(false)}
                  onApply={handleApplyDisplayFields}
                  columnConfigs={columnConfigs}
                  title="Display Fields"
                />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
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
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => handleExportData("csv")}
                  disabled={isExporting}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium">Export as CSV</div>
                      <div className="text-xs text-gray-500">Comma-separated values</div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportData("xls")}
                  disabled={isExporting}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium">Export as XLS</div>
                      <div className="text-xs text-gray-500">Excel spreadsheet</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <span>Total Revenue: <strong className="text-black">
              {isCalculatingTotal ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calculating...
                </span>
              ) : (
                `€${totalRevenue.toFixed(2)}`
              )}
            </strong></span>
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
        <div className="space-y-0">
          {/* Top scroll bar - wrapper1 */}
          <div 
            className="overflow-x-auto overflow-y-hidden" 
            style={{ width: '100%', height: '20px' }}
            onScroll={(e) => {
              const wrapper2 = e.currentTarget.parentElement?.querySelector('.wrapper2')
              if (wrapper2) {
                wrapper2.scrollLeft = e.currentTarget.scrollLeft
              }
            }}
          >
            <div style={{ width: '2000px', height: '20px' }}></div>
          </div>
          {/* Main table - wrapper2 */}
          <div 
            className="overflow-x-auto overflow-y-hidden wrapper2"
            style={{ width: '100%' }}
            onScroll={(e) => {
              const wrapper1 = e.currentTarget.parentElement?.querySelector('.overflow-x-auto:first-child')
              if (wrapper1) {
                wrapper1.scrollLeft = e.currentTarget.scrollLeft
              }
            }}
          >
            <div className="min-w-full">
              <table className="border border-collapse w-full">
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={`border ${getColumnWidth(column.key)} ${column.key === 'assigned_customer' || column.key === 'assigned_rate' ? 'bg-yellow-200' : ''} ${column.key === 'total_kg' || column.key === 'assigned_rate' ? 'text-right' : ''}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
                <TableHead 
                  key={`assigned-at-${orderBy}-${orderDirection}`}
                  className="border bg-yellow-200 cursor-pointer hover:bg-yellow-300 transition-colors w-32"
                  onClick={async () => {
                    console.log('🔄 Header clicked - current state:', orderBy, orderDirection)
                    if (orderBy === 'assigned_at') {
                      // Toggle direction if already sorting by assigned_at
                      const newDirection = orderDirection === 'desc' ? 'asc' : 'desc'
                      console.log('🔄 Toggling direction to:', newDirection)
                      setOrderDirection(newDirection)
                      // Use the new direction directly instead of waiting for state update
                      await fetchCargoDataWithOrder(currentPage, recordsPerPage, 'assigned_at', newDirection)
                    } else {
                      // Set to assigned_at with default desc direction
                      console.log('🔄 Setting to assigned_at with desc')
                      setOrderBy('assigned_at')
                      setOrderDirection('desc')
                      await fetchCargoDataWithOrder(currentPage, recordsPerPage, 'assigned_at', 'desc')
                    }
                  }}
                >
                  Assigned At {orderBy === 'assigned_at' && (orderDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargoData.map((record, index) => (
                <TableRow key={record.id || index}>
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={`cell-${index}-${column.key}`}
                      className={`border ${getColumnWidth(column.key)} ${column.key === 'assigned_customer' || column.key === 'assigned_rate' ? 'bg-yellow-200' : ''} ${column.key === 'rec_id' || column.key === 'id' ? 'font-mono text-xs' : ''} ${column.key === 'total_kg' || column.key === 'assigned_rate' ? 'text-right' : ''}`}
                    >
                      {(() => {
                        const fieldMapping: Record<string, string> = {
                          'rec_id': 'recordId',
                          'inb_flight_date': 'date', 
                          'outb_flight_date': 'outbDate',
                          'des_no': 'desNo',
                          'rec_numb': 'recNumb',
                          'orig_oe': 'origOE',
                          'dest_oe': 'destOE',
                          'inb_flight_no': 'inbFlightNo',
                          'outb_flight_no': 'outbFlightNo',
                          'mail_cat': 'mailCat',
                          'mail_class': 'mailClass',
                          'total_kg': 'totalKg',
                          'invoice': 'invoiceExtend',
                          'customer_name_number': 'customer',
                          'assigned_customer': 'customer',
                          'assigned_rate': 'totalEur',
                          'rate_name': 'rate_name',
                          'rate_value': 'rate_value',
                          'rate_currency': 'rate_currency',
                          'assigned_at': 'assigned_at'
                        }
                        
                        const mappedKey = fieldMapping[column.key] || column.key
                        let value = (record as any)[mappedKey] || (record as any)[column.key]
                        
                        if (value === undefined || value === null || value === '') {
                          return 'N/A'
                        }
                        
                        // Format numeric values
                        if (column.key === 'total_kg' || column.key === 'assigned_rate' || column.key === 'rate_value') {
                          return typeof value === 'number' ? value.toFixed(1) : String(value)
                        }
                        
                        // Format date values
                        if (column.key === 'inb_flight_date' || column.key === 'outb_flight_date' || column.key === 'processed_at' || column.key === 'created_at' || column.key === 'updated_at' || column.key === 'assigned_at') {
                          if (typeof value === 'string' && value.includes('T')) {
                            return new Date(value).toLocaleDateString()
                          }
                        }
                        
                        return String(value)
                      })()}
                    </TableCell>
                  ))}
                  <TableCell className="border text-xs bg-yellow-200">
                    <Popover 
                      open={openCustomerSelects[record.id]} 
                      onOpenChange={(open) => setOpenCustomerSelects(prev => ({ ...prev, [record.id]: open }))}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCustomerSelects[record.id]}
                          className="h-8 text-xs border-gray-200 justify-between font-normal w-full"
                          disabled={isUpdatingAssignment === record.id}
                        >
                          <span className="truncate">
                            {(() => {
                              const customerId = customerAssignments[record.id] || record.assigned_customer
                              const productId = productAssignments[record.id] || record.customer_code_id
                              
                              if (customerId === 'unassigned' || !customerId) {
                                return "Unassigned"
                              }
                              
                              const customer = customers.find(c => c.id === customerId)
                              const code = customer?.codes.find(c => c.id === productId)
                              
                              if (customer && code) {
                                return `${customer.name} - ${code.product}`
                              } else if (customer) {
                                return `${customer.name} - No Product`
                              }
                              
                              return "Select customer-product..."
                            })()}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" side="bottom" align="start">
                        <Command>
                          <CommandInput placeholder="Search customer-product combinations..." className="h-8 text-xs" />
                          <CommandEmpty>No combinations found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            <CommandItem
                              value="unassigned"
                              onSelect={() => {
                                handleAssignmentUpdate(record.id, 'unassigned', 'no-product')
                                setOpenCustomerSelects(prev => ({ ...prev, [record.id]: false }))
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  (customerAssignments[record.id] || record.assigned_customer) === 'unassigned' || !record.assigned_customer ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Unassigned
                            </CommandItem>
                            {memoizedCustomers.map((customer) => {
                              const activeCodes = customer.codes.filter(code => code.is_active)
                              return activeCodes.map((code) => (
                                <CommandItem
                                  key={`${customer.id}-${code.id}`}
                                  value={`${customer.name} ${code.product}`}
                                  onSelect={() => {
                                    handleAssignmentUpdate(record.id, customer.id, code.id)
                                    setOpenCustomerSelects(prev => ({ ...prev, [record.id]: false }))
                                  }}
                                  className="text-xs"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-3 w-3",
                                      (customerAssignments[record.id] || record.assigned_customer) === customer.id && 
                                      (productAssignments[record.id] || record.customer_code_id) === code.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center justify-between min-w-0 flex-1 gap-2">
                                    <span className="font-medium text-sm truncate flex-1 min-w-0">{customer.name}</span>
                                    <span className="text-gray-500 text-xs flex-shrink-0">{code.product}</span>
                                  </div>
                                </CommandItem>
                              ))
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="border text-xs bg-yellow-200">
                    <Popover 
                      open={openRateSelects[record.id]} 
                      onOpenChange={(open) => setOpenRateSelects(prev => ({ ...prev, [record.id]: open }))}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openRateSelects[record.id]}
                          className="h-8 text-xs border-gray-200 justify-between font-normal w-full"
                          disabled={isUpdatingRate === record.id}
                        >
                          <span className="truncate">
                            {(() => {
                              const rateId = rateAssignments[record.id] || record.rate_id
                              
                              if (!rateId) {
                                return "Select rate..."
                              }
                              
                              const rate = rates.find(r => r.id === rateId)
                              
                              if (rate) {
                                return `${rate.name} (${rate.base_rate} ${rate.currency})`
                              }
                              
                              return "Select rate..."
                            })()}
                          </span>
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" side="bottom" align="start">
                        <Command>
                          <CommandInput placeholder="Search rates..." className="h-8 text-xs" />
                          <CommandEmpty>No rates found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {memoizedRates.map((rate: any) => (
                              <CommandItem
                                key={rate.id}
                                value={`${rate.name} ${rate.base_rate} ${rate.currency}`}
                                onSelect={() => {
                                  handleRateUpdate(record.id, rate.id)
                                  setOpenRateSelects(prev => ({ ...prev, [record.id]: false }))
                                }}
                                className="text-xs"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    (rateAssignments[record.id] || record.rate_id) === rate.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center justify-between min-w-0 flex-1 gap-2">
                                  <span className="font-medium text-sm truncate flex-1 min-w-0">{rate.name}</span>
                                  <span className="text-gray-500 text-xs flex-shrink-0">{rate.base_rate} {rate.currency}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  {/* <TableCell className="border text-xs bg-yellow-200">
                    {(() => {
                      const rateId = rateAssignments[record.id] || record.rate_id
                      const rate = rates.find(r => r.id === rateId)
                      return rate ? `${rate.base_rate} ${rate.currency}` : 'N/A'
                    })()}
                  </TableCell> */}
                  <TableCell className="border text-xs bg-yellow-200 text-right">
                    {(() => {
                      const value = record.calculated_rate_value
                      console.log(`🎯 Displaying rate for ${record.rec_id}: calculated_rate_value=${value}, type=${typeof value}`)
                      return value ? `${parseFloat(value).toFixed(2)}` : '0.00'
                    })()}
                  </TableCell>
                  {/* <TableCell className="border text-xs bg-yellow-200">
                    {record.rate_currency || record.rates?.currency || 'EUR'}
                  </TableCell> */}
                  <TableCell className="border text-xs bg-yellow-200">
                    {record.assigned_at ? new Date(record.assigned_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
            </div>
          </div>
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
