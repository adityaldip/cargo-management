"use client"

import { useState, useEffect } from "react"
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
}

export function ReviewMergedExcel({ mailAgentData, mailSystemData, onMergedData }: ReviewMergedExcelProps) {
  const [mergedData, setMergedData] = useState<ProcessedData | null>(null)
  const [mergeConflicts, setMergeConflicts] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const sampleExcelData = [
    {
      inbFlightDate: "2025 JUL 15",
      outbFlightDate: "2025 JUL 16",
      recId: "USFRATUSRIXTA7C50708003700079",
      desNo: "50708",
      recNumb: "003",
      origOE: "USFRAT",
      destOE: "USRIXT",
      inbFlightNo: "BT234",
      outbFlightNo: "BT633",
      mailCat: "A",
      mailClass: "7C",
      totalKg: 7.9,
      invoiceExtend: "Airmail",
      customer: "AirMail Limited / ZZXDA14",
    },
    {
      inbFlightDate: "2025 JUL 08",
      outbFlightDate: "2025 JUL 09",
      recId: "USFRATUSRIXTA7C50705002700062",
      desNo: "50705",
      recNumb: "002",
      origOE: "USFRAT",
      destOE: "USRIXT",
      inbFlightNo: "BT234",
      outbFlightNo: "BT633",
      mailCat: "A",
      mailClass: "7C",
      totalKg: 6.2,
      invoiceExtend: "Airmail",
      customer: "AirMail Limited / ZZXDA14",
    },
    {
      inbFlightDate: "2025 JUL 15",
      outbFlightDate: "2025 JUL 16",
      recId: "USFRATUSRIXTA7C50708005700027",
      desNo: "50708",
      recNumb: "005",
      origOE: "USFRAT",
      destOE: "USRIXT",
      inbFlightNo: "BT234",
      outbFlightNo: "BT633",
      mailCat: "A",
      mailClass: "7C",
      totalKg: 2.7,
      invoiceExtend: "Airmail",
      customer: "AirMail Limited / ZZXDA14",
    },
    {
      inbFlightDate: "2025 JUL 08",
      outbFlightDate: "2025 JUL 09",
      recId: "USFRATUSROMT7C50703001700024",
      desNo: "50703",
      recNumb: "001",
      origOE: "USFRAT",
      destOE: "USROMT",
      inbFlightNo: "BT234",
      outbFlightNo: "BT633",
      mailCat: "A",
      mailClass: "7C",
      totalKg: 2.4,
      invoiceExtend: "Airmail",
      customer: "AirMail Limited / ZZXDA14",
    },
    {
      inbFlightDate: "2025 JUL 15",
      outbFlightDate: "2025 JUL 16",
      recId: "USFRATUSVNOT7C50706001700032",
      desNo: "50706",
      recNumb: "001",
      origOE: "USFRAT",
      destOE: "USVNOT",
      inbFlightNo: "BT234",
      outbFlightNo: "BT341",
      mailCat: "A",
      mailClass: "7C",
      totalKg: 3.2,
      invoiceExtend: "Airmail",
      customer: "AirMail Limited / ZZXDA14",
    },
  ]

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
        const agentRecords = new Set(mailAgentData.data.map((r) => r.recId))
        const systemRecords = new Set(mailSystemData.data.map((r) => r.recId))
        const duplicates = [...agentRecords].filter((id) => systemRecords.has(id))

        if (duplicates.length > 0) {
          conflicts.push(`Found ${duplicates.length} duplicate record IDs between mail agent and mail system data`)
        }

        if (mailAgentData.summary.totalWeight !== mailSystemData.summary.totalWeight) {
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-2">Review Merged Excel Data</h2>
        <p className="text-gray-600">Combine and review data from available sources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mail Agent Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Records: {mailAgentData?.summary.totalRecords || 156}</p>
              <p className="text-sm text-gray-600">Weight: {mailAgentData?.summary.totalWeight || 1247.8} kg</p>
              <p className="text-sm text-gray-600">Value: €{(mailAgentData?.summary.total || 8945.5).toFixed(2)}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                Processed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mail System Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Records: {mailSystemData?.summary.totalRecords || 89}</p>
              <p className="text-sm text-gray-600">Weight: {mailSystemData?.summary.totalWeight || 678.3} kg</p>
              <p className="text-sm text-gray-600">Value: €{(mailSystemData?.summary.total || 4567.25).toFixed(2)}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                Processed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {canProcess && !hasData && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleMergeData} disabled={isProcessing}>
              {isProcessing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Process Available Data
            </Button>
          </CardContent>
        </Card>
      )}

      {mergeConflicts.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Merge Conflicts Detected:</strong>
            <ul className="mt-2 space-y-1">
              {mergeConflicts.map((conflict, index) => (
                <li key={index} className="text-sm">
                  • {conflict}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {hasData && mergedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{mergedData.summary.totalRecords}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{mergedData.summary.totalWeight} kg</div>
                  <div className="text-sm text-gray-600">Total Weight</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">
                    €{(mergedData.summary.euSubtotal || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">EU Subtotal</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">€{(mergedData.summary.total || 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-black">Merged Data Preview</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
                  {mergedData.summary.totalRecords} records
                </Badge>
                {/* Added export excel button */}
                <Button onClick={handleExportExcel} className="bg-black hover:bg-gray-800 text-white" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
                <ExportModal data={mergedData} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 text-black font-medium">Inb.Flight Date</th>
                      <th className="text-left p-2 text-black font-medium">Outb.Flight Date</th>
                      <th className="text-left p-2 text-black font-medium">Rec. ID</th>
                      <th className="text-left p-2 text-black font-medium">Des. No.</th>
                      <th className="text-left p-2 text-black font-medium">Rec. Numb.</th>
                      <th className="text-left p-2 text-black font-medium">Orig. OE</th>
                      <th className="text-left p-2 text-black font-medium">Dest. OE</th>
                      <th className="text-left p-2 text-black font-medium">Inb. Flight No.</th>
                      <th className="text-left p-2 text-black font-medium">Outb. Flight No.</th>
                      <th className="text-left p-2 text-black font-medium">Mail Cat.</th>
                      <th className="text-left p-2 text-black font-medium">Mail Class</th>
                      <th className="text-right p-2 text-black font-medium">Total kg</th>
                      <th className="text-left p-2 text-black font-medium">Invoice</th>
                      <th className="text-left p-2 text-black font-medium">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedData.data.slice(0, 15).map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 text-gray-900">{record.inbFlightDate || "-"}</td>
                        <td className="p-2 text-gray-900">{record.outbFlightDate || "-"}</td>
                        <td className="p-2 text-gray-900 font-mono text-xs">{record.recId || "-"}</td>
                        <td className="p-2 text-gray-900">{record.desNo || "-"}</td>
                        <td className="p-2 text-gray-900">{record.recNumb || "-"}</td>
                        <td className="p-2 text-gray-900">{record.origOE || "-"}</td>
                        <td className="p-2 text-gray-900">{record.destOE || "-"}</td>
                        <td className="p-2 text-gray-900">{record.inbFlightNo || "-"}</td>
                        <td className="p-2 text-gray-900">{record.outbFlightNo || "-"}</td>
                        <td className="p-2 text-gray-900">{record.mailCat}</td>
                        <td className="p-2 text-gray-900">{record.mailClass || "-"}</td>
                        <td className="p-2 text-right text-gray-900">{(record.totalKg || 0).toFixed(1)}</td>
                        <td className="p-2 text-gray-900">{record.invoiceExtend || "-"}</td>
                        <td className="p-2 text-gray-900 text-xs">{record.customer || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mergedData.data.length > 15 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Showing 15 of {mergedData.data.length} records
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Added Excel Data Preview section with sample data */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-black">Excel Data Preview</CardTitle>
              <p className="text-sm text-gray-600">Sample of how the exported Excel file will look</p>
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
                      <th className="border border-gray-300 p-2 text-left text-black font-medium">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleExcelData.map((record, index) => (
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
                        <td className="border border-gray-300 p-2 text-gray-900 text-xs">{record.customer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  This preview shows how your data will appear in the exported Excel file
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-black hover:bg-gray-800 text-white">Continue to Customer Review</Button>
          </div>
        </div>
      )}
    </div>
  )
}
