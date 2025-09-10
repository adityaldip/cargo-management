"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Play, ArrowLeft, Filter, RefreshCw } from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { useCustomerRules } from "./hooks"
import { FilterPopup } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"
import { supabase } from "@/lib/supabase"
import { Pagination } from "@/components/ui/pagination"
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
  const [customers, setCustomers] = useState<Customer[]>([])
  
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
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("execute-rules")
  
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
    { key: 'assigned_customer', label: 'Assigned Customer', type: 'text' }
  ]

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (customersError) {
        console.error('Error fetching customers:', customersError)
        return
      }

      setCustomers(customersData || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
    }
  }

  // Fetch cargo data from Supabase - only assigned customers with server-side pagination
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

      // Build base query for assigned customers
      let countQuery = supabase
        .from('cargo_data')
        .select('*', { count: 'exact', head: true })
        .not('assigned_customer', 'is', null)
        .neq('assigned_customer', '')

      let dataQuery = supabase
        .from('cargo_data')
        .select('*')
        .not('assigned_customer', 'is', null)
        .neq('assigned_customer', '')

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

      // Fetch customer data to resolve customer names
      let enrichedCargo: any[] = cargo || []
      if (cargo && cargo.length > 0) {
        // Get unique customer IDs from the cargo data
        const customerIds = [...new Set(cargo.map((record: any) => record.assigned_customer).filter(Boolean))]
        
        if (customerIds.length > 0) {
          const { data: customersData, error: customersError } = await supabase
            .from('customers')
            .select('id, name, code')
            .in('id', customerIds)
          
          if (customersError) {
            console.error('Error fetching customers:', customersError)
          } else {
            // Merge customer data with cargo data
            enrichedCargo = cargo.map((record: any) => {
              const customer = customersData?.find((c: any) => c.id === record.assigned_customer)
              return {
                ...record,
                customers: customer || null
              }
            })
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
    fetchCargoData()
  }, [])

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

  // Note: Filtering is now handled server-side in fetchCargoData


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
              <p className="text-sm text-gray-600">Showing only cargo records with assigned customers</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🔄 Refresh button clicked')
                  try {
                    await fetchCustomers()
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
                  disabled={isApplyingFilters}
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
                    <TableHead className="border bg-yellow-200">Assigned Customer</TableHead>
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
                        {record.customers?.name || record.assigned_customer || 'Unassigned'}
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
                    <TableHead>Assigned Customer</TableHead>
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
                          {row.customers?.name || row.assigned_customer || 'Unassigned'}
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
