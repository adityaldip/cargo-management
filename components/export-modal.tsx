"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, Users, MapPin, Calendar, Receipt } from "lucide-react"
import type { ProcessedData } from "@/types/cargo-data"
import type { ExportOptions } from "@/lib/export-utils"
import {
  prepareReportData,
  generateCSV,
  generateBillingExcel,
  downloadFile,
  generateFilename,
  generateBillingFilename,
} from "@/lib/export-utils"

interface ExportModalProps {
  data: ProcessedData
  onExport?: () => void
}

export function ExportModal({ data, onExport }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: "csv",
    includeAnalysis: true,
    groupBy: "none",
    includeCharts: false,
    customFields: [],
  })

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Prepare report data
      const reportData = prepareReportData(data, options)

      // Generate content based on format
      let content: string
      let mimeType: string

      switch (options.format) {
        case "csv":
          content = generateCSV(reportData, options)
          mimeType = "text/csv;charset=utf-8;"
          break
        case "excel":
          // For now, export as CSV with Excel-compatible format
          content = generateCSV(reportData, options)
          mimeType = "application/vnd.ms-excel"
          break
        case "pdf":
          // PDF generation would require additional libraries
          content = generateCSV(reportData, options)
          mimeType = "text/csv;charset=utf-8;"
          break
        default:
          throw new Error("Unsupported export format")
      }

      // Generate filename and download
      const filename = generateFilename(options, options.groupBy)
      downloadFile(content, filename, mimeType)

      // Close modal and notify parent
      setIsOpen(false)
      onExport?.()
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleBillingExport = async () => {
    setIsExporting(true)

    try {
      // Prepare report data with customer grouping for billing
      const billingOptions: ExportOptions = {
        ...options,
        groupBy: "customer",
        includeAnalysis: false,
        format: "excel",
      }

      const reportData = prepareReportData(data, billingOptions)
      const content = generateBillingExcel(reportData, billingOptions)
      const filename = generateBillingFilename()

      downloadFile(content, filename, "application/vnd.ms-excel")

      // Close modal and notify parent
      setIsOpen(false)
      onExport?.()
    } catch (error) {
      console.error("Billing export failed:", error)
      alert("Billing export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleOptionChange = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const getGroupByIcon = (groupBy: string) => {
    switch (groupBy) {
      case "customer":
        return <Users className="h-4 w-4" />
      case "route":
        return <MapPin className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case "csv":
        return "Comma-separated values, compatible with Excel and other spreadsheet applications"
      case "excel":
        return "Microsoft Excel format with formatting and multiple sheets"
      case "pdf":
        return "Portable Document Format, ideal for sharing and printing"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10 bg-transparent"
        >
          <Download className="h-3 w-3 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-black border-orange-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-orange-500">Export Cargo Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-500 text-lg">Quick Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  onClick={handleBillingExport}
                  disabled={isExporting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-medium"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Export for Billing
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="outline"
                  className="flex-1 border-orange-500/50 text-orange-300 hover:bg-orange-500/10 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Custom Export
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Billing export creates an invoice-ready Excel file grouped by customer with rates and totals.
              </p>
            </CardContent>
          </Card>

          {/* Export Format */}
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-500 text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-orange-300">File Format</Label>
                <Select
                  value={options.format}
                  onValueChange={(value: "excel" | "csv" | "pdf") => handleOptionChange("format", value)}
                >
                  <SelectTrigger className="bg-black border-orange-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-orange-500/30">
                    <SelectItem value="csv" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      CSV (Comma Separated Values)
                    </SelectItem>
                    <SelectItem value="excel" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      Excel Spreadsheet
                    </SelectItem>
                    <SelectItem value="pdf" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      PDF Document
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">{getFormatDescription(options.format)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Organization */}
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-500 text-lg">Data Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-orange-300">Group Data By</Label>
                <Select
                  value={options.groupBy}
                  onValueChange={(value: "customer" | "route" | "date" | "none") =>
                    handleOptionChange("groupBy", value)
                  }
                >
                  <SelectTrigger className="bg-black border-orange-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-orange-500/30">
                    <SelectItem value="none" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        No Grouping
                      </div>
                    </SelectItem>
                    <SelectItem value="customer" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Group by Customer
                      </div>
                    </SelectItem>
                    <SelectItem value="route" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Group by Route
                      </div>
                    </SelectItem>
                    <SelectItem value="date" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Group by Date
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-500 text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-400" />
                  <Label className="text-orange-300">Include Analysis</Label>
                </div>
                <Switch
                  checked={options.includeAnalysis}
                  onCheckedChange={(checked) => handleOptionChange("includeAnalysis", checked)}
                />
              </div>
              <p className="text-xs text-gray-400">
                Adds top routes, customer analysis, and summary statistics to the export
              </p>

              {options.format === "excel" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-400" />
                    <Label className="text-orange-300">Include Charts</Label>
                  </div>
                  <Switch
                    checked={options.includeCharts}
                    onCheckedChange={(checked) => handleOptionChange("includeCharts", checked)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-black border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-500 text-lg">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-orange-300">Records to export:</span>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    {data.summary.totalRecords}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-300">File format:</span>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    {options.format.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-300">Organization:</span>
                  <div className="flex items-center gap-1">
                    {getGroupByIcon(options.groupBy || "none")}
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {options.groupBy === "none" ? "Single file" : `By ${options.groupBy}`}
                    </Badge>
                  </div>
                </div>
                {options.includeAnalysis && (
                  <div className="flex items-center justify-between">
                    <span className="text-orange-300">Analysis included:</span>
                    <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-500/30">
                      Yes
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10"
            >
              Cancel
            </Button>
            {isExporting && (
              <Button disabled className="bg-orange-500/50 text-black">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Exporting...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
