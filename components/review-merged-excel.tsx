"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CheckCircle, RefreshCw, Download, Settings, Eye, GripVertical } from "lucide-react"
import { combineProcessedData } from "@/lib/file-processor"
import { ExportModal } from "@/components/export-modal"
import type { ProcessedData } from "@/types/cargo-data"

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

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData, onContinue }: ReviewMergedExcelProps) {
  const [mergedData, setMergedData] = useState<ProcessedData | null>(null)
  const [mergeConflicts, setMergeConflicts] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeStep, setActiveStep] = useState<"preview" | "configure">("configure")
  const recordsPerPage = 20

  // Column configuration state
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([
    { key: 'inbFlightDate', label: 'Inb.Flight Date', visible: true, order: 1 },
    { key: 'outbFlightDate', label: 'Outb.Flight Date', visible: true, order: 2 },
    { key: 'recId', label: 'Rec. ID', visible: true, order: 3 },
    { key: 'desNo', label: 'Des. No.', visible: true, order: 4 },
    { key: 'recNumb', label: 'Rec. Numb.', visible: true, order: 5 },
    { key: 'origOE', label: 'Orig. OE', visible: true, order: 6 },
    { key: 'destOE', label: 'Dest. OE', visible: true, order: 7 },
    { key: 'inbFlightNo', label: 'Inb. Flight No.', visible: true, order: 8 },
    { key: 'outbFlightNo', label: 'Outb. Flight No.', visible: true, order: 9 },
    { key: 'mailCat', label: 'Mail Cat.', visible: true, order: 10 },
    { key: 'mailClass', label: 'Mail Class', visible: true, order: 11 },
    { key: 'totalKg', label: 'Total kg', visible: true, order: 12 },
    { key: 'invoiceExtend', label: 'Invoice', visible: true, order: 13 },
    { key: 'customer', label: 'Customer', visible: true, order: 14 },
    { key: 'rate', label: 'Rate', visible: true, order: 15 },
  ])

  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  // Generate 1000 dummy data entries
  const generateDummyData = () => {
    const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
    const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
    const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
    const mailCats = ["A", "B", "C", "D", "E"]
    const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
    const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
    const customers = [
      "AirMail Limited / ZZXDA14",
      "Express Cargo Inc / YYXBC23", 
      "Global Mail Services / WWXEF45",
      "Priority Post Ltd / VVXGH67",
      "International Freight / UUXIJ89",
      "Euro Mail Express / TTXKL12",
      "Atlantic Cargo Co / SSXMN34",
      "Pacific Mail Group / RRXOP56"
    ]

    const data = []
    for (let i = 1; i <= 1000; i++) {
      const year = 2025
      const month = Math.floor(Math.random() * 12) + 1
      const day = Math.floor(Math.random() * 28) + 1
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
      
      const inbDate = `${year} ${monthNames[month - 1]} ${day.toString().padStart(2, '0')}`
      const outbDate = `${year} ${monthNames[month - 1]} ${(day + 1).toString().padStart(2, '0')}`
      
      const origOE = origins[Math.floor(Math.random() * origins.length)]
      const destOE = destinations[Math.floor(Math.random() * destinations.length)]
      const mailCat = mailCats[Math.floor(Math.random() * mailCats.length)]
      const mailClass = mailClasses[Math.floor(Math.random() * mailClasses.length)]
      
      const desNo = (50700 + Math.floor(Math.random() * 100)).toString()
      const recNumb = (Math.floor(Math.random() * 999) + 1).toString().padStart(3, '0')
      const recId = `${origOE}${destOE}${mailCat}${mailClass}${desNo}${recNumb}${(70000 + Math.floor(Math.random() * 9999)).toString()}`
      
      data.push({
        inbFlightDate: inbDate,
        outbFlightDate: outbDate,
        recId: recId,
        desNo: desNo,
        recNumb: recNumb,
        origOE: origOE,
        destOE: destOE,
        inbFlightNo: flightNos[Math.floor(Math.random() * flightNos.length)],
        outbFlightNo: flightNos[Math.floor(Math.random() * flightNos.length)],
        mailCat: mailCat,
        mailClass: mailClass,
        totalKg: Math.round((Math.random() * 50 + 0.1) * 10) / 10,
        invoiceExtend: invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)],
        customer: "",
        rate: "",
      })
    }
    return data
  }

  const sampleExcelData = useMemo(() => generateDummyData(), [])
  
  // Get all columns in order (no filtering)
  const visibleColumns = useMemo(() => 
    columnConfigs
      .sort((a, b) => a.order - b.order),
    [columnConfigs]
  )
  
  // Calculate pagination
  const totalPages = Math.ceil(sampleExcelData.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentRecords = sampleExcelData.slice(startIndex, endIndex)
  
  // Calculate summary statistics
  const totalWeight = sampleExcelData.reduce((sum, record) => sum + record.totalKg, 0)
  const avgWeight = totalWeight / sampleExcelData.length

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

  useEffect(() => {
    if (mailAgentData || mailSystemData) {
      handleMergeData()
    }
  }, [mailAgentData, mailSystemData])

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
            className={
              activeStep === "configure"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Columns
          </Button>
          <Button
            variant={activeStep === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveStep("preview")}
            className={
              activeStep === "preview"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
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
              <CardTitle className="text-black">Configure Columns</CardTitle>
              <p className="text-sm text-gray-600">
                Customize which columns to display and their order in the Excel export
              </p>
                {/* Column Configuration List */}
                <div className="space-y-1">
                  {columnConfigs.map((config, index) => (
                    <div 
                      key={config.key} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, config.key)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, config.key)}
                      className={`flex items-center gap-4 p-1 border border-gray-200 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                        draggedColumn === config.key ? 'opacity-50' : ''
                      }`}
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
                  <p className="text-sm text-gray-600">Sample of how the exported Excel file will look</p>
                </div>
                <Button
                  onClick={handleExportExcel}
                  className="bg-black text-white"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
              <div className="flex justify-end">
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Total Records: <strong className="text-black">{sampleExcelData.length.toLocaleString()}</strong></span>
                  <span>Total Weight: <strong className="text-black">{totalWeight.toFixed(1)} kg</strong></span>
                  <span>Avg Weight: <strong className="text-black">{avgWeight.toFixed(1)} kg</strong></span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border border-collapse border-radius-lg">
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((column) => (
                        <TableHead 
                          key={column.key}
                          className={`border ${
                            column.key === 'customer' || column.key === 'rate' ? 'bg-yellow-200' : ''
                          } ${column.key === 'totalKg' ? 'text-right' : ''}`}
                        >
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRecords.map((record, index) => (
                      <TableRow key={index}>
                        {visibleColumns.map((column) => (
                          <TableCell 
                            key={column.key}
                            className={`border ${
                              column.key === 'customer' || column.key === 'rate' ? 'bg-yellow-200' : ''
                            } ${column.key === 'recId' ? 'font-mono text-xs' : ''} ${
                              column.key === 'totalKg' ? 'text-right' : ''
                            }`}
                          >
                            {(record as any)[column.key] || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            
            {/* Pagination Controls */}
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
            
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500">
                  This preview shows how your data will appear in the exported Excel file
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button 
            className="bg-black hover:bg-gray-800 text-white"
            onClick={onContinue}
          >
            Continue to Customer Review
          </Button>
        </div>
      </div>
    </div>
  )
}
