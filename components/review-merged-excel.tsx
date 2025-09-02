"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, RefreshCw, Download } from "lucide-react"
import { combineProcessedData } from "@/lib/file-processor"
import { ExportModal } from "@/components/export-modal"
import type { ProcessedData } from "@/types/cargo-data"

interface ReviewMergedExcelProps {
  mailAgentData: ProcessedData | null
  mailSystemData: ProcessedData | null
  onMergedData: (data: ProcessedData | null) => void
  onContinue?: () => void
}

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData, onContinue }: ReviewMergedExcelProps) {
  const [mergedData, setMergedData] = useState<ProcessedData | null>(null)
  const [mergeConflicts, setMergeConflicts] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 20

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
        customer: customers[Math.floor(Math.random() * customers.length)],
        rate: Math.round((Math.random() * 50 + 0.1) * 10) / 10,
      })
    }
    return data
  }

  const sampleExcelData = useMemo(() => generateDummyData(), [])
  
  // Calculate pagination
  const totalPages = Math.ceil(sampleExcelData.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentRecords = sampleExcelData.slice(startIndex, endIndex)
  
  // Calculate summary statistics
  const totalWeight = sampleExcelData.reduce((sum, record) => sum + record.totalKg, 0)
  const avgWeight = totalWeight / sampleExcelData.length

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
      <div className="space-y-2">
        {/* Always show Excel Data Preview section with sample data */}
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
              <table className="w-full text-sm border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Inb.Flight Date</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Outb.Flight Date</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Rec. ID</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Des. No.</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Rec. Numb.</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Orig. OE</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Dest. OE</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Inb. Flight No.</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Outb. Flight No.</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Mail Cat.</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Mail Class</th>
                    <th className="border border-gray-300 p-2 text-right text-black font-medium">Total kg</th>
                    <th className="border border-gray-300 p-2 text-left text-black font-medium">Invoice</th>
                                          <th className="border border-gray-300 p-2 text-left text-black font-medium bg-yellow-200">Customer</th>
                      <th className="border border-gray-300 p-2 text-left text-black font-medium bg-yellow-200">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-gray-900">{record.inbFlightDate}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.outbFlightDate}</td>
                      <td className="border border-gray-300 p-2 text-gray-900 font-mono text-xs">{record.recId}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.desNo}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.recNumb}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.origOE}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.destOE}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.inbFlightNo}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.outbFlightNo}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.mailCat}</td>
                      <td className="border border-gray-300 p-2 text-gray-900">{record.mailClass}</td>
                      <td className="border border-gray-300 p-2 text-right text-gray-900">{record.totalKg}</td>
                                              <td className="border border-gray-300 p-2 text-gray-900">{record.invoiceExtend}</td>
                        <td className="border border-gray-300 p-2 text-gray-900 text-xs bg-yellow-200"></td>
                        <td className="border border-gray-300 p-2 text-gray-900 text-xs bg-yellow-200"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
