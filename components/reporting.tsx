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
  RefreshCw
} from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { cn } from "@/lib/utils"
import type { ProcessedData } from "@/types/cargo-data"
import { useReportingData } from "@/hooks/use-reporting-data"
import type { ReportData } from "@/types/reporting"


interface ReportingProps {
  data?: ProcessedData | null
}

export function Reporting({ data }: ReportingProps) {
  const [viewBy, setViewBy] = useState<"revenue" | "weight">("revenue")
  const [viewPeriod, setViewPeriod] = useState<"total" | "week" | "month">("total")
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({
    from: "2024-01-01",
    to: "2025-12-31"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  // Fetch real data from API
  const { 
    data: reportData, 
    summary, 
    loading, 
    error, 
    refetch 
  } = useReportingData({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    viewBy,
    viewPeriod
  })

  // Use all data (no filtering for now)
  const filteredData = reportData

  // Debug: Log what data we're getting
  console.log('Reporting component data:', {
    reportDataLength: reportData?.length || 0,
    loading,
    error,
    sampleData: reportData?.[0] ? {
      rowLabel: reportData[0].rowLabel,
      total: reportData[0].total,
      revenue: reportData[0].revenue,
      weekKeys: Object.keys(reportData[0]).filter(key => key.startsWith('week')),
      sampleWeeks: {
        week1: reportData[0].week1,
        week2: reportData[0].week2,
        week3: reportData[0].week3,
        week4: reportData[0].week4
      }
    } : null
  })

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
  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData?.slice(startIndex, startIndex + itemsPerPage) || []

  // Calculate summary statistics based on viewBy and viewPeriod
  const totalRevenue = summary?.totalRevenue ?? (filteredData?.reduce((sum, item) => sum + item.revenue, 0) || 0)
  const totalWeight = summary?.totalWeight ?? (filteredData?.reduce((sum, item) => sum + item.weight, 0) || 0)
  const totalRecords = summary?.totalRecords ?? (filteredData?.length || 0)
  
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
  
  const viewSpecificTotal = filteredData?.reduce((sum, item) => sum + getViewSpecificValue(item), 0) || 0
  const viewSpecificAverage = totalRecords > 0 ? viewSpecificTotal / totalRecords : 0
  const viewSpecificMax = filteredData && filteredData.length > 0 ? Math.max(...filteredData.map(item => getViewSpecificValue(item))) : 0

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
        // Generate columns for all 52 weeks with better spacing
        const weekColumns = []
        for (let week = 1; week <= 52; week++) {
          weekColumns.push({
            key: `week${week}`,
            label: `W${week}`,
            width: "w-20"
          })
        }
        return [
          { key: "rowLabel", label: "Row Labels", width: "w-48" },
          ...weekColumns,
          { key: "total", label: viewBy === "revenue" ? "Total (EUR)" : "Total (kg)", width: "w-32" }
        ]
      case "month":
        return [
          { key: "rowLabel", label: "Row Labels", width: "w-48" },
          { key: "jan", label: "JAN", width: "w-20" },
          { key: "feb", label: "FEB", width: "w-20" },
          { key: "mar", label: "MAR", width: "w-20" },
          { key: "apr", label: "APR", width: "w-20" },
          { key: "may", label: "MAY", width: "w-20" },
          { key: "jun", label: "JUN", width: "w-20" },
          { key: "jul", label: "JUL", width: "w-20" },
          { key: "aug", label: "AUG", width: "w-20" },
          { key: "sep", label: "SEP", width: "w-20" },
          { key: "oct", label: "OCT", width: "w-20" },
          { key: "nov", label: "NOV", width: "w-20" },
          { key: "dec", label: "DEC", width: "w-20" },
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
    
    // For week columns, use the actual weekly data from API
    if (columnKey.startsWith("week")) {
      const weekValue = item[columnKey as keyof ReportData]
      
      // Debug logging for weekly data
      if (columnKey === "week1" || columnKey === "week2") {
        console.log(`Weekly data for ${item.rowLabel} - ${columnKey}:`, {
          weekValue,
          type: typeof weekValue,
          itemKeys: Object.keys(item).filter(key => key.startsWith('week')),
          sampleWeekData: {
            week1: item.week1,
            week2: item.week2,
            week3: item.week3
          }
        })
      }
      
      if (typeof weekValue === "number") {
        return formatNumber(weekValue)
      }
      if (weekValue === null) {
        return formatNumber(null)
      }
      return "-"
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
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export")
      return
    }

    const csvData = filteredData.map(item => ({
      "Row Labels": item.rowLabel,
      "JAN": item.jan || "",
      "FEB": item.feb || "",
      "MAR": item.mar || "",
      "APR": item.apr || "",
      "MAY": item.may || "",
      "JUN": item.jun || "",
      "JUL": item.jul || "",
      "AUG": item.aug || "",
      "SEP": item.sep || "",
      "OCT": item.oct || "",
      "NOV": item.nov || "",
      "DEC": item.dec || "",
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
      {/* Error Banner */}
      {error && (
        <WarningBanner 
          message={`Error loading data: ${error}`}
          className="mb-4 bg-red-50 border-red-200 text-red-800"
        />
      )}

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                  <SelectItem value="week">View by Week (52 weeks)</SelectItem>
                  <SelectItem value="month">View by Month</SelectItem>
                </SelectContent>
              </Select>
              {viewPeriod === "week" && (
                <p className="text-xs text-gray-500">
                  Showing all 52 weeks of the year. Scroll horizontally to view all weeks.
                </p>
              )}
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
        {viewPeriod === "week" ? (
          // Weekly view with single scroll container
          <div className="overflow-auto max-h-96">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  {getTableColumns().map((column) => (
                    <TableHead 
                      key={column.key} 
                      className={`${column.width} ${column.key === "total" ? "text-right font-bold" : column.key !== "rowLabel" ? "text-right" : ""} text-xs`}
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
                        className={`text-xs font-mono ${
                          column.key === "rowLabel" 
                            ? "font-medium" 
                            : "text-right"
                        } ${
                          column.key === "total" 
                            ? "font-bold bg-gray-50" 
                            : ""
                        } ${
                          column.key.startsWith("week")
                            ? "min-w-16"
                            : ""
                        }`}
                      >
                        {getCellValue(item, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                
                {/* Total Row - integrated into the same table */}
                {filteredData && filteredData.length > 0 && (
                  <TableRow className="font-bold border-t-2 border-gray-300 bg-gray-50">
                    {getTableColumns().map((column) => (
                      <TableCell 
                        key={column.key}
                        className={`text-xs font-mono ${
                          column.key === "rowLabel" 
                            ? "font-bold" 
                            : "text-right"
                        } ${
                          column.key === "total" 
                            ? "bg-gray-100" 
                            : ""
                        } ${
                          column.key.startsWith("week")
                            ? "min-w-16"
                            : ""
                        }`}
                      >
                        {column.key === "rowLabel" 
                          ? "TOTAL" 
                          : column.key === "total"
                          ? formatNumber(Math.round(viewSpecificTotal))
                          : column.key.startsWith("week")
                          ? (() => {
                              // Sum actual weekly data for the specific week
                              const weekTotal = filteredData?.reduce((sum, item) => {
                                const weekValue = item[column.key as keyof ReportData]
                                return sum + (typeof weekValue === "number" ? weekValue : 0)
                              }, 0) || 0
                              return formatNumber(Math.round(weekTotal))
                            })()
                          : column.key in { jan: 1, feb: 1, mar: 1, apr: 1, may: 1, jun: 1, jul: 1, aug: 1, sep: 1, oct: 1, nov: 1, dec: 1 }
                          ? (() => {
                              // Sum actual monthly data for the specific month
                              const monthTotal = filteredData?.reduce((sum, item) => {
                                const monthValue = item[column.key as keyof ReportData]
                                return sum + (typeof monthValue === "number" ? monthValue : 0)
                              }, 0) || 0
                              return formatNumber(Math.round(monthTotal))
                            })()
                          : "-"
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Regular view (total/month) with normal layout
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
            {filteredData && filteredData.length > 0 && (
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
                            ? (() => {
                                // Sum actual weekly data for the specific week
                                const weekTotal = filteredData?.reduce((sum, item) => {
                                  const weekValue = item[column.key as keyof ReportData]
                                  return sum + (typeof weekValue === "number" ? weekValue : 0)
                                }, 0) || 0
                                return formatNumber(Math.round(weekTotal))
                              })()
                            : column.key in { jan: 1, feb: 1, mar: 1, apr: 1, may: 1, jun: 1, jul: 1, aug: 1, sep: 1, oct: 1, nov: 1, dec: 1 }
                            ? (() => {
                                // Sum actual monthly data for the specific month
                                const monthTotal = filteredData?.reduce((sum, item) => {
                                  const monthValue = item[column.key as keyof ReportData]
                                  return sum + (typeof monthValue === "number" ? monthValue : 0)
                                }, 0) || 0
                                return formatNumber(Math.round(monthTotal))
                              })()
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
        )}

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-500">Loading reporting data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No reports found matching your criteria</p>
            </div>
          ) : null}

          {/* Pagination */}
          {filteredData && filteredData.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData?.length || 0)} of {filteredData?.length || 0} entries
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
