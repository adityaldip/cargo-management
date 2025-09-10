"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Download, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { RateRule } from "./types"
import { useRateRulesData } from "./hooks"
import { FilterPopup, FilterCondition, FilterField } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"

export function ExecuteRates() {
  const { rateRules: rules } = useRateRulesData()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("execute-rates")
  
  // Define filter fields based on table columns
  const filterFields: FilterField[] = [
    { key: 'inb_flight_date', label: 'Inb. Flight Date', type: 'date' },
    { key: 'outb_flight_date', label: 'Outb. Flight Date', type: 'date' },
    { key: 'rec_id', label: 'Rec. ID', type: 'text' },
    { key: 'des_no', label: 'Des. No.', type: 'text' },
    { key: 'rec_numb', label: 'Rec. Number', type: 'text' },
    { key: 'orig_oe', label: 'Orig. OE', type: 'text' },
    { key: 'dest_oe', label: 'Dest. OE', type: 'text' },
    { key: 'inb_flight_no', label: 'Inb. Flight No.', type: 'text' },
    { key: 'outb_flight_no', label: 'Outb. Flight No.', type: 'text' },
    { key: 'mail_cat', label: 'Mail Category', type: 'text' },
    { key: 'mail_class', label: 'Mail Class', type: 'text' },
    { key: 'total_kg', label: 'Total Weight (kg)', type: 'number' },
    { key: 'invoice', label: 'Invoice', type: 'text' },
    { key: 'applied_rule', label: 'Applied Rule', type: 'text' },
    { key: 'rate', label: 'Rate', type: 'text' }
  ]

  const calculateTotalRevenue = () => {
    return rules.reduce((total, rule) => {
      if (!rule.isActive) return total
      // Use the transformed rate data from the store
      const baseRate = rule.rate || 0
      const multiplier = rule.multiplier || 1
      const matchCount = rule.matchCount || 0
      return total + (matchCount * baseRate * multiplier)
    }, 0)
  }

  // Filter handlers
  const handleApplyFilters = (conditions: FilterCondition[], logic: "AND" | "OR") => {
    setFilters(conditions, logic)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    clearFilters()
    setCurrentPage(1)
  }

  // Generate sample data with filtering
  const generateSampleData = () => {
    const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
    const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
    const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
    const mailCats = ["A", "B", "C", "D", "E"]
    const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
    const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
    const appliedRules = [
      "EU Zone Standard Rate",
      "Nordic Express Premium", 
      "Heavy Cargo Discount",
      "Intercontinental Fixed Rate",
      "Distance-Based Calculation",
      "Zone-Based Regional"
    ]

    return Array.from({ length: 100 }, (_, index) => {
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
      const totalKg = (Math.random() * 50 + 0.1).toFixed(1)
      const rate = `€${(Math.random() * 15 + 2.5).toFixed(2)}`
      const appliedRule = appliedRules[Math.floor(Math.random() * appliedRules.length)]
      const invoice = invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)]
      const inbFlightNo = flightNos[Math.floor(Math.random() * flightNos.length)]
      const outbFlightNo = flightNos[Math.floor(Math.random() * flightNos.length)]

      return {
        inb_flight_date: inbDate,
        outb_flight_date: outbDate,
        rec_id: recId,
        des_no: desNo,
        rec_numb: recNumb,
        orig_oe: origOE,
        dest_oe: destOE,
        inb_flight_no: inbFlightNo,
        outb_flight_no: outbFlightNo,
        mail_cat: mailCat,
        mail_class: mailClass,
        total_kg: totalKg,
        invoice: invoice,
        applied_rule: appliedRule,
        rate: rate
      }
    })
  }

  // Apply filters to the data
  const applyFilters = (data: any[], conditions: FilterCondition[], logic: "AND" | "OR") => {
    if (conditions.length === 0) return data

    return data.filter(record => {
      const conditionResults = conditions.map(condition => {
        const value = String(record[condition.field] || '').toLowerCase()
        const filterValue = condition.value.toLowerCase()

        switch (condition.operator) {
          case "equals":
            return value === filterValue
          case "contains":
            return value.includes(filterValue)
          case "starts_with":
            return value.startsWith(filterValue)
          case "ends_with":
            return value.endsWith(filterValue)
          case "greater_than":
            return parseFloat(value) > parseFloat(filterValue)
          case "less_than":
            return parseFloat(value) < parseFloat(filterValue)
          case "not_empty":
            return value.trim() !== ""
          case "is_empty":
            return value.trim() === ""
          default:
            return false
        }
      })

      return logic === "OR" 
        ? conditionResults.some(result => result)
        : conditionResults.every(result => result)
    })
  }

  // Get filtered data
  const allData = generateSampleData()
  const filteredData = applyFilters(allData, filterConditions, filterLogic)
  const totalItems = filteredData.length

  // Export function
  const handleExport = () => {
    // Create sample data for export
    const sampleData = Array.from({ length: 100 }, (_, index) => {
      const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
      const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
      const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
      const mailCats = ["A", "B", "C", "D", "E"]
      const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
      const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
      const appliedRules = [
        "EU Zone Standard Rate",
        "Nordic Express Premium", 
        "Heavy Cargo Discount",
        "Intercontinental Fixed Rate",
        "Distance-Based Calculation",
        "Zone-Based Regional"
      ]

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

      return {
        "Inb.Flight Date": inbDate,
        "Outb.Flight Date": outbDate,
        "Rec. ID": recId,
        "Des. No.": desNo,
        "Rec. Numb.": recNumb,
        "Orig. OE": origOE,
        "Dest. OE": destOE,
        "Inb. Flight No.": flightNos[Math.floor(Math.random() * flightNos.length)],
        "Outb. Flight No.": flightNos[Math.floor(Math.random() * flightNos.length)],
        "Mail Cat.": mailCat,
        "Mail Class": mailClass,
        "Total kg": (Math.random() * 50 + 0.1).toFixed(1),
        "Invoice": invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)],
        "Applied Rule": appliedRules[Math.floor(Math.random() * appliedRules.length)],
        "Rate": `€${(Math.random() * 15 + 2.5).toFixed(2)}`
      }
    })

    // Convert to CSV
    const headers = Object.keys(sampleData[0])
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'rate-assignments.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Sample Data Banner */}
      <WarningBanner 
        message="This is sample data and not connected to the database yet"
        className="mb-4"
      />

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-black flex items-center gap-2">
              <Play className="h-5 w-5" />
              Execute Rate Assignment
            </CardTitle>
            <p className="text-sm text-gray-600">Rate assignment results for cargo data</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={hasActiveFilters ? "border-blue-300 bg-blue-50 text-blue-700" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">
                    {filterConditions.length}
                  </span>
                )}
              </Button>
              
              {/* Filter Popup */}
              {isFilterOpen && (
                <FilterPopup
                  isOpen={isFilterOpen}
                  onClose={() => setIsFilterOpen(false)}
                  onApply={handleApplyFilters}
                  fields={filterFields}
                  initialConditions={filterConditions}
                  initialLogic={filterLogic}
                  title="Filter Rate Data"
                />
              )}
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              className="bg-black text-white"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute Rates
            </Button>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            {hasActiveFilters && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500">
                  {filterConditions.length} filter{filterConditions.length !== 1 ? 's' : ''} active
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-6 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            {hasActiveFilters && (
              <span>Filtered: <strong className="text-black">{totalItems}</strong> / <strong className="text-gray-500">{allData.length}</strong></span>
            )}
            {!hasActiveFilters && (
              <span>Total Records: <strong className="text-black">{totalItems}</strong></span>
            )}
            <span>Applied Rules: <strong className="text-black">{rules.filter(r => r.isActive).length}</strong></span>
            <span>Est. Revenue: <strong className="text-black">€{calculateTotalRevenue().toFixed(0)}</strong></span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="border border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="border">Inb.Flight Date</TableHead>
                <TableHead className="border">Outb.Flight Date</TableHead>
                <TableHead className="border">Rec. ID</TableHead>
                <TableHead className="border">Des. No.</TableHead>
                <TableHead className="border">Rec. Numb.</TableHead>
                <TableHead className="border">Orig. OE</TableHead>
                <TableHead className="border">Dest. OE</TableHead>
                <TableHead className="border">Inb. Flight No.</TableHead>
                <TableHead className="border">Outb. Flight No.</TableHead>
                <TableHead className="border">Mail Cat.</TableHead>
                <TableHead className="border">Mail Class</TableHead>
                <TableHead className="border text-right">Total kg</TableHead>
                <TableHead className="border">Invoice</TableHead>
                <TableHead className="border bg-yellow-200">Applied Rule</TableHead>
                <TableHead className="border text-right bg-yellow-200">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // Get paginated filtered data
                const startIndex = (currentPage - 1) * itemsPerPage
                const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
                const currentPageData = filteredData.slice(startIndex, endIndex)
                
                return currentPageData.map((record, index) => (
                  <TableRow key={startIndex + index}>
                    <TableCell className="border">{record.inb_flight_date}</TableCell>
                    <TableCell className="border">{record.outb_flight_date}</TableCell>
                    <TableCell className="border font-mono text-xs">{record.rec_id}</TableCell>
                    <TableCell className="border">{record.des_no}</TableCell>
                    <TableCell className="border">{record.rec_numb}</TableCell>
                    <TableCell className="border">{record.orig_oe}</TableCell>
                    <TableCell className="border">{record.dest_oe}</TableCell>
                    <TableCell className="border">{record.inb_flight_no}</TableCell>
                    <TableCell className="border">{record.outb_flight_no}</TableCell>
                    <TableCell className="border">{record.mail_cat}</TableCell>
                    <TableCell className="border">{record.mail_class}</TableCell>
                    <TableCell className="border text-right">{record.total_kg}</TableCell>
                    <TableCell className="border">{record.invoice}</TableCell>
                    <TableCell className="border text-xs bg-yellow-200">{record.applied_rule}</TableCell>
                    <TableCell className="border text-xs bg-yellow-200 text-right">{record.rate}</TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Rate assignment results showing applied rules and calculated rates for each cargo record
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
