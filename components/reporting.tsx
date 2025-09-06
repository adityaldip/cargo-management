"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Download, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProcessedData } from "@/types/cargo-data"

interface ReportData {
  rowLabel: string
  jan: number | null
  feb: number | null
  mar: number | null
  apr: number | null
  may: number | null
  jun: number | null
  jul: number | null
  total: number
  revenue: number
  weight: number
}

// Sample data for demonstration - based on the table format shown
const SAMPLE_DATA: ReportData[] = [
  {
    rowLabel: "Airmail Ltd",
    jan: 1234,
    feb: 1456,
    mar: 1678,
    apr: 1890,
    may: 2102,
    jun: 2314,
    jul: 2526,
    total: 13200,
    revenue: 13200,
    weight: 1320
  },
  {
    rowLabel: "Armenia",
    jan: 567,
    feb: 678,
    mar: 789,
    apr: 890,
    may: 901,
    jun: 1012,
    jul: 1123,
    total: 5960,
    revenue: 5960,
    weight: 596
  },
  {
    rowLabel: "Asendia FRA",
    jan: 1325,
    feb: 1456,
    mar: 1587,
    apr: 1718,
    may: 1849,
    jun: 1980,
    jul: 2111,
    total: 12026,
    revenue: 12026,
    weight: 1203
  },
  {
    rowLabel: "ASENDIA LHR",
    jan: 2345,
    feb: 2567,
    mar: 2789,
    apr: 3011,
    may: 3233,
    jun: 3455,
    jul: 3677,
    total: 21077,
    revenue: 21077,
    weight: 2108
  },
  {
    rowLabel: "Austria",
    jan: 890,
    feb: 1001,
    mar: 1112,
    apr: 1223,
    may: 1334,
    jun: 1445,
    jul: 1556,
    total: 8561,
    revenue: 8561,
    weight: 856
  },
  {
    rowLabel: "Belarus",
    jan: 456,
    feb: 567,
    mar: 678,
    apr: 789,
    may: 890,
    jun: 901,
    jul: 1012,
    total: 5293,
    revenue: 5293,
    weight: 529
  },
  {
    rowLabel: "Belgium",
    jan: 1789,
    feb: 1900,
    mar: 2011,
    apr: 2122,
    may: 2233,
    jun: 2344,
    jul: 2455,
    total: 14854,
    revenue: 14854,
    weight: 1485
  },
  {
    rowLabel: "Croatia Airlines",
    jan: 234,
    feb: 345,
    mar: 456,
    apr: 567,
    may: 678,
    jun: 789,
    jul: 890,
    total: 3959,
    revenue: 3959,
    weight: 396
  },
  {
    rowLabel: "CYRPUS GSA",
    jan: 2,
    feb: 5,
    mar: 8,
    apr: 11,
    may: 14,
    jun: 17,
    jul: 20,
    total: 77,
    revenue: 77,
    weight: 8
  },
  {
    rowLabel: "Czech",
    jan: 1234,
    feb: 1345,
    mar: 1456,
    apr: 1567,
    may: 1678,
    jun: 1789,
    jul: 1900,
    total: 10969,
    revenue: 10969,
    weight: 1097
  },
  {
    rowLabel: "Deutsche Post AG",
    jan: 4567,
    feb: 4678,
    mar: 4789,
    apr: 4900,
    may: 5011,
    jun: 5122,
    jul: 5233,
    total: 34300,
    revenue: 34300,
    weight: 3430
  },
  {
    rowLabel: "DHL GLOBAL MAIL",
    jan: 3456,
    feb: 3567,
    mar: 3678,
    apr: 3789,
    may: 3900,
    jun: 4011,
    jul: 4122,
    total: 26523,
    revenue: 26523,
    weight: 2652
  },
  {
    rowLabel: "Estonia",
    jan: 123,
    feb: 234,
    mar: 345,
    apr: 456,
    may: 567,
    jun: 678,
    jul: 789,
    total: 3192,
    revenue: 3192,
    weight: 319
  },
  {
    rowLabel: "EVRI LEEDS",
    jan: 890,
    feb: 1001,
    mar: 1112,
    apr: 1223,
    may: 1334,
    jun: 1445,
    jul: 1556,
    total: 8561,
    revenue: 8561,
    weight: 856
  },
  {
    rowLabel: "Finland",
    jan: 2345,
    feb: 2456,
    mar: 2567,
    apr: 2678,
    may: 2789,
    jun: 2900,
    jul: 3011,
    total: 18746,
    revenue: 18746,
    weight: 1875
  },
  {
    rowLabel: "France",
    jan: 5678,
    feb: 5789,
    mar: 5900,
    apr: 6011,
    may: 6122,
    jun: 6233,
    jul: 6344,
    total: 42077,
    revenue: 42077,
    weight: 4208
  },
  {
    rowLabel: "Georgia",
    jan: null,
    feb: null,
    mar: null,
    apr: 123,
    may: 234,
    jun: 345,
    jul: 456,
    total: 1158,
    revenue: 1158,
    weight: 116
  },
  {
    rowLabel: "GLOBESPEED SWISS AG",
    jan: 456,
    feb: 567,
    mar: 678,
    apr: 789,
    may: 890,
    jun: 901,
    jul: 1012,
    total: 5293,
    revenue: 5293,
    weight: 529
  },
  {
    rowLabel: "Hungary",
    jan: null,
    feb: null,
    mar: null,
    apr: null,
    may: 123,
    jun: 234,
    jul: 345,
    total: 702,
    revenue: 702,
    weight: 70
  },
  {
    rowLabel: "Israel",
    jan: null,
    feb: null,
    mar: null,
    apr: null,
    may: 456,
    jun: 567,
    jul: 678,
    total: 1701,
    revenue: 1701,
    weight: 170
  },
  {
    rowLabel: "Italy",
    jan: 3456,
    feb: 3567,
    mar: 3678,
    apr: 3789,
    may: 3900,
    jun: 4011,
    jul: 4122,
    total: 26523,
    revenue: 26523,
    weight: 2652
  },
  {
    rowLabel: "LANDMARK (BPOST)",
    jan: 1234,
    feb: 1345,
    mar: 1456,
    apr: 1567,
    may: 1678,
    jun: 1789,
    jul: 1900,
    total: 10969,
    revenue: 10969,
    weight: 1097
  },
  {
    rowLabel: "Latvia",
    jan: 57849,
    feb: 58960,
    mar: 60071,
    apr: 61182,
    may: 62293,
    jun: 63404,
    jul: 64515,
    total: 428274,
    revenue: 428274,
    weight: 42827
  },
  {
    rowLabel: "Lithuania",
    jan: 2345,
    feb: 2456,
    mar: 2567,
    apr: 2678,
    may: 2789,
    jun: 2900,
    jul: 3011,
    total: 18746,
    revenue: 18746,
    weight: 1875
  },
  {
    rowLabel: "Malta",
    jan: 123,
    feb: 234,
    mar: 345,
    apr: 456,
    may: 567,
    jun: 678,
    jul: 789,
    total: 3192,
    revenue: 3192,
    weight: 319
  },
  {
    rowLabel: "Moldova",
    jan: 89,
    feb: 100,
    mar: 111,
    apr: 122,
    may: 133,
    jun: 144,
    jul: 155,
    total: 854,
    revenue: 854,
    weight: 85
  },
  {
    rowLabel: "Netherlands",
    jan: 4567,
    feb: 4678,
    mar: 4789,
    apr: 4900,
    may: 5011,
    jun: 5122,
    jul: 5233,
    total: 34300,
    revenue: 34300,
    weight: 3430
  },
  {
    rowLabel: "Norway",
    jan: 2345,
    feb: 2456,
    mar: 2567,
    apr: 2678,
    may: 2789,
    jun: 2900,
    jul: 3011,
    total: 18746,
    revenue: 18746,
    weight: 1875
  },
  {
    rowLabel: "Poland",
    jan: 3456,
    feb: 3567,
    mar: 3678,
    apr: 3789,
    may: 3900,
    jun: 4011,
    jul: 4122,
    total: 26523,
    revenue: 26523,
    weight: 2652
  },
  {
    rowLabel: "Portugal",
    jan: 1234,
    feb: 1345,
    mar: 1456,
    apr: 1567,
    may: 1678,
    jun: 1789,
    jul: 1900,
    total: 10969,
    revenue: 10969,
    weight: 1097
  },
  {
    rowLabel: "PostNord/DK",
    jan: 2345,
    feb: 2456,
    mar: 2567,
    apr: 2678,
    may: 2789,
    jun: 2900,
    jul: 3011,
    total: 18746,
    revenue: 18746,
    weight: 1875
  },
  {
    rowLabel: "POSTPLUS GROUP BV",
    jan: 890,
    feb: 1001,
    mar: 1112,
    apr: 1223,
    may: 1334,
    jun: 1445,
    jul: 1556,
    total: 8561,
    revenue: 8561,
    weight: 856
  }
]

interface ReportingProps {
  data?: ProcessedData | null
}

export function Reporting({ data }: ReportingProps) {
  const [viewBy, setViewBy] = useState<"revenue" | "weight">("revenue")
  const [viewPeriod, setViewPeriod] = useState<"total" | "week" | "month">("total")
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({
    from: "2025-01-01",
    to: "2025-07-31"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Use sample data for now
  const reportData = SAMPLE_DATA

  // Use all data (no filtering for now)
  const filteredData = reportData

  // Sort data based on viewBy and viewPeriod
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aValue: number, bValue: number
      
      // Get base value based on viewBy
      if (viewBy === "revenue") {
        aValue = a.revenue
        bValue = b.revenue
      } else {
        aValue = a.weight
        bValue = b.weight
      }
      
      // Apply period calculation
      switch (viewPeriod) {
        case "total":
          return bValue - aValue
        case "week":
          // Convert to weekly average (assuming 4 weeks per month)
          const aWeekly = (aValue / 7) * 4
          const bWeekly = (bValue / 7) * 4
          return bWeekly - aWeekly
        case "month":
          // Convert to monthly average
          const aMonthly = aValue / 7
          const bMonthly = bValue / 7
          return bMonthly - aMonthly
        default:
          return bValue - aValue
      }
    })
  }, [filteredData, viewBy, viewPeriod])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  // Calculate summary statistics based on viewBy and viewPeriod
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0)
  const totalWeight = filteredData.reduce((sum, item) => sum + item.weight, 0)
  const totalRecords = filteredData.length
  
  // Calculate view-specific values
  const getViewSpecificValue = (item: ReportData) => {
    const baseValue = viewBy === "revenue" ? item.revenue : item.weight
    
    switch (viewPeriod) {
      case "total":
        return baseValue
      case "week":
        return (baseValue / 7) * 4 // Average weekly value
      case "month":
        return baseValue / 7 // Average monthly value
      default:
        return baseValue
    }
  }
  
  const viewSpecificTotal = filteredData.reduce((sum, item) => sum + getViewSpecificValue(item), 0)
  const viewSpecificAverage = totalRecords > 0 ? viewSpecificTotal / totalRecords : 0
  const viewSpecificMax = Math.max(...filteredData.map(item => getViewSpecificValue(item)))

  const formatNumber = (value: number | null) => {
    if (value === null) return "-"
    return value.toLocaleString()
  }

  // Generate columns based on view period
  const getTableColumns = () => {
    switch (viewPeriod) {
      case "total":
        return [
          { key: "rowLabel", label: "Row Labels", width: "w-48" },
          { key: "total", label: viewBy === "revenue" ? "Total (EUR)" : "Total (kg)", width: "w-32" }
        ]
      case "week":
        return [
          { key: "rowLabel", label: "Row Labels", width: "w-48" },
          { key: "week1", label: "Week 1", width: "w-24" },
          { key: "week2", label: "Week 2", width: "w-24" },
          { key: "week3", label: "Week 3", width: "w-24" },
          { key: "week4", label: "Week 4", width: "w-24" },
          { key: "total", label: viewBy === "revenue" ? "Total (EUR)" : "Total (kg)", width: "w-32" }
        ]
      case "month":
        return [
          { key: "rowLabel", label: "Row Labels", width: "w-48" },
          { key: "jan", label: "JAN", width: "w-24" },
          { key: "feb", label: "FEB", width: "w-24" },
          { key: "mar", label: "MAR", width: "w-24" },
          { key: "apr", label: "APR", width: "w-24" },
          { key: "may", label: "MAY", width: "w-24" },
          { key: "jun", label: "JUN", width: "w-24" },
          { key: "jul", label: "JUL", width: "w-24" },
          { key: "total", label: viewBy === "revenue" ? "Total (EUR)" : "Total (kg)", width: "w-32" }
        ]
      default:
        return [
          { key: "rowLabel", label: "Row Labels", width: "w-48" },
          { key: "total", label: viewBy === "revenue" ? "Total (EUR)" : "Total (kg)", width: "w-32" }
        ]
    }
  }

  // Get cell value based on view period and view by
  const getCellValue = (item: ReportData, columnKey: string) => {
    if (columnKey === "rowLabel") return item.rowLabel
    if (columnKey === "total") {
      const baseValue = viewBy === "revenue" ? item.revenue : item.weight
      return formatNumber(baseValue)
    }
    
    // For week columns, calculate weekly values
    if (columnKey.startsWith("week")) {
      const weekNumber = parseInt(columnKey.replace("week", ""))
      const baseValue = viewBy === "revenue" ? item.revenue : item.weight
      const weeklyValue = (baseValue / 7) * 4 // Average weekly value
      return formatNumber(Math.round(weeklyValue))
    }
    
    // For month columns, use the actual month data
    if (columnKey in item) {
      const monthValue = item[columnKey as keyof ReportData]
      if (typeof monthValue === "number") {
        return formatNumber(monthValue)
      }
      if (monthValue === null) {
        return formatNumber(null)
      }
      return "-"
    }
    
    return "-"
  }

  const handleExport = () => {
    const csvData = filteredData.map(item => ({
      "Row Labels": item.rowLabel,
      "JAN": item.jan || "",
      "FEB": item.feb || "",
      "MAR": item.mar || "",
      "APR": item.apr || "",
      "MAY": item.may || "",
      "JUN": item.jun || "",
      "JUL": item.jul || "",
      "TOTAL": item.total
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'reporting-data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Sample Data Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          This is sample data and not connected to the database yet
        </div>
      </div>

      {/* Header with Filters */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reporting Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* View By Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">View By</label>
              <Select value={viewBy} onValueChange={(value: "revenue" | "weight") => setViewBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">View by Revenue (EUR)</SelectItem>
                  <SelectItem value="weight">View by Weight (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range - Middle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => {
                      const fromDate = e.target.value
                      // Validate that from date is not after to date
                      if (fromDate && dateRange.to && fromDate > dateRange.to) {
                        setDateRange(prev => ({ ...prev, from: fromDate, to: fromDate }))
                      } else {
                        setDateRange(prev => ({ ...prev, from: fromDate }))
                      }
                    }}
                    className="text-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:transform [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                <div className="relative flex-1">
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => {
                      const toDate = e.target.value
                      // Validate that to date is not before from date
                      if (toDate && dateRange.from && toDate < dateRange.from) {
                        setDateRange(prev => ({ ...prev, to: toDate, from: toDate }))
                      } else {
                        setDateRange(prev => ({ ...prev, to: toDate }))
                      }
                    }}
                    className="text-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:transform [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
              {/* Validation Message */}
              {dateRange.from && dateRange.to && dateRange.from > dateRange.to && (
                <p className="text-xs text-red-600 mt-1">
                  Start date cannot be after end date
                </p>
              )}
            </div>

            {/* View Period Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">View Period</label>
              <Select value={viewPeriod} onValueChange={(value: "total" | "week" | "month") => setViewPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">View by Total</SelectItem>
                  <SelectItem value="week">View by Week</SelectItem>
                  <SelectItem value="month">View by Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                {viewBy === "revenue" ? "Total Revenue (EUR)" : "Total Weight (kg)"}
              </div>
              <div className="text-2xl font-bold text-black">
                {viewBy === "revenue" ? `€${formatNumber(totalRevenue)}` : `${formatNumber(totalWeight)} kg`}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Records</div>
              <div className="text-2xl font-bold text-black">{totalRecords}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                {viewBy === "revenue" ? 
                  (viewPeriod === "total" ? "Average Revenue (EUR)" : 
                   viewPeriod === "week" ? "Average Weekly Revenue (EUR)" : 
                   "Average Monthly Revenue (EUR)") :
                  (viewPeriod === "total" ? "Average Weight (kg)" : 
                   viewPeriod === "week" ? "Average Weekly Weight (kg)" : 
                   "Average Monthly Weight (kg)")
                }
              </div>
              <div className="text-2xl font-bold text-black">
                {viewBy === "revenue" ? `€${formatNumber(Math.round(viewSpecificAverage))}` : `${formatNumber(Math.round(viewSpecificAverage))} kg`}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                {viewBy === "revenue" ? 
                  (viewPeriod === "total" ? "Max Revenue (EUR)" : 
                   viewPeriod === "week" ? "Max Weekly Revenue (EUR)" : 
                   "Max Monthly Revenue (EUR)") :
                  (viewPeriod === "total" ? "Max Weight (kg)" : 
                   viewPeriod === "week" ? "Max Weekly Weight (kg)" : 
                   "Max Monthly Weight (kg)")
                }
              </div>
              <div className="text-2xl font-bold text-black">
                {viewBy === "revenue" ? `€${formatNumber(Math.round(viewSpecificMax))}` : `${formatNumber(Math.round(viewSpecificMax))} kg`}
              </div>
            </div>
          </div> */}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getTableColumns().map((column) => (
                    <TableHead 
                      key={column.key} 
                      className={`${column.width} ${column.key === "total" ? "text-right font-bold" : column.key !== "rowLabel" ? "text-right" : ""}`}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={item.rowLabel} className="hover:bg-gray-50">
                    {getTableColumns().map((column) => (
                      <TableCell 
                        key={column.key}
                        className={`text-sm font-mono ${
                          column.key === "rowLabel" 
                            ? "font-medium" 
                            : "text-right"
                        } ${
                          column.key === "total" 
                            ? "font-bold bg-gray-50" 
                            : ""
                        }`}
                      >
                        {getCellValue(item, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Total Row */}
            {filteredData.length > 0 && (
              <div className="border-t bg-gray-50">
                <Table>
                  <TableBody>
                    <TableRow className="font-bold">
                      {getTableColumns().map((column) => (
                        <TableCell 
                          key={column.key}
                          className={`text-sm font-mono ${
                            column.key === "rowLabel" 
                              ? "font-bold" 
                              : "text-right"
                          } ${
                            column.key === "total" 
                              ? "bg-gray-100" 
                              : ""
                          }`}
                        >
                          {column.key === "rowLabel" 
                            ? "TOTAL" 
                            : column.key === "total"
                            ? formatNumber(Math.round(viewSpecificTotal))
                            : column.key.startsWith("week")
                            ? formatNumber(Math.round(viewSpecificTotal / 4))
                            : column.key in { jan: 1, feb: 1, mar: 1, apr: 1, may: 1, jun: 1, jul: 1 }
                            ? formatNumber(Math.round(viewSpecificTotal / 7))
                            : "-"
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No reports found matching your criteria</p>
            </div>
          )}

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
