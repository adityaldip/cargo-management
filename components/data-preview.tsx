"use client"

import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, XCircle } from "lucide-react"
import { ExportModal } from "@/components/export-modal"

interface DataPreviewProps {
  processedData: ProcessedData
  onDownloadReport: () => void
}

export function DataPreview({ processedData, onDownloadReport }: DataPreviewProps) {
  const { data, missingFields, warnings, summary } = processedData

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{summary.euSubtotal.toFixed(2)} EUR</div>
              <div className="text-sm text-gray-400">EU Subtotal</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-300">{summary.nonEuSubtotal.toFixed(2)} EUR</div>
              <div className="text-sm text-gray-400">NON-EU Subtotal</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{summary.total.toFixed(2)} EUR</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings and Missing Data */}
      {(missingFields.length > 0 || warnings.length > 0) && (
        <div className="space-y-3">
          {missingFields.length > 0 && (
            <Alert className="border-red-500/50 bg-red-900/20">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <strong>Missing Data ({missingFields.length} issues):</strong>
                <ul className="mt-2 space-y-1">
                  {missingFields.slice(0, 3).map((field, index) => (
                    <li key={index} className="text-sm">
                      • {field}
                    </li>
                  ))}
                  {missingFields.length > 3 && (
                    <li className="text-sm text-red-400">• ... and {missingFields.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert className="border-yellow-500/50 bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                <strong>Warnings ({warnings.length} issues):</strong>
                <ul className="mt-2 space-y-1">
                  {warnings.slice(0, 3).map((warning, index) => (
                    <li key={index} className="text-sm">
                      • {warning}
                    </li>
                  ))}
                  {warnings.length > 3 && (
                    <li className="text-sm text-yellow-400">• ... and {warnings.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Data Table */}
      <Card className="bg-black border-orange-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-orange-500">Data Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              {summary.totalRecords} records
            </Badge>
            <ExportModal data={processedData} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-500/20">
                  <th className="text-left p-2 text-orange-300">Inb.Flight Date</th>
                  <th className="text-left p-2 text-orange-300">Outb.Flight Date</th>
                  <th className="text-left p-2 text-orange-300">Rec. ID</th>
                  <th className="text-left p-2 text-orange-300">Des. No.</th>
                  <th className="text-left p-2 text-orange-300">Rec. Numb.</th>
                  <th className="text-left p-2 text-orange-300">Orig. OE</th>
                  <th className="text-left p-2 text-orange-300">Dest. OE</th>
                  <th className="text-left p-2 text-orange-300">Inb. Flight No. | STA</th>
                  <th className="text-left p-2 text-orange-300">Outb. Flight No. | STD</th>
                  <th className="text-left p-2 text-orange-300">Mail Cat.</th>
                  <th className="text-left p-2 text-orange-300">Mail Class</th>
                  <th className="text-right p-2 text-orange-300">Total kg</th>
                  <th className="text-left p-2 text-orange-300">Invoice</th>
                  <th className="text-left p-2 text-orange-300">Customer name / number</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b border-orange-500/10 hover:bg-orange-500/5">
                    <td className="p-2 text-white">{record.inbFlightDate || "-"}</td>
                    <td className="p-2 text-white">{record.outbFlightDate || "-"}</td>
                    <td className="p-2 text-white">{record.recId || "-"}</td>
                    <td className="p-2 text-white">{record.desNo || "-"}</td>
                    <td className="p-2 text-white">{record.recNumb || "-"}</td>
                    <td className="p-2 text-white">{record.origOE || "-"}</td>
                    <td className="p-2 text-white">{record.destOE || "-"}</td>
                    <td className="p-2 text-white">{record.inbFlightNoSTA || "-"}</td>
                    <td className="p-2 text-white">{record.outbFlightNoSTD || "-"}</td>
                    <td className="p-2 text-white">{record.mailCat}</td>
                    <td className="p-2 text-white">{record.mailClass || "-"}</td>
                    <td className="p-2 text-right text-white">{record.totalKg.toFixed(2)}</td>
                    <td className="p-2 text-white">{record.invoice || "-"}</td>
                    <td className="p-2 text-white">{record.customer || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 10 && (
              <div className="text-center py-4 text-gray-400 text-sm">Showing 10 of {data.length} records</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
