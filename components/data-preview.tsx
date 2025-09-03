"use client"

import type { ProcessedData } from "@/types/cargo-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, XCircle, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { ExportModal } from "@/components/export-modal"
import { useState } from "react"

interface DataPreviewProps {
  processedData: ProcessedData
  onDownloadReport: () => void
}

export function DataPreview({ processedData, onDownloadReport }: DataPreviewProps) {
  const { data, missingFields, warnings, summary } = processedData
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Export function
  const handleExport = () => {
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'processed-data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 pt-2">
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
            <Button onClick={handleExport} variant="outline" size="sm" className="bg-orange-950 border-orange-500/30 text-orange-300 hover:bg-orange-900">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <ExportModal data={processedData} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-orange-500/20">
                  <TableHead className="text-orange-300">Inb.Flight Date</TableHead>
                  <TableHead className="text-orange-300">Outb.Flight Date</TableHead>
                  <TableHead className="text-orange-300">Rec. ID</TableHead>
                  <TableHead className="text-orange-300">Des. No.</TableHead>
                  <TableHead className="text-orange-300">Rec. Numb.</TableHead>
                  <TableHead className="text-orange-300">Orig. OE</TableHead>
                  <TableHead className="text-orange-300">Dest. OE</TableHead>
                  <TableHead className="text-orange-300">Inb. Flight No. | STA</TableHead>
                  <TableHead className="text-orange-300">Outb. Flight No. | STD</TableHead>
                  <TableHead className="text-orange-300">Mail Cat.</TableHead>
                  <TableHead className="text-orange-300">Mail Class</TableHead>
                  <TableHead className="text-right text-orange-300">Total kg</TableHead>
                  <TableHead className="text-orange-300">Invoice</TableHead>
                  <TableHead className="text-orange-300">Customer name / number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const startIndex = (currentPage - 1) * itemsPerPage
                  const endIndex = Math.min(startIndex + itemsPerPage, data.length)
                  
                  return data.slice(startIndex, endIndex).map((record) => (
                    <TableRow key={record.id} className="border-b border-orange-500/10 hover:bg-orange-500/5">
                      <TableCell className="text-white">{record.inbFlightDate || "-"}</TableCell>
                      <TableCell className="text-white">{record.outbFlightDate || "-"}</TableCell>
                      <TableCell className="text-white">{record.recId || "-"}</TableCell>
                      <TableCell className="text-white">{record.desNo || "-"}</TableCell>
                      <TableCell className="text-white">{record.recNumb || "-"}</TableCell>
                      <TableCell className="text-white">{record.origOE || "-"}</TableCell>
                      <TableCell className="text-white">{record.destOE || "-"}</TableCell>
                      <TableCell className="text-white">{record.inbFlightNoSTA || "-"}</TableCell>
                      <TableCell className="text-white">{record.outbFlightNoSTD || "-"}</TableCell>
                      <TableCell className="text-white">{record.mailCat}</TableCell>
                      <TableCell className="text-white">{record.mailClass || "-"}</TableCell>
                      <TableCell className="text-right text-white">{record.totalKg.toFixed(2)}</TableCell>
                      <TableCell className="text-white">{record.invoice || "-"}</TableCell>
                      <TableCell className="text-white">{record.customer || "-"}</TableCell>
                    </TableRow>
                  ))
                })()}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-orange-300">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20 bg-orange-950 border-orange-500/30 text-orange-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-orange-300">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-orange-300">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-orange-950 border-orange-500/30 text-orange-300 hover:bg-orange-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm bg-orange-900 text-orange-300 rounded">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(data.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(data.length / itemsPerPage)}
                    className="bg-orange-950 border-orange-500/30 text-orange-300 hover:bg-orange-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
