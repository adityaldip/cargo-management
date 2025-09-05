"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, RefreshCw, Download, Settings, Eye, GripVertical, Loader2, Trash2, Filter } from "lucide-react"
import { combineProcessedData } from "@/lib/file-processor"
import { getCurrentSession, clearAllData } from "@/lib/storage-utils"
import type { ProcessedData, CargoData } from "@/types/cargo-data"
import type { Database } from "@/types/database"
import { FilterPopup, FilterCondition, FilterField } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"

interface ReviewMergedExcelProps {
  mailAgentData: ProcessedData | null
  mailSystemData: ProcessedData | null
  onMergedData: (data: ProcessedData | null) => void
  onContinue?: () => void
}

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: number
  order: number
}

// Type for Supabase cargo_data row
type CargoDataRow = Database['public']['Tables']['cargo_data']['Row']

// Function to create column configurations from Supabase schema
const createColumnConfigsFromSchema = (): ColumnConfig[] => {
  // Map database column names to user-friendly labels
  const columnLabels: Partial<Record<keyof CargoDataRow, string>> = {
    id: 'Record ID.',
    rec_id: 'Rec. ID.',
    inb_flight_date: 'Inb. Flight Date.',
    outb_flight_date: 'Outb. Flight Date.', 
    des_no: 'Des. No.',
    rec_numb: 'Rec. Number.',
    orig_oe: 'Orig. OE.',
    dest_oe: 'Dest. OE.',
    inb_flight_no: 'Inb. Flight No.',
    outb_flight_no: 'Outb. Flight No.',
    mail_cat: 'Mail Category.',
    mail_class: 'Mail Class.',
    total_kg: 'Total Weight (kg).',
    invoice: 'Invoice.',
    assigned_customer: 'Customer.',
    assigned_rate: 'Rate.',
  }

  // Define column order and visibility
  const columnOrder: Array<{ key: keyof CargoDataRow; visible: boolean }> = [
    { key: 'inb_flight_date', visible: true },
    { key: 'outb_flight_date', visible: true },
    { key: 'rec_id', visible: true },
    { key: 'des_no', visible: true },
    { key: 'rec_numb', visible: true },
    { key: 'orig_oe', visible: true },
    { key: 'dest_oe', visible: true },
    { key: 'inb_flight_no', visible: true },
    { key: 'outb_flight_no', visible: true },
    { key: 'mail_cat', visible: true },
    { key: 'mail_class', visible: true },
    { key: 'total_kg', visible: true },
    { key: 'invoice', visible: true },
    { key: 'assigned_customer', visible: true },
    { key: 'assigned_rate', visible: true },
  ]

  return columnOrder.map((col, index) => ({
    key: col.key,
    label: columnLabels[col.key] || col.key,
    visible: col.visible,
    order: index + 1
  }))
}

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData, onContinue }: ReviewMergedExcelProps) {
  const [mergedData, setMergedData] = useState<ProcessedData | null>(null)
  const [mergeConflicts, setMergeConflicts] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeStep, setActiveStep] = useState<"preview" | "configure">("configure")
  const recordsPerPage = 20

  // Column configuration state - generated from Supabase schema
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => 
    createColumnConfigsFromSchema()
  )

  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [realData, setRealData] = useState<CargoData[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataSource, setDataSource] = useState<string>("")
  
  // Clear data state
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)
  
  // Track if data has been intentionally cleared
  const [dataCleared, setDataCleared] = useState(false)
  
  // Track if component has hydrated to prevent hydration mismatch
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("review-merged-excel")
  
  // Define filter fields based on column configurations
  const filterFields: FilterField[] = columnConfigs.map(config => ({
    key: config.key,
    label: config.label,
    type: config.key === 'total_kg' || config.key === 'assigned_rate' ? 'number' : 
          config.key.includes('date') ? 'date' : 'text'
  }))

  // Load real data from current session or merged data
  const loadRealData = () => {
    setIsLoadingData(true)
    setRealData([]) // Clear existing data first
    setDataSource("")
    
    // If data has been intentionally cleared, don't load anything
    if (dataCleared) {
      setIsLoadingData(false)
      return
    }
    
    try {
      // First check if we have merged data
      if (mergedData) {
        setRealData(mergedData.data)
        setDataSource("Merged Data")
        setDataCleared(false) // Reset cleared flag when data is found
        return
      }

      // Then check current session
      const currentSession = getCurrentSession()
      if (currentSession) {
        const datasets = []
        let sourceName = ""
        
        if (currentSession.mailAgent) {
          datasets.push(currentSession.mailAgent.data)
          sourceName = "Mail Agent"
        }
        
        if (currentSession.mailSystem) {
          datasets.push(currentSession.mailSystem.data)
          sourceName = sourceName ? `${sourceName} + Mail System` : "Mail System"
        }
        
        if (datasets.length > 0) {
          const combined = datasets.length > 1 ? combineProcessedData(datasets) : datasets[0]
          // Ensure unique IDs for all records - use stable IDs to prevent hydration mismatch
          const dataWithUniqueIds = combined.data.map((record, index) => ({
            ...record,
            id: record.id || `session-${index}`
          }))
          setRealData(dataWithUniqueIds)
          setDataSource(sourceName)
          setDataCleared(false) // Reset cleared flag when data is found
        }
      }
      
      // Fallback to prop data if no session data
      if (realData.length === 0) {
        if (mailAgentData && mailSystemData) {
          const combined = combineProcessedData([mailAgentData, mailSystemData])
          const dataWithUniqueIds = combined.data.map((record, index) => ({
            ...record,
            id: record.id || `props-${index}`
          }))
          setRealData(dataWithUniqueIds)
          setDataSource("Mail Agent + Mail System")
          setDataCleared(false) // Reset cleared flag when data is found
        } else if (mailAgentData) {
          const dataWithUniqueIds = mailAgentData.data.map((record, index) => ({
            ...record,
            id: record.id || `agent-${index}`
          }))
          setRealData(dataWithUniqueIds)
          setDataSource("Mail Agent Only")
          setDataCleared(false) // Reset cleared flag when data is found
        } else if (mailSystemData) {
          const dataWithUniqueIds = mailSystemData.data.map((record, index) => ({
            ...record,
            id: record.id || `system-${index}`
          }))
          setRealData(dataWithUniqueIds)
          setDataSource("Mail System Only")
          setDataCleared(false) // Reset cleared flag when data is found
        }
      }
    } catch (error) {
      console.error('Error loading real data:', error)
      setRealData([]) // Clear data on error
      setDataSource("Error loading data")
    } finally {
      setIsLoadingData(false)
    }
  }

  // Apply filters to the data
  const applyFilters = (data: CargoData[], conditions: FilterCondition[], logic: "AND" | "OR"): CargoData[] => {
    if (conditions.length === 0) return data

    return data.filter(record => {
      const conditionResults = conditions.map(condition => {
        const value = formatCellValue(record, condition.field).toLowerCase()
        const filterValue = condition.value.toLowerCase()

        switch (condition.operator) {
          case "equals":
            return value === filterValue
          case "contains":
            return value.includes(filterValue)
          case "starts_with":
            return value.startsWith(filterValue)
          case "ends_with":
            return value.endsWith(filterValue)
          case "greater_than":
            return parseFloat(value) > parseFloat(filterValue)
          case "less_than":
            return parseFloat(value) < parseFloat(filterValue)
          case "not_empty":
            return value.trim() !== ""
          case "is_empty":
            return value.trim() === ""
          default:
            return false
        }
      })

      return logic === "OR" 
        ? conditionResults.some(result => result)
        : conditionResults.every(result => result)
    })
  }

  // Use real data instead of dummy data, but respect cleared state and apply filters
  // Prevent hydration mismatch by ensuring consistent initial state
  const sampleExcelData = useMemo(() => {
    if (!isHydrated) {
      // Before hydration, always return empty array to prevent hydration mismatch
      return []
    }
    const baseData = dataCleared ? [] : realData
    return applyFilters(baseData, filterConditions, filterLogic)
  }, [isHydrated, realData, dataCleared, filterConditions, filterLogic])
  
  // Get only visible columns in order
  const visibleColumns = useMemo(() => 
    columnConfigs
      .filter(config => config.visible)
      .sort((a, b) => a.order - b.order),
    [columnConfigs]
  )

  // Get only visible columns for configuration
  const configColumns = useMemo(() => 
    columnConfigs.filter(config => config.visible).sort((a, b) => a.order - b.order),
    [columnConfigs]
  )
  
  // Calculate pagination
  const totalPages = Math.ceil(sampleExcelData.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentRecords = sampleExcelData.slice(startIndex, endIndex)
  
  // Calculate summary statistics - prevent hydration mismatch
  const totalWeight = useMemo(() => {
    if (!isHydrated || sampleExcelData.length === 0) return 0
    return sampleExcelData.reduce((sum, record) => sum + record.totalKg, 0)
  }, [isHydrated, sampleExcelData])
  
  const avgWeight = useMemo(() => {
    if (!isHydrated || sampleExcelData.length === 0) return 0
    return totalWeight / sampleExcelData.length
  }, [isHydrated, totalWeight, sampleExcelData.length])

  // Column configuration handlers (visibility toggle removed)

  const updateColumnLabel = (key: string, label: string) => {
    setColumnConfigs(prev => 
      prev.map(config => 
        config.key === key ? { ...config, label } : config
      )
    )
  }


  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault()
    
    if (!draggedColumn || draggedColumn === targetColumnKey) return

    const draggedIndex = columnConfigs.findIndex(c => c.key === draggedColumn)
    const targetIndex = columnConfigs.findIndex(c => c.key === targetColumnKey)
    
    const newConfigs = [...columnConfigs]
    const [draggedItem] = newConfigs.splice(draggedIndex, 1)
    newConfigs.splice(targetIndex, 0, draggedItem)
    
    // Update order values based on new positions
    const updatedConfigs = newConfigs.map((config, index) => ({
      ...config,
      order: index + 1
    }))
    
    setColumnConfigs(updatedConfigs)
    setDraggedColumn(null)
  }

  const handleExportExcel = () => {
    // Demo function - just shows alert
    alert("Excel file would be exported here (demo mode)")
  }

  const handleApplyFilters = (conditions: FilterCondition[], logic: "AND" | "OR") => {
    setFilters(conditions, logic)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    clearFilters()
    setCurrentPage(1)
  }

  const handleClearData = async () => {
    setIsClearingData(true)
    setShowClearConfirm(false)
    
    // Immediately clear UI state to hide data from table
    setDataCleared(true)
    setRealData([])
    setDataSource("")
    setMergedData(null)
    setMergeConflicts([])
    onMergedData(null)
    
    try {
      const result = await clearAllData()
      
      if (result.success) {
        console.log(`✅ Successfully cleared all data:`)
        console.log(`- Local storage: ${result.localCleared ? 'cleared' : 'failed'}`)
        console.log(`- Supabase: ${result.supabaseDeletedCount || 0} records deleted`)
        
        alert(`Data cleared successfully!\n- Local storage cleared\n- ${result.supabaseDeletedCount || 0} records deleted from database`)
      } else {
        console.error('❌ Failed to clear all data:', result.error)
        alert(`Failed to clear data: ${result.error}`)
        // If clearing failed, try to reload data
        setDataCleared(false)
        loadRealData()
      }
    } catch (error) {
      console.error('❌ Error during clear operation:', error)
      alert(`Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // If clearing failed, try to reload data
      setDataCleared(false)
      loadRealData()
    } finally {
      setIsClearingData(false)
    }
  }

  // Format cell values for display
  const formatCellValue = (record: CargoData, key: string): string => {
    // Map CargoData fields to Supabase fields for compatibility
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
    
    // Try to get value using mapped field name first, then original key
    const mappedKey = fieldMapping[key] || key
    let value = (record as any)[mappedKey] || (record as any)[key]
    
    if (value === undefined || value === null || value === '') {
      return ''
    }
    
    // Format numeric values
    if (key === 'total_kg' || key === 'assigned_rate') {
      return typeof value === 'number' ? value.toFixed(1) : String(value)
    }
    
    // Format dates
    if (key === 'inb_flight_date' || key === 'outb_flight_date' || key === 'processed_at' || key === 'created_at' || key === 'updated_at') {
      if (typeof value === 'string' && value.includes('T')) {
        return new Date(value).toLocaleDateString()
      }
    }
    
    return String(value)
  }

  useEffect(() => {
    if (mailAgentData || mailSystemData) {
      handleMergeData()
    }
  }, [mailAgentData, mailSystemData])

  useEffect(() => {
    // Mark as hydrated on client side
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Only load data after hydration to prevent hydration mismatch
    if (isHydrated) {
      loadRealData()
    }
  }, [isHydrated, mergedData, mailAgentData, mailSystemData])

  const handleMergeData = async () => {
    if (!mailAgentData && !mailSystemData) return

    setIsProcessing(true)

    try {
      let combined: ProcessedData
      if (mailAgentData && mailSystemData) {
        combined = combineProcessedData([mailAgentData, mailSystemData])
      } else if (mailAgentData) {
        combined = mailAgentData
      } else {
        combined = mailSystemData!
      }

      const conflicts: string[] = []

      if (mailAgentData && mailSystemData) {
        const agentRecords = new Set(mailAgentData.data.map((r) => r.id))
        const systemRecords = new Set(mailSystemData.data.map((r) => r.id))
        const duplicates = [...agentRecords].filter((id) => systemRecords.has(id))

        if (duplicates.length > 0) {
          conflicts.push(`Found ${duplicates.length} duplicate record IDs between mail agent and mail system data`)
        }

        if (mailAgentData.summary.totalKg !== mailSystemData.summary.totalKg) {
          conflicts.push("Total weight differs between mail agent and mail system data")
        }
      } else {
        const sourceType = mailAgentData ? "mail agent" : "mail system"
        conflicts.push(`Processing with ${sourceType} data only. No merge conflicts to check.`)
      }

      setMergedData(combined)
      setMergeConflicts(conflicts)
      setDataCleared(false) // Reset cleared flag when new data is merged
      onMergedData(combined)
    } catch (error) {
      console.error("Error merging data:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const canProcess = mailAgentData || mailSystemData
  const hasData = mergedData !== null

  return (
    <div className="space-y-4 pt-2">
      {/* Header Navigation */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeStep === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveStep("configure")}
            className={activeStep === "configure" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Columns
          </Button>
          <Button
            variant={activeStep === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveStep("preview")}
            className={activeStep === "preview" ? "bg-white shadow-sm text-black hover:bg-white" : "text-gray-600 hover:text-black hover:bg-gray-50"}
          >
            <Eye className="h-4 w-4 mr-2" />
            Excel Preview
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Configure Columns section */}
        {activeStep === "configure" && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-black">Configure Columns</CardTitle>
                    <p className="text-sm text-gray-600">
                      Customize which columns to display and their order in the Excel export
                    </p>
                    {/* <div className="mt-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={showAllColumns}
                          onChange={(e) => setShowAllColumns(e.target.checked)}
                          className="rounded"
                        />
                        Show all columns (including hidden)
                      </label>
                    </div> */}
                  </div>
                  <div className="flex gap-2">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={loadColumnConfigsFromSupabase}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Load from DB
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveColumnConfigsToSupabase}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Download className="w-4 h-4 mr-2 rotate-180" />
                      Save to DB
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetColumnConfigs}
                      className="text-gray-600 hover:text-black"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset to Default
                    </Button> */}
                  </div>
                </div>
                {/* Column Configuration List */}
                <div className="space-y-1">
                  {configColumns.map((config, index) => (
                    <div 
                      key={config.key} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, config.key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, config.key)}
                      className={`flex items-center gap-4 p-1 border border-gray-200 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${draggedColumn === config.key ? 'opacity-50' : ''}`}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab hover:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>
                      {/* Column Label Input */}
                      <div className="flex-1">
                        <Input
                          value={config.label}
                          onChange={(e) => updateColumnLabel(config.key, e.target.value)}
                          className="text-sm"
                          placeholder="Column label"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Excel Data Preview section */}
        {activeStep === "preview" && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-black">Excel Data Preview</CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">This preview shows how your data will appear in the exported Excel file</p>
                    {dataSource && (
                      <Badge variant="secondary" className="text-xs">
                        Source: {dataSource}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
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
                    
                    {/* Filter Popup */}
                    {isFilterOpen && (
                      <FilterPopup
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        onApply={handleApplyFilters}
                        fields={filterFields}
                        initialConditions={filterConditions}
                        initialLogic={filterLogic}
                        title="Filter Excel Data"
                      />
                    )}
                  </div>                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDataCleared(false) // Reset cleared flag to allow data loading
                      loadRealData()
                    }}
                    disabled={isLoadingData}
                  >
                    {isLoadingData ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
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
                <Button
                  onClick={handleExportExcel}
                  className="bg-black text-white"
                  size="sm"
                    disabled={sampleExcelData.length === 0}
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
                        className="h-6 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  {hasActiveFilters && (
                    <span>Filtered: <strong className="text-black">{sampleExcelData.length.toLocaleString()}</strong> / <strong className="text-gray-500">{realData.length.toLocaleString()}</strong></span>
                  )}
                  {!hasActiveFilters && (
                    <span>Total Records: <strong className="text-black">{sampleExcelData.length.toLocaleString()}</strong></span>
                  )}
                  <span>Total Weight: <strong className="text-black">{totalWeight.toFixed(1)} kg</strong></span>
                  <span>Avg Weight: <strong className="text-black">{avgWeight.toFixed(1)} kg</strong></span>
                </div>
              </div>
            </CardHeader>
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
                    Please upload and process Excel files in the previous steps to see data here.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setDataCleared(false) // Reset cleared flag to allow data loading
                    loadRealData()
                  }}>
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
            {sampleExcelData.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, sampleExcelData.length)} of {sampleExcelData.length.toLocaleString()} records
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i
                    if (pageNum > totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
            )}
            
              <div className="mt-2 text-center">
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button 
            className="bg-black hover:bg-gray-800 text-white"
            onClick={onContinue}
          >
            Continue to Assign Customers
          </Button>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clear All Data</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                <li>All uploaded Excel files from local storage</li>
                <li>All processed cargo data from the database</li>
                <li>Current session data and mappings</li>
              </ul>
              <p className="text-red-600 text-sm mt-3 font-medium">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearingData}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearData}
                disabled={isClearingData}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isClearingData ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
