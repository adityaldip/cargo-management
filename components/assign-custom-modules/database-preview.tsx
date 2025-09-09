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
import { applyFilters } from "@/lib/filter-utils"
import { generateCSV, prepareReportData, downloadFile, generateFilename, type ExportOptions } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"
import { usePageFilters } from "@/store/filter-store"
import { useWorkflowStore } from "@/store/workflow-store"
import { useDataStore } from "@/store/data-store"
import { useColumnConfigStore, type ColumnConfig } from "@/store/column-config-store"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Pagination } from "@/components/ui/pagination"


interface DatabasePreviewProps {
  onClearData: () => void
}


export function DatabasePreview({ onClearData }: DatabasePreviewProps) {
  // Workflow store
  const { setIsClearingData, shouldStopProcess, setShouldStopProcess, isExporting: globalIsExporting, setIsExporting: setGlobalIsExporting } = useWorkflowStore()
  
  // Data store
  const { clearAllData } = useDataStore()
  
  // Column config store
  const { columnConfigs } = useColumnConfigStore()
  const [realData, setRealData] = useState<CargoData[]>([])
  const [unfilteredData, setUnfilteredData] = useState<CargoData[]>([])
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
  
  // Toast for notifications
  const { toast } = useToast()
  
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
  const loadRealData = async (page: number = currentPage, limit: number = recordsPerPage) => {
    setIsLoadingData(true)
    setRealData([])
    setDataSource("")
    
    if (dataCleared) {
      setIsLoadingData(false)
      return
    }
    
    try {
      // Prepare filters for API
      const filters = hasActiveFilters ? filterConditions : []
      const filterParams = filters.length > 0 ? {
        filters: JSON.stringify(filters),
        filterLogic
      } : {}
      
      const result = await cargoDataOperations.getPaginated({
        page,
        limit: limit,
        search: "",
        sortBy,
        sortOrder,
        ...filterParams
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
        
        // For server-side pagination, store the data directly
        setRealData(convertedData)
        setUnfilteredData(convertedData)
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
        setUnfilteredData([])
        setDataSource("Error loading from database")
        setTotalRecords(0)
        setTotalPages(0)
        setHasNextPage(false)
        setHasPrevPage(false)
      }
    } catch (error) {
      console.error('Error loading real data:', error)
      setRealData([])
      setUnfilteredData([])
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

  // Calculate pagination for server-side data
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + sampleExcelData.length // Use actual data length from server
  const currentRecords = sampleExcelData // Server already returns the correct page data
  
  // Use server pagination values
  const paginationTotalPages = totalPages
  const paginationTotalRecords = totalRecords
  const paginationHasPrevPage = hasPrevPage
  const paginationHasNextPage = hasNextPage

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
    loadRealData(newPage) // Load new page from server
  }

  // Handle records per page change
  const handleRecordsPerPageChange = async (newLimit: number) => {
    setRecordsPerPage(newLimit)
    setCurrentPage(1)
    await loadRealData(1, newLimit) // Pass the new limit directly
    await loadStats()
  }

  const handleClearFilters = () => {
    clearFilters()
    setCurrentPage(1)
    // Reload data without filters
    loadRealData(1)
    loadStats()
  }

  const handleApplyFilters = (conditions: FilterCondition[], logic: "AND" | "OR") => {
    setFilters(conditions, logic)
    setCurrentPage(1)
    // Reload data with new filters
    loadRealData(1)
    loadStats()
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
        setUnfilteredData([])
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

  // Export all data functionality - use global state instead of local
  // const [isExporting, setIsExporting] = useState(false) // Replaced with global state
  const [exportProgress, setExportProgress] = useState(0)
  const [exportCurrentBatch, setExportCurrentBatch] = useState(0)
  const [exportTotalBatches, setExportTotalBatches] = useState(0)

  // Generate custom CSV with configured column order - data only
  const generateCustomCSV = (data: CargoData[], columns: ColumnConfig[]): string => {
    let csv = ""

    // Add headers based on visible columns in order
    const headers = columns.map(col => col.label)
    csv += headers.join(",") + "\n"

    // Add data rows
    data.forEach((record: CargoData) => {
      const row = columns.map(col => {
        const value = formatCellValue(record, col.key)
        return `"${value}"`
      })
      csv += row.join(",") + "\n"
    })

    return csv
  }

  const handleExportData = async () => {
    setGlobalIsExporting(true)
    setExportProgress(0)
    setExportCurrentBatch(0)
    setExportTotalBatches(0)
    
    try {
      console.log(`🔄 Starting export of ${totalRecords} records using batched approach...`)
      
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
        
        const result = await cargoDataOperations.getPaginated({
          page: currentPage,
          limit: batchSize,
          search: "",
          sortBy: "created_at",
          sortOrder: "desc",
          // Include current filters if any
          ...(hasActiveFilters ? {
            filters: JSON.stringify(filterConditions),
            filterLogic
          } : {})
        })
        
        if (result.data && Array.isArray(result.data)) {
          allData.push(...result.data)
          console.log(`📦 Batch ${batch + 1} completed: ${result.data.length} records (Total so far: ${allData.length})`)
        } else {
          console.error(`❌ Failed to fetch batch ${batch + 1}:`, result.error)
          throw new Error(`Failed to fetch batch ${batch + 1}: ${result.error}`)
        }
      }
      
      // Set progress to 100% when all batches are done
      setExportProgress(100)
      console.log(`✅ All batches completed! Total records fetched: ${allData.length}`)

      // Convert API data to CargoData format
      const exportData: CargoData[] = allData.map((record: any) => ({
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

      // Generate CSV content - data only, no summary
      const csvContent = generateCustomCSV(exportData, visibleColumns)
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `cargo_data_export_${timestamp}.csv`
      
      // Download the file
      downloadFile(csvContent, filename, 'text/csv')

      console.log(`✅ Successfully exported ${exportData.length} records to ${filename}`)
      
      // Show success toast
      toast({
        title: "Export Completed! 🎉",
        description: `Successfully exported ${exportData.length.toLocaleString()} records to ${filename}`,
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
      setGlobalIsExporting(false)
      setExportProgress(0)
      setExportCurrentBatch(0)
      setExportTotalBatches(0)
    }
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
                disabled={isClearingData || globalIsExporting}
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
              disabled={isLoadingData || isClearingData || globalIsExporting}
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
                  disabled={isClearingData || globalIsExporting}
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
              onClick={handleExportData}
              className="bg-black text-white"
              size="sm"
              disabled={totalRecords === 0 || isClearingData || globalIsExporting}
            >
              {globalIsExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {globalIsExporting ? 'Exporting...' : 'Export Data'}
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
                  disabled={isClearingData || globalIsExporting}
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
      
      {/* Export Progress Bar Section */}
      {globalIsExporting && (
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Exporting Data...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{exportProgress}%</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${Math.min(100, Math.max(0, exportProgress))}%`,
                  transform: 'translateX(0)'
                }}
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

      {/* Clear Data Progress Bar Section */}
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
              disabled={isClearingData || globalIsExporting}
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
        <Pagination
          currentPage={currentPage}
          totalPages={paginationTotalPages}
          totalRecords={paginationTotalRecords}
          recordsPerPage={recordsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={handlePageChange}
          onRecordsPerPageChange={handleRecordsPerPageChange}
          disabled={isLoadingData || isClearingData || globalIsExporting}
          hasPrevPage={paginationHasPrevPage}
          hasNextPage={paginationHasNextPage}
          recordsPerPageOptions={[25, 50, 100, 200]}
        />
      </CardContent>

    </Card>
    </>
  )
}
