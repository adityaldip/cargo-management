"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, RefreshCw, Download, Filter, Loader2, Trash2 } from "lucide-react"
import { cargoDataOperations } from "@/lib/supabase-operations"
import type { CargoData } from "@/types/cargo-data"
import { FilterPopup, FilterCondition, FilterField } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useDataStore } from "@/store/data-store"
import { useColumnConfigStore, type ColumnConfig } from "@/store/column-config-store"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"


interface DatabasePreviewProps {
  onClearData: () => void
}


export function DatabasePreview({ onClearData }: DatabasePreviewProps) {
  // Workflow store
  const { setIsClearingData, shouldStopProcess, setShouldStopProcess } = useWorkflowStore()
  
  // Data store
  const { clearAllData } = useDataStore()
  
  // Column config store
  const { columnConfigs } = useColumnConfigStore()
  const [realData, setRealData] = useState<CargoData[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataSource, setDataSource] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(50)
  
  // Server-side pagination state
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  // Clear data state
  const [isClearingData, setIsClearingDataLocal] = useState(false)
  const [dataCleared, setDataCleared] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Progress bar state
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>()
  const [clearError, setClearError] = useState<string | undefined>()
  // shouldStopProcess is now managed by workflow store
  const [isStopping, setIsStopping] = useState(false)
  
  
  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("review-merged-excel")
  
  // Statistics state
  const [stats, setStats] = useState({
    totalWeight: 0,
    totalRate: 0,
    recordCount: 0,
    avgWeight: 0,
    avgRate: 0
  })

  // Define filter fields based on column configurations
  const filterFields: FilterField[] = columnConfigs.map(config => ({
    key: config.key,
    label: config.label,
    type: config.key === 'total_kg' || config.key === 'assigned_rate' ? 'number' : 
          config.key.includes('date') ? 'date' : 'text'
  }))

  // Load real data from database with server-side pagination
  const loadRealData = async (page: number = currentPage) => {
    setIsLoadingData(true)
    setRealData([])
    setDataSource("")
    
    if (dataCleared) {
      setIsLoadingData(false)
      return
    }
    
    try {
      const result = await cargoDataOperations.getPaginated({
        page,
        limit: recordsPerPage,
        search: "",
        sortBy,
        sortOrder
      })
      
      if (result.data && Array.isArray(result.data)) {
        const convertedData = result.data.map((record: any) => ({
          id: record.id,
          origOE: record.orig_oe || '',
          destOE: record.dest_oe || '',
          inbFlightNo: record.inb_flight_no || '',
          outbFlightNo: record.outb_flight_no || '',
          mailCat: record.mail_cat || '',
          mailClass: record.mail_class || '',
          totalKg: record.total_kg || 0,
          invoiceExtend: record.invoice || '',
          customer: record.assigned_customer || '',
          date: record.inb_flight_date || '',
          sector: record.orig_oe && record.dest_oe ? `${record.orig_oe}-${record.dest_oe}` : '',
          euromail: record.mail_cat || '',
          combined: record.rec_id || '',
          totalEur: record.assigned_rate || 0,
          vatEur: 0,
          recordId: record.rec_id || '',
          desNo: record.des_no || '',
          recNumb: record.rec_numb || '',
          outbDate: record.outb_flight_date || ''
        }))
        
        setRealData(convertedData)
        setDataSource(`Database (${result.pagination?.total || 0} total records)`)
        setDataCleared(false)
        
        if (result.pagination) {
          setTotalRecords(result.pagination.total)
          setTotalPages(result.pagination.totalPages)
          setHasNextPage(result.pagination.hasNextPage)
          setHasPrevPage(result.pagination.hasPrevPage)
        }
      } else {
        console.error('Error loading data from database:', result.error)
        setRealData([])
        setDataSource("Error loading from database")
        setTotalRecords(0)
        setTotalPages(0)
        setHasNextPage(false)
        setHasPrevPage(false)
      }
    } catch (error) {
      console.error('Error loading real data:', error)
      setRealData([])
      setDataSource("Error loading data")
      setTotalRecords(0)
      setTotalPages(0)
      setHasNextPage(false)
      setHasPrevPage(false)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load statistics from server
  const loadStats = async () => {
    try {
      const result = await cargoDataOperations.getStats("")
      if (result && !result.error) {
        setStats(result)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Use real data with hydration check
  const sampleExcelData = useMemo(() => {
    if (!isHydrated) {
      return []
    }
    const baseData = dataCleared ? [] : realData
    return baseData
  }, [isHydrated, realData, dataCleared])
  
  // Get only visible columns in order
  const visibleColumns = useMemo(() => 
    columnConfigs
      .filter(config => config.visible)
      .sort((a, b) => a.order - b.order),
    [columnConfigs]
  )

  // Calculate pagination
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentRecords = sampleExcelData

  // Format cell values for display
  const formatCellValue = (record: CargoData, key: string): string => {
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
      'assigned_rate': 'totalEur'
    }
    
    const mappedKey = fieldMapping[key] || key
    let value = (record as any)[mappedKey] || (record as any)[key]
    
    if (value === undefined || value === null || value === '') {
      return ''
    }
    
    if (key === 'total_kg' || key === 'assigned_rate') {
      return typeof value === 'number' ? value.toFixed(1) : String(value)
    }
    
    if (key === 'inb_flight_date' || key === 'outb_flight_date' || key === 'processed_at' || key === 'created_at' || key === 'updated_at') {
      if (typeof value === 'string' && value.includes('T')) {
        return new Date(value).toLocaleDateString()
      }
    }
    
    return String(value)
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    loadRealData(newPage)
  }

  const handleClearFilters = () => {
    clearFilters()
    setCurrentPage(1)
    loadRealData(1)
    loadStats()
  }

  const handleApplyFilters = (conditions: FilterCondition[], logic: "AND" | "OR") => {
    setFilters(conditions, logic)
    setCurrentPage(1)
  }

  const handleClearData = async () => {
    setIsClearingDataLocal(true)
    setIsClearingData(true) // Update workflow store
    setProgress(0)
    setClearError(undefined)
    setShouldStopProcess(false)
    setIsStopping(false)
    
    // Estimate time based on total records (rough estimate: 0.1 seconds per record)
    const estimatedTime = Math.max(5, totalRecords * 0.1)
    setEstimatedTimeRemaining(estimatedTime)
    
    try {
      const result = await clearAllData((progress, step, stepIndex, totalSteps) => {
        setProgress(progress)
        setCurrentStep(step)
        setCurrentStepIndex(stepIndex)
        setTotalSteps(totalSteps)
        
        // Update estimated time remaining
        if (progress > 0) {
          const remainingProgress = 100 - progress
          const elapsedTime = estimatedTime * (progress / 100)
          const newEstimatedTime = (remainingProgress / progress) * elapsedTime
          setEstimatedTimeRemaining(Math.max(0, newEstimatedTime))
        }
      }, () => shouldStopProcess)
      
      if (result.success) {
        setDataCleared(true)
        setRealData([])
        setDataSource("")
        setTotalRecords(0)
        setTotalPages(0)
        setHasNextPage(false)
        setHasPrevPage(false)
        
        // Call the original onClearData callback
        await onClearData()
      } else if (result.cancelled) {
        setClearError("Process cancelled by user")
        setDataCleared(false)
        // Refresh data to show current state
        await loadRealData()
        await loadStats()
      } else {
        setClearError(result.error || "Failed to clear data")
        setDataCleared(false)
        // Refresh data to show current state
        await loadRealData()
        await loadStats()
      }
    } catch (error) {
      console.error('Error clearing data:', error)
      setClearError(error instanceof Error ? error.message : "An unknown error occurred")
      setDataCleared(false)
      // Refresh data to show current state
      await loadRealData()
      await loadStats()
    } finally {
      setIsClearingDataLocal(false)
      setIsClearingData(false) // Update workflow store
      setIsStopping(false)
      setShouldStopProcess(false) // Reset stop flag
    }
  }

  const handleStopProcess = () => {
    setIsStopping(true)
    setShouldStopProcess(true)
  }

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      loadRealData(1)
      loadStats()
    }
  }, [isHydrated])

  return (
    <>
      <Card className="bg-white border-gray-200 shadow-sm" style={{ padding:"12px 0px 12px 0px" }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-black">Database Data Preview</CardTitle>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">This preview shows data from the database that will be used for processing</p>
              {/* {dataSource && (
                <Badge variant="secondary" className="text-xs">
                  Source: {dataSource}
                </Badge>
              )} */}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                disabled={isClearingData}
                className={hasActiveFilters ? "border-blue-300 bg-blue-50 text-blue-700" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">
                    {filterConditions.length}
                  </span>
                )}
              </Button>
              
              {isFilterOpen && (
                <FilterPopup
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                  onApply={handleApplyFilters}
                  fields={filterFields}
                  initialConditions={filterConditions}
                  initialLogic={filterLogic}
                  title="Filter Database Data"
                />
              )}
            </div>                  
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setDataCleared(false)
                await loadRealData(currentPage)
                await loadStats()
              }}
              disabled={isLoadingData || isClearingData}
            >
              {isLoadingData ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Data
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isClearingData}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isClearingData ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Clear Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Clear Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to clear all data? This action will delete {totalRecords.toLocaleString()} records from the database and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Clear All Data!
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={() => alert("Excel file would be exported here (demo mode)")}
              className="bg-black text-white"
              size="sm"
              disabled={sampleExcelData.length === 0 || isClearingData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            {hasActiveFilters && (
              <div className="flex gap-2 items-center">
                <Badge variant="secondary" className="text-xs">
                  {filterConditions.length} filter{filterConditions.length !== 1 ? 's' : ''} active
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={isClearingData}
                  className="h-6 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Total Records: <strong className="text-black">{totalRecords.toLocaleString()}</strong></span>
            <span>Total Weight: <strong className="text-black">{stats.totalWeight.toFixed(1)} kg</strong></span>
            <span>Avg Weight: <strong className="text-black">{stats.avgWeight.toFixed(1)} kg</strong></span>
            <span>Total Rate: <strong className="text-black">€{stats.totalRate.toFixed(2)}</strong></span>
          </div>
        </div>
      </CardHeader>
      
      {/* Progress Bar Section */}
      {isClearingData && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Clearing Data...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  transform: 'translateX(0)'
                }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex-1 truncate">{currentStep}</span>
              <div className="flex items-center gap-2">
                {isStopping ? (
                  <span className="text-orange-600 font-medium">Stopping...</span>
                ) : (
                  <button
                    onClick={handleStopProcess}
                    className="text-red-600 hover:text-red-800 underline font-medium"
                    disabled={isStopping}
                  >
                    Stop Process
                  </button>
                )}
              </div>
            </div>
            
            {clearError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {clearError}
              </div>
            )}
          </div>
        </div>
      )}
      
      <CardContent>
        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading data...</span>
          </div>
        ) : sampleExcelData.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              No data found in the database. Upload and process Excel files in the previous steps to see data here.
            </p>
            <Button 
              variant="outline" 
              onClick={async () => {
                setDataCleared(false)
                await loadRealData(1)
                await loadStats()
              }}
              disabled={isClearingData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Loading Data
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="border border-collapse border-radius-lg">
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={`border ${column.key === 'assigned_customer' || column.key === 'assigned_rate' ? 'bg-yellow-200' : ''} ${column.key === 'total_kg' || column.key === 'assigned_rate' ? 'text-right' : ''}`}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record, index) => (
                  <TableRow key={`row-${startIndex + index}-${record.id || 'no-id'}`}>
                    {visibleColumns.map((column) => (
                      <TableCell 
                        key={`cell-${startIndex + index}-${column.key}`}
                        className={`border ${column.key === 'assigned_customer' || column.key === 'assigned_rate' ? 'bg-yellow-200' : ''} ${column.key === 'rec_id' || column.key === 'id' ? 'font-mono text-xs' : ''} ${column.key === 'total_kg' || column.key === 'assigned_rate' ? 'text-right' : ''}`}
                      >
                        {formatCellValue(record, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>
                  Showing <strong className="text-black">{startIndex + 1}</strong> to <strong className="text-black">{Math.min(endIndex, totalRecords)}</strong> of <strong className="text-black">{totalRecords.toLocaleString()}</strong> records
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select 
                  value={recordsPerPage} 
                  onChange={async (e) => {
                    const newLimit = parseInt(e.target.value)
                    setRecordsPerPage(newLimit)
                    setCurrentPage(1)
                    await loadRealData(1)
                    await loadStats()
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  disabled={isLoadingData || isClearingData}
                  aria-label="Records per page"
                  title="Select number of records to show per page"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page)
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  disabled={isLoadingData || isClearingData}
                  aria-label="Go to page number"
                  title="Enter page number to jump to"
                  placeholder="Page"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || isLoadingData || isClearingData}
                  className="px-3"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={!hasPrevPage || isLoadingData || isClearingData}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (currentPage <= 4) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = currentPage - 3 + i
                    }
                    
                    if (pageNum < 1 || pageNum > totalPages) return null
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                        disabled={isLoadingData || isClearingData}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={!hasNextPage || isLoadingData || isClearingData}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || isLoadingData || isClearingData}
                  className="px-3"
                >
                  Last
                </Button>
              </div>
            </div>

          </div>
        )}
      </CardContent>

    </Card>
    </>
  )
}
