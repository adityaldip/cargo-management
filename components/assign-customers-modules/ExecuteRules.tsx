"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Play,
  ArrowLeft,
  Filter
} from "lucide-react"
import { useCustomerRules } from "./hooks"
import { AssignCustomersProps, ViewType } from "./types"
import { FilterPopup, FilterCondition, FilterField } from "@/components/ui/filter-popup"
import { usePageFilters } from "@/store/filter-store"

interface ExecuteRulesProps extends Pick<AssignCustomersProps, 'data'> {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

export function ExecuteRules({ data, currentView, setCurrentView }: ExecuteRulesProps) {
  const { rules } = useCustomerRules()
  
  // Filter state - now persistent
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { conditions: filterConditions, logic: filterLogic, hasActiveFilters, setFilters, clearFilters } = usePageFilters("execute-rules")
  
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
    { key: 'customer', label: 'Customer', type: 'text' }
  ]

  // Filter handlers
  const handleApplyFilters = (conditions: FilterCondition[], logic: "AND" | "OR") => {
    setFilters(conditions, logic)
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  // Generate sample data
  const generateSampleData = () => {
    const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
    const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
    const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
    const mailCats = ["A", "B", "C", "D", "E"]
    const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
    const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
    const customers = [
      "POST DANMARK A/S / QDKCPHA",
      "DIRECT LINK WORLWIDE INC. / QDLW", 
      "POSTNORD SVERIGE AB / QSTO",
      "Premium Express Ltd",
      "Nordic Post AS",
      "Baltic Express Network",
      "Cargo Masters International"
    ]

    return Array.from({ length: 20 }, (_, index) => {
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
      const customer = customers[Math.floor(Math.random() * customers.length)]
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
        customer: customer,
        rate: (Math.random() * 15 + 2.5).toFixed(2)
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

  // Get filtered data for preview
  const allPreviewData = generateSampleData()
  const filteredPreviewData = applyFilters(allPreviewData, filterConditions, filterLogic)

  if (currentView === "rules") {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-black">Cargo Data Preview</CardTitle>
              <p className="text-sm text-gray-600">Preview of cargo data that will be processed by automation rules</p>
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
                    title="Filter Customer Data"
                  />
                )}
              </div>
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => setCurrentView("results")}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute All Rules
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
                <span>Filtered: <strong className="text-black">{filteredPreviewData.length}</strong> / <strong className="text-gray-500">{allPreviewData.length}</strong></span>
              )}
              {!hasActiveFilters && (
                <span>Total Records: <strong className="text-black">{filteredPreviewData.length}</strong></span>
              )}
              <span>Total Weight: <strong className="text-black">{filteredPreviewData.reduce((sum, record) => sum + parseFloat(record.total_kg), 0).toFixed(1)} kg</strong></span>
              <span>Avg Weight: <strong className="text-black">{filteredPreviewData.length > 0 ? (filteredPreviewData.reduce((sum, record) => sum + parseFloat(record.total_kg), 0) / filteredPreviewData.length).toFixed(1) : '0.0'} kg</strong></span>
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
                  <TableHead className="border bg-yellow-200">Customer</TableHead>
                  <TableHead className="border bg-yellow-200">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreviewData.map((record, index) => (
                  <TableRow key={index}>
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
                    <TableCell className="border text-xs bg-yellow-200">{record.customer}</TableCell>
                    <TableCell className="border text-xs bg-yellow-200">{record.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">
              This data will be processed by the active automation rules to assign customers and rates
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Results View
  if (currentView === "results" && data) {
    return (
      <>
        {/* Navigation Button */}
        <div className="flex justify-start mb-4">
          <Button 
            variant="default"
            size="sm"
            onClick={() => setCurrentView("rules")}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preview
          </Button>
        </div>

        {/* Data Table Display */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-black flex items-center gap-2">
                <Play className="h-5 w-5" />
                Cargo Data Table
              </CardTitle>
            </div>
            <p className="text-gray-600 text-sm">
              Showing {data.data.length} cargo records with automation rules applied
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record ID</TableHead>
                    <TableHead>Flight Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Flight No.</TableHead>
                    <TableHead>Mail Cat.</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Assigned Team</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row: any, index: number) => {
                    // Apply rule matching logic to determine assigned team
                    const matchedRule = rules.find(rule => {
                      if (!rule.is_active) return false
                      return rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        const conditionValue = condition.value.toLowerCase()
                        
                        switch (condition.operator) {
                          case 'contains':
                            return fieldValue.includes(conditionValue)
                          case 'equals':
                            return fieldValue === conditionValue
                          case 'greater_than':
                            return parseFloat(fieldValue) > parseFloat(conditionValue)
                          case 'less_than':
                            return parseFloat(fieldValue) < parseFloat(conditionValue)
                          default:
                            return false
                        }
                      })
                    })

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {String(row["Rec. ID"] || row["Record ID"] || `REC-${index + 1}`).substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          {row["Inb.Flight Date"] || row["Flight Date"] || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{row["Orig. OE"] || "N/A"}</span>
                            <span>→</span>
                            <span>{row["Dest. OE"] || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row["Inb. Flight No."] || row["Flight No."] || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row["Mail Cat."] || row["Category"] || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row["Total kg"] || row["Weight"] || "0.0"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {String(row["Customer name / number"] || row["Customer"] || "Unknown").split("/")[0].trim()}
                        </TableCell>
                        <TableCell>
                          {matchedRule ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {matchedRule.actions.assignTo}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {matchedRule ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Processed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{data.data.length}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.data.filter((row: any) => 
                      rules.some(rule => rule.is_active && rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        return fieldValue.includes(condition.value.toLowerCase())
                      }))
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.data.length - data.data.filter((row: any) => 
                      rules.some(rule => rule.is_active && rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        return fieldValue.includes(condition.value.toLowerCase())
                      }))
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{rules.filter(r => r.is_active).length}</div>
                  <div className="text-sm text-gray-600">Rules Applied</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return null
}
