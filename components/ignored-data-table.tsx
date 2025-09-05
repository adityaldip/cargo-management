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
import { saveMergedDataToSupabase } from "@/lib/storage-utils"
import { useIgnoreRulesStore } from "@/store/ignore-rules-store"
import type { Database } from "@/types/database"

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
}

export function IgnoredDataTable({ originalData, ignoreRules, onRefresh, onContinue, dataSource = "mail-system" }: IgnoredDataTableProps) {
  const [ignoredData, setIgnoredData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false)
  
  // Zustand store
  const { getConditionsForDataSource } = useIgnoreRulesStore()
  
  // Column configuration state - generated from Supabase schema
  const [columnConfigs] = useState<ColumnConfig[]>(() => 
    createColumnConfigsFromSchema()
  )
  
  // Get only visible columns in order
  const visibleColumns = columnConfigs
    .filter(config => config.visible)
    .sort((a, b) => a.order - b.order)

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

  // Handle saving filtered data to Supabase
  const handleContinueToReview = async () => {
    if (!originalData?.data) return

    setIsSavingToSupabase(true)
    
    try {
      // Get persisted conditions from Zustand store
      const persistedConditions = getConditionsForDataSource(dataSource)
      
      // Apply ignore rules to get filtered data (excluding ignored records)
      const filteredData = applyIgnoreRulesWithConditions(originalData.data, ignoreRules, persistedConditions)
      
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
      
      // Save filtered data to Supabase
      const result = await saveMergedDataToSupabase(dataset, undefined)
      
      if (result.success) {
        console.log(`✅ Successfully saved ${result.savedCount} filtered records to Supabase (${ignoredData.length} records ignored)`)
        alert(`Data saved successfully!\n- ${result.savedCount} records saved to database\n- ${ignoredData.length} records ignored and excluded`)
        
        // Call the continue callback
        onContinue?.()
      } else {
        console.error('❌ Failed to save filtered data to Supabase:', result.error)
        alert(`Failed to save data: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Error during save operation:', error)
      alert(`Error saving data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSavingToSupabase(false)
    }
  }

  // Calculate ignored data when rules or original data change
  useEffect(() => {
    if (!originalData?.data) {
      setIgnoredData([])
      setFilteredData([])
      return
    }

    setIsLoading(true)
    
    try {
      // Get persisted conditions from Zustand store
      const persistedConditions = getConditionsForDataSource(dataSource)
      
      // Apply ignore rules with persisted conditions
      const filtered = applyIgnoreRulesWithConditions(originalData.data, ignoreRules, persistedConditions)
      
      // Calculate ignored data (original - filtered)
      const ignored = originalData.data.filter(originalRecord => 
        !filtered.some(filteredRecord => filteredRecord.id === originalRecord.id)
      )
      
      setIgnoredData(ignored)
      setFilteredData(ignored) // Initially show all ignored data
    } catch (error) {
      console.error('Error calculating ignored data:', error)
      setIgnoredData([])
      setFilteredData([])
    } finally {
      setIsLoading(false)
    }
  }, [originalData, ignoreRules, dataSource])

  const getIgnoredReason = (record: any): string => {
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

  const activeRulesCount = ignoreRules.filter(rule => rule.is_active).length
  const totalRecords = originalData?.data.length || 0
  const ignoredCount = ignoredData.length
  const remainingCount = totalRecords - ignoredCount

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
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
              {/* <Button 
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="border-gray-300 hover:bg-gray-50"
              >
                {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              <Button 
                variant="outline"
                onClick={exportIgnoredData}
                disabled={filteredData.length === 0}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {onRefresh && (
                <Button 
                  variant="outline"
                  onClick={onRefresh}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )} */}
              {onContinue && (
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={handleContinueToReview}
                  disabled={isSavingToSupabase || !originalData}
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
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalRecords}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Ignored</p>
                  <p className="text-2xl font-semibold text-red-900">{ignoredCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Remaining</p>
                  <p className="text-2xl font-semibold text-green-900">{remainingCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Active Rules</p>
                  <p className="text-2xl font-semibold text-blue-900">{activeRulesCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* No Data State */}
          {!originalData && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No data uploaded yet</p>
              <p className="text-gray-400 text-sm mt-1">Upload and process Mail System data to see ignored records</p>
            </div>
          )}

          {/* No Ignored Data */}
          {originalData && ignoredData.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
              <p className="text-gray-500">No records ignored</p>
              <p className="text-gray-400 text-sm mt-1">All records passed the ignore rules</p>
            </div>
          )}

          {/* Ignored Data Table */}
          {originalData && ignoredData.length > 0 && (
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
                  {filteredData.map((record, index) => (
                    <TableRow key={`row-${index}-${record.id || 'no-id'}`} className="hover:bg-gray-50">
                      {visibleColumns.map((column) => (
                        <TableCell 
                          key={`cell-${index}-${column.key}`}
                          className={`border ${column.key === 'assigned_customer' || column.key === 'assigned_rate' ? 'bg-yellow-200' : ''} ${column.key === 'rec_id' || column.key === 'id' ? 'font-mono text-xs' : ''} ${column.key === 'total_kg' || column.key === 'assigned_rate' ? 'text-right' : ''}`}
                        >
                          {column.key === 'inb_flight_no' ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs">
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Info */}
          {filteredData.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {filteredData.length} of {ignoredData.length} ignored records
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
