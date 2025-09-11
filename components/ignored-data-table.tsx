"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Eye, 
  EyeOff, 
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react"
import type { ProcessedData, CargoData } from "@/types/cargo-data"
import type { IgnoreRule } from "@/lib/ignore-rules-utils"
import { applyIgnoreRules, applyIgnoreRulesWithConditions } from "@/lib/ignore-rules-utils"
import { useDataStore } from "@/store/data-store"
import { useIgnoreRulesStore } from "@/store/ignore-rules-store"
import { useWorkflowStore } from "@/store/workflow-store"
import type { Database } from "@/types/database"
import { WarningBanner } from "@/components/ui/status-banner"
import { dummyIgnoredData } from "@/lib/dummy-data"
import { combineProcessedData } from "@/lib/file-processor"
import { cargoDataOperations } from "@/lib/supabase-operations"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

// Type for Supabase cargo_data row
type CargoDataRow = Database['public']['Tables']['cargo_data']['Row']

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: number
  order: number
}

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

interface IgnoredDataTableProps {
  originalData?: ProcessedData | null
  ignoreRules: IgnoreRule[]
  onRefresh?: () => void
  onContinue?: () => void
  dataSource?: "mail-agent" | "mail-system"
  onSavingStateChange?: (isSaving: boolean) => void
}


export function IgnoredDataTable({ originalData, ignoreRules, onRefresh, onContinue, dataSource = "mail-system", onSavingStateChange }: IgnoredDataTableProps) {
  const { isBulkDeleting } = useWorkflowStore()
  const { saveMergedDataToSupabase, clearUploadSession } = useDataStore()
  const [ignoredData, setIgnoredData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false)
  const [useDummyData, setUseDummyData] = useState(false)
  
  // Progress tracking state
  const [saveProgress, setSaveProgress] = useState({
    percentage: 0,
    currentCount: 0,
    totalCount: 0,
    currentBatch: 0,
    totalBatches: 0,
    status: '' // 'preparing', 'saving', 'completed', 'error'
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 20
  
  // Zustand store
  const { getConditionsForDataSource } = useIgnoreRulesStore()
  
  // Workflow store for global processing state
  const { setIsProcessing: setGlobalProcessing } = useWorkflowStore()
  
  // Toast hook
  const { toast } = useToast()
  
  // Column configuration state - generated from Supabase schema
  const [columnConfigs] = useState<ColumnConfig[]>(() => 
    createColumnConfigsFromSchema()
  )
  
  // Get only visible columns in order
  const visibleColumns = columnConfigs
    .filter(config => config.visible)
    .sort((a, b) => a.order - b.order)
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentRecords = filteredData.slice(startIndex, endIndex)

  // Helper function to convert CargoData to Supabase format
  const convertCargoDataToSupabase = (cargoData: CargoData) => {
    try {
      return {
        rec_id: cargoData.recordId || '',
        inb_flight_date: cargoData.date || '',
        outb_flight_date: cargoData.outbDate || '',
        des_no: cargoData.desNo || '',
        rec_numb: cargoData.recNumb || '',
        orig_oe: cargoData.origOE || '',
        dest_oe: cargoData.destOE || '',
        inb_flight_no: cargoData.inbFlightNo || '',
        outb_flight_no: cargoData.outbFlightNo || '',
        mail_cat: cargoData.mailCat || '',
        mail_class: cargoData.mailClass || '',
        total_kg: cargoData.totalKg || 0,
        invoice: cargoData.invoiceExtend || '',
        assigned_customer: cargoData.customer || null,
        assigned_rate: cargoData.totalEur || 0,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error converting cargo data to Supabase format:', error, cargoData)
      throw error
    }
  }

  // Custom save function with progress tracking
  const saveMergedDataToSupabaseWithProgress = async (
    dataset: any,
    mailSystemDataset: any,
    onProgress: (progress: any) => void
  ): Promise<{ success: boolean; error?: string; savedCount?: number }> => {
    try {
      console.log('Starting Supabase save process with progress tracking...')

      if (!dataset) {
        return { success: false, error: "No dataset provided" }
      }

      // Combine the datasets
      const datasets = []
      if (dataset) {
        console.log('Adding dataset data:', dataset.data.summary)
        datasets.push(dataset.data)
      }
      if (mailSystemDataset) {
        console.log('Adding mail system data:', mailSystemDataset.data.summary)
        datasets.push(mailSystemDataset.data)
      }
      
      const mergedData = datasets.length > 1 ? combineProcessedData(datasets) : datasets[0]
      console.log('Merged data summary:', mergedData.summary)
      
      // Convert to Supabase format with error handling
      const supabaseData = []
      for (let i = 0; i < mergedData.data.length; i++) {
        try {
          const converted = convertCargoDataToSupabase(mergedData.data[i])
          supabaseData.push(converted)
        } catch (conversionError) {
          console.error(`Error converting record ${i}:`, conversionError, mergedData.data[i])
          continue
        }
      }
      
      console.log(`Converted ${supabaseData.length} records for Supabase`)
      
      if (supabaseData.length === 0) {
        return { success: false, error: "No valid records to save after conversion" }
      }
      
      // Calculate batch information
      const batchSize = 50
      const totalBatches = Math.ceil(supabaseData.length / batchSize)
      
      // Update progress with batch info
      onProgress({
        percentage: 0,
        currentCount: 0,
        totalCount: supabaseData.length,
        currentBatch: 0,
        totalBatches: totalBatches,
        status: 'saving'
      })
      
      // Save to Supabase in batches with progress updates
      let totalSaved = 0
      
      for (let i = 0; i < supabaseData.length; i += batchSize) {
        const batch = supabaseData.slice(i, i + batchSize)
        const currentBatchNum = Math.floor(i/batchSize) + 1
        
        console.log(`Saving batch ${currentBatchNum}/${totalBatches} (${batch.length} records)`)
        
        const result = await cargoDataOperations.bulkInsert(batch)
        
        if (result.error) {
          console.error('Error saving batch to Supabase:', result.error)
          onProgress({
            percentage: Math.round((totalSaved / supabaseData.length) * 100),
            currentCount: totalSaved,
            totalCount: supabaseData.length,
            currentBatch: currentBatchNum,
            totalBatches: totalBatches,
            status: 'error'
          })
          return { 
            success: false, 
            error: `Failed to save batch ${currentBatchNum}: ${result.error}`,
            savedCount: totalSaved 
          }
        }
        
        totalSaved += batch.length
        
        // Update progress
        const percentage = Math.round((totalSaved / supabaseData.length) * 100)
        onProgress({
          percentage: percentage,
          currentCount: totalSaved,
          totalCount: supabaseData.length,
          currentBatch: currentBatchNum,
          totalBatches: totalBatches,
          status: 'saving'
        })
        
        console.log(`Successfully saved batch. Total saved so far: ${totalSaved}`)
        
        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Mark as completed
      onProgress({
        percentage: 100,
        currentCount: totalSaved,
        totalCount: supabaseData.length,
        currentBatch: totalBatches,
        totalBatches: totalBatches,
        status: 'completed'
      })
      
      console.log(`Successfully saved ${totalSaved} records to Supabase`)
      return { 
        success: true, 
        savedCount: totalSaved 
      }
    } catch (error) {
      console.error('Error saving merged data to Supabase:', error)
      onProgress({
        percentage: 0,
        currentCount: 0,
        totalCount: 0,
        currentBatch: 0,
        totalBatches: 0,
        status: 'error'
      })
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
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

  // Handle saving filtered data to Supabase with progress tracking
  const handleContinueToReview = async () => {
    if (!originalData?.data) return

    setIsSavingToSupabase(true)
    setGlobalProcessing(true)
    
    // Notify parent component about saving state change
    onSavingStateChange?.(true)
    
    // Initialize progress
    setSaveProgress({
      percentage: 0,
      currentCount: 0,
      totalCount: 0,
      currentBatch: 0,
      totalBatches: 0,
      status: 'preparing'
    })
    
    // Show starting toast
    toast({
      title: "Starting Data Save...",
      description: "Data is being processed and will be saved to the database.",
      duration: 3000,
    })
    
    // Disable the button immediately to prevent multiple clicks
    const continueButton = document.querySelector('[data-continue-button]') as HTMLButtonElement
    if (continueButton) {
      continueButton.disabled = true
    }
    
    try {
      // Get persisted conditions from Zustand store
      const persistedConditions = getConditionsForDataSource(dataSource)
      
      // Apply ignore rules to get filtered data (excluding ignored records)
      const filteredData = applyIgnoreRulesWithConditions(originalData.data, ignoreRules, persistedConditions)
      
      // Update progress - data preparation complete
      setSaveProgress(prev => ({
        ...prev,
        status: 'saving',
        totalCount: filteredData.length
      }))
      
      // Create filtered ProcessedData
      const filteredProcessedData: ProcessedData = {
        ...originalData,
        data: filteredData,
        summary: {
          totalRecords: filteredData.length,
          totalKg: filteredData.reduce((sum, record) => sum + (record.totalKg || 0), 0),
          euSubtotal: 0,
          nonEuSubtotal: 0,
          total: 0
        }
      }
      
      // Create a dataset for saving to Supabase
      const dataset = {
        id: `filtered-${Date.now()}`,
        name: `Filtered ${dataSource} data`,
        type: dataSource as "mail-agent" | "mail-system",
        data: filteredProcessedData,
        mappings: [],
        timestamp: Date.now(),
        fileName: `filtered-${dataSource}.xlsx`
      }
      
      // Save filtered data to Supabase with progress tracking
      const result = await saveMergedDataToSupabaseWithProgress(dataset, undefined, (progress) => {
        setSaveProgress(progress)
      })
      
      if (result.success) {
        console.log(`✅ Successfully saved ${result.savedCount} filtered records to Supabase (${ignoredData.length} records ignored)`)
        
        // Update progress to completed
        setSaveProgress(prev => ({
          ...prev,
          status: 'completed',
          percentage: 100
        }))
        
        // Show success message after a brief delay to show completion
        setTimeout(() => {
          toast({
            title: "Save data successfully! 🎉",
            description: `${(result.savedCount || 0).toLocaleString()} records successfully saved to database. ${ignoredData.length.toLocaleString()} records ignored according to rules.`,
            duration: 5000,
          })
          
          // Reset persist data only for the current data source
          clearUploadSession(dataSource)
          
          // Call the continue callback
          onContinue?.()
        }, 1000)
      } else {
        console.error('❌ Failed to save filtered data to Supabase:', result.error)
        setSaveProgress(prev => ({
          ...prev,
          status: 'error'
        }))
        toast({
          title: "Failed to Save Data ❌",
          description: `An error occurred while saving data: ${result.error}`,
          variant: "destructive",
          duration: 7000,
        })
      }
    } catch (error) {
      console.error('❌ Error during save operation:', error)
      setSaveProgress(prev => ({
        ...prev,
        status: 'error'
      }))
      toast({
        title: "An Error Occurred ❌",
        description: `Error while saving data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      // Only reset states if not completed (to show completion status briefly)
      if (saveProgress.status !== 'completed') {
        setIsSavingToSupabase(false)
        setGlobalProcessing(false)
        
        // Notify parent component about saving state change
        onSavingStateChange?.(false)
        
        // Re-enable the button
        const continueButton = document.querySelector('[data-continue-button]') as HTMLButtonElement
        if (continueButton) {
          continueButton.disabled = false
        }
      }
    }
  }

  // Handle cleanup after completion
  useEffect(() => {
    if (saveProgress.status === 'completed') {
      const timer = setTimeout(() => {
        setIsSavingToSupabase(false)
        setGlobalProcessing(false)
        
        // Notify parent component about saving state change
        onSavingStateChange?.(false)
        
        // Re-enable the button
        const continueButton = document.querySelector('[data-continue-button]') as HTMLButtonElement
        if (continueButton) {
          continueButton.disabled = false
        }
      }, 2000) // Show completion status for 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [saveProgress.status, onSavingStateChange])

  // Always show dummy data for now
  useEffect(() => {
    setIsLoading(true)
    
    // Always use dummy data
    setUseDummyData(true)
    setIgnoredData(dummyIgnoredData)
    setFilteredData(dummyIgnoredData)
    setCurrentPage(1) // Reset to first page when data changes
    setIsLoading(false)
  }, [])

  const getIgnoredReason = (record: any): string => {
    // For dummy data, return a sample reason
    if (useDummyData) {
      return `Dummy reason: Flight ${record.inbFlightNo} matches ignore rule`
    }
    
    // First check persisted conditions from Zustand store
    const persistedConditions = getConditionsForDataSource(dataSource)
    if (persistedConditions.length > 0) {
        for (const condition of persistedConditions) {
          const recordValue = record.inbFlightNo || ''
          const conditionValues = condition.value.split(',').map((v: string) => v.trim())
          
          switch (condition.operator) {
            case 'equals':
              if (conditionValues.includes(recordValue)) {
                return `Matched condition: ${condition.field} ${condition.operator} "${condition.value}"`
              }
              break
            case 'contains':
              if (conditionValues.some((v: string) => recordValue.includes(v))) {
                return `Matched condition: ${condition.field} ${condition.operator} "${condition.value}"`
              }
              break
            case 'starts_with':
              if (conditionValues.some((v: string) => recordValue.startsWith(v))) {
                return `Matched condition: ${condition.field} ${condition.operator} "${condition.value}"`
              }
              break
            case 'ends_with':
              if (conditionValues.some((v: string) => recordValue.endsWith(v))) {
                return `Matched condition: ${condition.field} ${condition.operator} "${condition.value}"`
              }
              break
          }
        }
    }
    
    // Fallback to checking rules
    for (const rule of ignoreRules) {
      if (!rule.is_active) continue
      
      const recordValue = record.inbFlightNo || ''
      const ruleValues = rule.value.split(',').map(v => v.trim())
      
      switch (rule.operator) {
        case 'equals':
          if (ruleValues.includes(recordValue)) {
            return `Matched rule: "${rule.name}" (${rule.field} ${rule.operator} "${rule.value}")`
          }
          break
        case 'contains':
          if (ruleValues.some(v => recordValue.includes(v))) {
            return `Matched rule: "${rule.name}" (${rule.field} ${rule.operator} "${rule.value}")`
          }
          break
        case 'starts_with':
          if (ruleValues.some(v => recordValue.startsWith(v))) {
            return `Matched rule: "${rule.name}" (${rule.field} ${rule.operator} "${rule.value}")`
          }
          break
        case 'ends_with':
          if (ruleValues.some(v => recordValue.endsWith(v))) {
            return `Matched rule: "${rule.name}" (${rule.field} ${rule.operator} "${rule.value}")`
          }
          break
      }
    }
    return 'No specific rule matched'
  }

  const exportIgnoredData = () => {
    if (filteredData.length === 0) return
    
    const csvContent = [
      // Header
      ['Inb. Flight No.', 'Orig. OE', 'Dest. OE', 'Mail Cat.', 'Mail Class', 'Total kg', 'Reason'].join(','),
      // Data rows
      ...filteredData.map(record => [
        record.inbFlightNo || '',
        record.origOE || '',
        record.destOE || '',
        record.mailCat || '',
        record.mailClass || '',
        record.totalKg || '',
        `"${getIgnoredReason(record)}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ignored-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }


  return (
    <div className="max-w-6xl mx-auto">
      {/* Dummy Data Banner - Top of Card */}
      {useDummyData && (
        <WarningBanner 
          message="This is sample data and not connected to the database yet"
          className="mb-4"
        />
      )}   
      <Card className="bg-white border-gray-200 shadow-sm" style={{ padding:"12px 0px 12px 0px" }}>
        <CardContent>
          <div className="flex items-center justify-between pb-2">
            <CardTitle className="text-black flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Ignored Data
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                  <span className="text-xs">Calculating...</span>
                </div>
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {onContinue && (
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={handleContinueToReview}
                  disabled={isSavingToSupabase || !originalData || isBulkDeleting}
                  data-continue-button
                >
                  {isSavingToSupabase ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    'Continue to Review'
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar - Show only when saving */}
          {isSavingToSupabase && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {saveProgress.status === 'preparing' && 'Preparing data...'}
                  {saveProgress.status === 'saving' && 'Saving to database...'}
                  {saveProgress.status === 'completed' && 'Save completed!'}
                  {saveProgress.status === 'error' && 'An error occurred'}
                </span>
                <span className="text-sm text-gray-600">
                  {saveProgress.percentage}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${saveProgress.percentage}%` }}
                ></div>
              </div>
              
              {/* Progress Details */}
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  {saveProgress.currentCount.toLocaleString()} / {saveProgress.totalCount.toLocaleString()} records
                </span>
                <span>
                  Batch {saveProgress.currentBatch} / {saveProgress.totalBatches}
                </span>
              </div>
            </div>
          )}
          
          {/* Ignored Data Table - Always show */}
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
                  {showDetails && (
                    <TableHead className="border">Reason</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((record, index) => (
                    <TableRow key={`row-${startIndex + index}-${record.id || 'no-id'}`} className="hover:bg-gray-50">
                      {visibleColumns.map((column) => (
                        <TableCell 
                          key={`cell-${startIndex + index}-${column.key}`}
                          className={`border ${column.key === 'assigned_customer' || column.key === 'assigned_rate' ? 'bg-yellow-200' : ''} ${column.key === 'rec_id' || column.key === 'id' ? 'font-mono text-xs' : ''} ${column.key === 'total_kg' || column.key === 'assigned_rate' ? 'text-right' : ''}`}
                        >
                          {column.key === 'inb_flight_no' ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs text-white">
                                Ignored
                              </Badge>
                              <span className="font-medium">{formatCellValue(record, column.key)}</span>
                            </div>
                          ) : (
                            formatCellValue(record, column.key)
                          )}
                        </TableCell>
                      ))}
                      {showDetails && (
                        <TableCell className="border text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={getIgnoredReason(record)}>
                            {getIgnoredReason(record)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + (showDetails ? 1 : 0)} className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No data available</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredData.length}
            recordsPerPage={recordsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            showRecordsPerPage={false}
            showGoToPage={false}
            recordsLabel="ignored records"
          />
        </CardContent>
      </Card>
    </div>
  )
}
