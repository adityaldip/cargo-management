"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Play, ArrowLeft, Filter, RefreshCw, Download, ChevronDown } from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { useCustomerRules } from "./hooks"
import { FilterPopup } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"
import { supabase, safeSupabaseOperation } from "@/lib/supabase"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { downloadFile, downloadXLSFile } from "@/lib/export-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  ExecuteRulesProps, 
  CargoDataRecord, 
  Customer, 
  FilterField, 
  FilterCondition 
} from "@/types/execute-rules"

export function ExecuteRules({ currentView, setCurrentView }: ExecuteRulesProps) {
  const { rules } = useCustomerRules()
  
  // Data fetching state
  const [cargoData, setCargoData] = useState<CargoDataRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [customers, setCustomers] = useState<Array<{id: string, name: string, code: string, codes: {id: string, code: string, product: string, is_active: boolean}[]}>>([])
  
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
  
  // Customer-product assignment state
  const [customerAssignments, setCustomerAssignments] = useState<Record<string, string>>({})
  const [productAssignments, setProductAssignments] = useState<Record<string, string>>({})
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState<string | null>(null)
  
  // Ordering state
  const [orderBy, setOrderBy] = useState<'id' | 'assigned_at' | 'created_at'>('assigned_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')
  
  // Popover state for customer-product selects
  const [openCustomerSelects, setOpenCustomerSelects] = useState<Record<string, boolean>>({})
  const [openProductSelects, setOpenProductSelects] = useState<Record<string, boolean>>({})
  
  // Memoized customers for better performance
  const memoizedCustomers = useMemo(() => {
    return customers.sort((a, b) => a.name.localeCompare(b.name))
  }, [customers])
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("execute-rules")
  
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
    { key: 'assigned_customer', label: 'Assigned Contractee', type: 'text' }
  ]

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

      // Build base query for assigned customers
      console.log('🔍 Building base queries for assigned customers...')
      let countQuery = supabase
        .from('cargo_data')
        .select('*', { count: 'exact', head: true })
        .not('assigned_customer', 'is', null)

      let dataQuery = supabase
        .from('cargo_data')
        .select('*')
        .not('assigned_customer', 'is', null)
      
      console.log('✅ Base queries built successfully')

      // Apply filters if any
      if (hasFilters && activeFilters.length > 0) {
        console.log('🔍 Applying filters:', activeFilters)
        
        activeFilters.forEach((condition, index) => {
          const { field, operator, value } = condition
          
          console.log(`🔍 Applying filter ${index + 1}: ${field} ${operator} "${value}"`)
          
          if (value && value.trim() !== '') {
            try {
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
              console.log(`✅ Filter ${index + 1} applied successfully`)
            } catch (filterError) {
              console.error(`❌ Error applying filter ${index + 1}:`, filterError)
              throw new Error(`Failed to apply filter: ${field} ${operator} "${value}". Error: ${filterError instanceof Error ? filterError.message : 'Unknown error'}`)
            }
          }
        })
        console.log('✅ All filters applied successfully')
      }

      // Get total count with filters applied
      console.log('🔍 Executing count query...')
      const { count: totalCount, error: countError } = await countQuery

      if (countError) {
        console.error('❌ Count query error:', countError)
        console.error('❌ Count query details:', {
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code
        })
        
        // Try a simpler count query as fallback
        console.log('🔄 Attempting fallback count query...')
        const { count: fallbackCount, error: fallbackError } = await supabase
          .from('cargo_data')
          .select('*', { count: 'exact', head: true })
          .not('assigned_customer', 'is', null)
        
        if (fallbackError) {
          console.error('❌ Fallback count query also failed:', fallbackError)
          throw new Error(`Failed to get count: ${countError.message}. Fallback also failed: ${fallbackError.message}`)
        }
        
        console.log('✅ Fallback count query succeeded:', fallbackCount)
        const total = fallbackCount || 0
        const totalPages = Math.ceil(total / limit)
        const hasNextPage = page < totalPages
        const hasPrevPage = page > 1

        // Fetch paginated data with filters applied (but without count)
        const { data: cargo, error: cargoError } = await dataQuery
          .order(orderField, { ascending: orderDir === 'asc' })
          .range((page - 1) * limit, page * limit - 1)

        if (cargoError) {
          console.error('❌ Data query also failed:', cargoError)
          throw new Error(`Failed to fetch cargo data: ${cargoError.message}`)
        }

        // Set the data and pagination info
        setCargoData(cargo || [])
        setTotalRecords(total)
        setTotalPages(totalPages)
        setHasNextPage(hasNextPage)
        setHasPrevPage(hasPrevPage)
        
        console.log(`✅ fetchCargoDataWithOrder completed with fallback: ${cargo?.length || 0} records, total=${total}, page=${page}`)
        return
      }

      // Calculate pagination
      const total = totalCount || 0
      const totalPages = Math.ceil(total / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      // Fetch paginated data with filters applied
      console.log('🔍 Ordering by:', orderField, 'direction:', orderDir, 'ascending:', orderDir === 'asc')
      const { data: cargo, error: cargoError } = await dataQuery
        .order(orderField, { ascending: orderDir === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (cargoError) {
        throw new Error(`Failed to fetch cargo data: ${cargoError.message}`)
      }

      // Fetch customer data to resolve customer names and codes
      let enrichedCargo: any[] = cargo || []
      if (cargo && cargo.length > 0) {
        // Get unique customer IDs and customer code IDs from the cargo data
        const customerIds = [...new Set(cargo.map((record: any) => record.assigned_customer).filter(Boolean))]
        const customerCodeIds = [...new Set(cargo.map((record: any) => record.customer_code_id).filter(Boolean))]
        
        console.log('🔍 Customer IDs to lookup:', customerIds)
        console.log('🔍 Customer Code IDs to lookup:', customerCodeIds)
        
        if (customerIds.length > 0 || customerCodeIds.length > 0) {
          try {
            // Fetch customers by ID
            let customersData: any[] = []
            if (customerIds.length > 0) {
              console.log('🔍 Customer UUIDs to lookup:', customerIds)
              
              const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('id, name, code')
                .in('id', customerIds)
              
              if (customersError) {
                console.error('Error fetching customers by UUID:', customersError)
              } else {
                customersData = customers || []
                console.log('✅ Found customers by UUID:', customersData.length)
              }
            }

            // Fetch customer codes by ID
            let customerCodesData: any[] = []
            if (customerCodeIds.length > 0) {
              console.log('🔍 Customer Code UUIDs to lookup:', customerCodeIds)
              
              const { data: customerCodes, error: customerCodesError } = await supabase
                .from('customer_codes')
                .select('id, code, product, customer_id, customers!inner(id, name)')
                .in('id', customerCodeIds)
              
              if (customerCodesError) {
                console.error('Error fetching customer codes by UUID:', customerCodesError)
              } else {
                customerCodesData = customerCodes || []
                console.log('✅ Found customer codes by UUID:', customerCodesData.length)
              }
            }
            
            // Merge customer and customer code data with cargo data
            enrichedCargo = cargo.map((record: any) => {
              const customer = customersData?.find((c: any) => c.id === record.assigned_customer)
              const customerCode = customerCodesData?.find((cc: any) => cc.id === record.customer_code_id)
              
              return {
                ...record,
                customers: customer || null,
                customer_codes: customerCode || null
              }
            })
            
          } catch (customerFetchError) {
            console.error('Error in customer fetch operation:', customerFetchError)
            // Continue with original data if customer fetch fails
            enrichedCargo = cargo
          }
        }
      }

      setCargoData(enrichedCargo)
      setTotalRecords(total)
      setTotalPages(totalPages)
      setHasNextPage(hasNextPage)
      setHasPrevPage(hasPrevPage)
      
      console.log(`✅ fetchCargoDataWithOrder completed: ${cargo?.length || 0} records, total=${total}, page=${page}`)
    } catch (err) {
      console.error('❌ Error fetching cargo data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cargo data'
      console.error('❌ Full error details:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      })
      setError(errorMessage)
      
      // Show toast notification for better user feedback
      toast({
        title: "Data Loading Failed ❌",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch cargo data from Supabase - only assigned customers with server-side pagination
  const fetchCargoData = async (page: number = currentPage, limit: number = recordsPerPage, isRefresh = false, customFilters?: FilterCondition[], customLogic?: "AND" | "OR") => {
    try {
      console.log(`🔄 fetchCargoData called: page=${page}, limit=${limit}, isRefresh=${isRefresh}`)
      console.log('🔍 Supabase client initialized for browser')
      
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

      // Build base query for assigned customers
      console.log('🔍 Building base queries for assigned customers...')
      let countQuery = supabase
        .from('cargo_data')
        .select('*', { count: 'exact', head: true })
        .not('assigned_customer', 'is', null)

      let dataQuery = supabase
        .from('cargo_data')
        .select('*')
        .not('assigned_customer', 'is', null)
      
      console.log('✅ Base queries built successfully')

      // Apply filters if any
      if (hasFilters && activeFilters.length > 0) {
        console.log('🔍 Applying filters:', activeFilters)
        
        activeFilters.forEach((condition, index) => {
          const { field, operator, value } = condition
          
          console.log(`🔍 Applying filter ${index + 1}: ${field} ${operator} "${value}"`)
          
          if (value && value.trim() !== '') {
            try {
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
              console.log(`✅ Filter ${index + 1} applied successfully`)
            } catch (filterError) {
              console.error(`❌ Error applying filter ${index + 1}:`, filterError)
              throw new Error(`Failed to apply filter: ${field} ${operator} "${value}". Error: ${filterError instanceof Error ? filterError.message : 'Unknown error'}`)
            }
          }
        })
        console.log('✅ All filters applied successfully')
      }

      // Get total count with filters applied
      console.log('🔍 Executing count query...')
      const { count: totalCount, error: countError } = await countQuery

      if (countError) {
        console.error('❌ Count query error:', countError)
        console.error('❌ Count query details:', {
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code
        })
        
        // Try a simpler count query as fallback
        console.log('🔄 Attempting fallback count query...')
        const { count: fallbackCount, error: fallbackError } = await supabase
          .from('cargo_data')
          .select('*', { count: 'exact', head: true })
          .not('assigned_customer', 'is', null)
        
        if (fallbackError) {
          console.error('❌ Fallback count query also failed:', fallbackError)
          throw new Error(`Failed to get count: ${countError.message}. Fallback also failed: ${fallbackError.message}`)
        }
        
        console.log('✅ Fallback count query succeeded:', fallbackCount)
        const total = fallbackCount || 0
        const totalPages = Math.ceil(total / limit)
        const hasNextPage = page < totalPages
        const hasPrevPage = page > 1

        // Fetch paginated data with filters applied (but without count)
        const { data: cargo, error: cargoError } = await dataQuery
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .range((page - 1) * limit, page * limit - 1)

        if (cargoError) {
          console.error('❌ Data query also failed:', cargoError)
          throw new Error(`Failed to fetch cargo data: ${cargoError.message}`)
        }

        // Set the data and pagination info
        setCargoData(cargo || [])
        setTotalRecords(total)
        setTotalPages(totalPages)
        setHasNextPage(hasNextPage)
        setHasPrevPage(hasPrevPage)
        
        console.log(`✅ fetchCargoData completed with fallback: ${cargo?.length || 0} records, total=${total}, page=${page}`)
        return
      }

      // Calculate pagination
      const total = totalCount || 0
      const totalPages = Math.ceil(total / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      // Fetch paginated data with filters applied
      console.log('🔍 Ordering by:', orderBy, 'direction:', orderDirection, 'ascending:', orderDirection === 'asc')
      const { data: cargo, error: cargoError } = await dataQuery
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (cargoError) {
        throw new Error(`Failed to fetch cargo data: ${cargoError.message}`)
      }

      // Fetch customer data to resolve customer names and codes
      let enrichedCargo: any[] = cargo || []
      if (cargo && cargo.length > 0) {
        // Get unique customer IDs and customer code IDs from the cargo data
        const customerIds = [...new Set(cargo.map((record: any) => record.assigned_customer).filter(Boolean))]
        const customerCodeIds = [...new Set(cargo.map((record: any) => record.customer_code_id).filter(Boolean))]
        
        console.log('🔍 Customer IDs to lookup:', customerIds)
        console.log('🔍 Customer Code IDs to lookup:', customerCodeIds)
        
        if (customerIds.length > 0 || customerCodeIds.length > 0) {
          try {
            // Fetch customers by ID
            let customersData: any[] = []
            if (customerIds.length > 0) {
              console.log('🔍 Customer UUIDs to lookup:', customerIds)
              
              const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('id, name, code')
                .in('id', customerIds)
              
              if (customersError) {
                console.error('Error fetching customers by UUID:', customersError)
              } else {
                customersData = customers || []
                console.log('✅ Found customers by UUID:', customersData.length)
              }
            }

            // Fetch customer codes by ID
            let customerCodesData: any[] = []
            if (customerCodeIds.length > 0) {
              console.log('🔍 Customer Code UUIDs to lookup:', customerCodeIds)
              
              const { data: customerCodes, error: customerCodesError } = await supabase
                .from('customer_codes')
                .select('id, code, product, customer_id, customers!inner(id, name)')
                .in('id', customerCodeIds)
              
              if (customerCodesError) {
                console.error('Error fetching customer codes by UUID:', customerCodesError)
              } else {
                customerCodesData = customerCodes || []
                console.log('✅ Found customer codes by UUID:', customerCodesData.length)
              }
            }
            
            // Merge customer and customer code data with cargo data
            enrichedCargo = cargo.map((record: any) => {
              const customer = customersData?.find((c: any) => c.id === record.assigned_customer)
              const customerCode = customerCodesData?.find((cc: any) => cc.id === record.customer_code_id)
              
              return {
                ...record,
                customers: customer || null,
                customer_codes: customerCode || null
              }
            })
            
          } catch (customerFetchError) {
            console.error('Error in customer fetch operation:', customerFetchError)
            // Continue with original data if customer fetch fails
            enrichedCargo = cargo
          }
        }
      }

      setCargoData(enrichedCargo)
      setTotalRecords(total)
      setTotalPages(totalPages)
      setHasNextPage(hasNextPage)
      setHasPrevPage(hasPrevPage)
      
      console.log(`✅ fetchCargoData completed: ${cargo?.length || 0} records, total=${total}, page=${page}`)
    } catch (err) {
      console.error('❌ Error fetching cargo data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cargo data'
      console.error('❌ Full error details:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      })
      setError(errorMessage)
      
      // Show toast notification for better user feedback
      toast({
        title: "Data Loading Failed ❌",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchCustomers()
    fetchCargoData()
  }, [])

  // Force re-render when ordering changes to update visual indicators
  useEffect(() => {
    console.log('🔄 Ordering state changed:', orderBy, orderDirection)
  }, [orderBy, orderDirection])

  // Note: Filter reloading is now handled directly in filter handlers

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
      // Keep the original assigned_at to maintain the current table order
      setCargoData(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              assigned_customer: customerId === 'unassigned' ? undefined : customerId,
              customer_code_id: productId === 'no-product' ? undefined : productId
              // Keep original assigned_at to maintain order
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

  // Note: Filtering is now handled server-side in fetchCargoData

  // Export all data functionality - batched approach to fetch all data
  const handleExportData = async (format: "csv" | "xls" = "csv") => {
    setIsExporting(true)
    setExportProgress(0)
    setExportCurrentBatch(0)
    setExportTotalBatches(0)
    
    try {
      console.log(`🔄 Starting export of ${totalRecords} assigned cargo records using batched approach...`)
      
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
          .not('assigned_customer', 'is', null)
        
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
          .order(orderBy, { ascending: orderDirection === 'asc' })
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

      // Fetch customer data to resolve customer names and codes for all records
      let enrichedData: any[] = allData
      if (allData.length > 0) {
        // Get unique customer IDs and customer code IDs from the cargo data
        const customerIds = [...new Set(allData.map((record: any) => record.assigned_customer).filter(Boolean))]
        const customerCodeIds = [...new Set(allData.map((record: any) => record.customer_code_id).filter(Boolean))]
        
        console.log('🔍 Export - Customer IDs to lookup:', customerIds)
        console.log('🔍 Export - Customer Code IDs to lookup:', customerCodeIds)
        
        if (customerIds.length > 0 || customerCodeIds.length > 0) {
          try {
            // Fetch customers by ID
            let customersData: any[] = []
            if (customerIds.length > 0) {
              console.log('🔍 Export - Customer UUIDs to lookup:', customerIds)
              
              const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('id, name, code')
                .in('id', customerIds)
              
              if (customersError) {
                console.error('Error fetching customers by UUID for export:', customersError)
              } else {
                customersData = customers || []
                console.log('✅ Export - Found customers by UUID:', customersData.length)
              }
            }

            // Fetch customer codes by ID
            let customerCodesData: any[] = []
            if (customerCodeIds.length > 0) {
              console.log('🔍 Export - Customer Code UUIDs to lookup:', customerCodeIds)
              
              const { data: customerCodes, error: customerCodesError } = await supabase
                .from('customer_codes')
                .select('id, code, product, customer_id, customers!inner(id, name)')
                .in('id', customerCodeIds)
              
              if (customerCodesError) {
                console.error('Error fetching customer codes by UUID for export:', customerCodesError)
              } else {
                customerCodesData = customerCodes || []
                console.log('✅ Export - Found customer codes by UUID:', customerCodesData.length)
              }
            }
            
            // Merge customer and customer code data with cargo data
            enrichedData = allData.map((record: any) => {
              const customer = customersData?.find((c: any) => c.id === record.assigned_customer)
              const customerCode = customerCodesData?.find((cc: any) => cc.id === record.customer_code_id)
              
              return {
                ...record,
                customers: customer || null,
                customer_codes: customerCode || null
              }
            })
            
          } catch (customerFetchError) {
            console.error('Error in customer fetch operation for export:', customerFetchError)
            // Continue with original data if customer fetch fails
            enrichedData = allData
          }
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `assigned_cargo_data_export_${timestamp}.${format}`
      
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
          totalEur: record.assigned_rate || record.rate_value || 0,
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
        description: `Successfully exported ${enrichedData.length.toLocaleString()} assigned cargo records to ${filename}`,
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

  // Generate CSV content for assigned cargo data
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
      'Assigned Contractee',
      'Contractee Product',
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
        record.customers?.name || (record.assigned_customer ? `Contractee ID: ${record.assigned_customer}` : ''),
        record.customer_codes?.product || '',
        record.assigned_at ? new Date(record.assigned_at).toLocaleDateString() : ''
      ]
      csv += row.map(field => `"${field}"`).join(",") + "\n"
    })
    
    return csv
  }

  // Calculate pagination for server-side data - like database-preview.tsx
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
  const unassignedCount = 0 // No unassigned records shown

  if (currentView === "rules") {
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
              <CardTitle className="text-black">Assigned Cargo Data Preview</CardTitle>
              <p className="text-sm text-gray-600">Showing only cargo records with assigned contractees</p>
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
                    // Force refresh with current ordering state
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
                    title="Filter Cargo Data"
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
               {/* <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => setCurrentView("results")}
                disabled={loading || cargoData.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute All Rules
              </Button>*/}
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
                  <span className="text-sm font-medium text-gray-900">Exporting Assigned Cargo Data...</span>
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
                  <TableHead className="border bg-yellow-200">Contractee - Product</TableHead>
                  <TableHead 
                    key={`assigned-at-${orderBy}-${orderDirection}`}
                    className="border bg-yellow-200 cursor-pointer hover:bg-yellow-300 transition-colors"
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
              <p className="text-gray-500">No cargo data found</p>
            </div>
          )}
          
        </CardContent>
      </Card>
      </div>
    )
  }

  // Results View
  if (currentView === "results") {
    const totalResultsItems = totalRecords
    return (
      <div className="space-y-4 pt-2">
        {/* Navigation Button */}
        <div className="flex justify-start mb-4">
          <Button 
            variant="default"
            size="sm"
            onClick={() => setCurrentView("rules")}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preview
          </Button>
        </div>

        {/* Data Table Display */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-black flex items-center gap-2">
                <Play className="h-5 w-5" />
                Cargo Data Results
              </CardTitle>
            </div>
            <p className="text-gray-600 text-sm">
              {hasActiveFilters 
                ? `Showing ${totalResultsItems.toLocaleString()} filtered cargo records with automation rules applied`
                : `Showing ${totalResultsItems.toLocaleString()} cargo records with automation rules applied`
              }
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record ID</TableHead>
                    <TableHead>Flight Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Flight No.</TableHead>
                    <TableHead>Mail Cat.</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Customer - Product</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargoData.map((row: CargoDataRecord, index: number) => (
                      <TableRow key={row.id || index}>
                        <TableCell className="font-medium">
                          {String(row.rec_id || `REC-${index + 1}`).substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          {row.inb_flight_date || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{row.orig_oe || "N/A"}</span>
                            <span>→</span>
                            <span>{row.dest_oe || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.inb_flight_no || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.mail_cat || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.total_kg || "0.0"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <Popover 
                            open={openCustomerSelects[row.id]} 
                            onOpenChange={(open) => setOpenCustomerSelects(prev => ({ ...prev, [row.id]: open }))}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCustomerSelects[row.id]}
                                className="h-8 text-xs border-gray-200 justify-between font-normal w-full"
                                disabled={isUpdatingAssignment === row.id}
                              >
                                <span className="truncate">
                                  {(() => {
                                    const customerId = customerAssignments[row.id] || row.assigned_customer
                                    const productId = productAssignments[row.id] || row.customer_code_id
                                    
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
                                      handleAssignmentUpdate(row.id, 'unassigned', 'no-product')
                                      setOpenCustomerSelects(prev => ({ ...prev, [row.id]: false }))
                                    }}
                                    className="text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
                                        (customerAssignments[row.id] || row.assigned_customer) === 'unassigned' || !row.assigned_customer ? "opacity-100" : "opacity-0"
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
                                          handleAssignmentUpdate(row.id, customer.id, code.id)
                                          setOpenCustomerSelects(prev => ({ ...prev, [row.id]: false }))
                                        }}
                                        className="text-xs"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3 w-3",
                                            (customerAssignments[row.id] || row.assigned_customer) === customer.id && 
                                            (productAssignments[row.id] || row.customer_code_id) === code.id ? "opacity-100" : "opacity-0"
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
                        <TableCell>
                          {row.assigned_at ? new Date(row.assigned_at).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          {row.assigned_customer ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Processed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

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
              disabled={false}
              hasPrevPage={paginationHasPrevPage}
              hasNextPage={paginationHasNextPage}
              recordsPerPageOptions={[25, 50, 100, 200]}
            />
            
            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{totalResultsItems}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{assignedCount}</div>
                  <div className="text-sm text-gray-600">Assigned Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalWeight.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Total Weight (kg)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{rules.filter((r: any) => (r as any).is_active).length}</div>
                  <div className="text-sm text-gray-600">Active Rules</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
