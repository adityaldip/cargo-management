"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { RateRule } from "./types"
import { useRateRulesData } from "./hooks"

export function ExecuteRates() {
  const { rateRules: rules } = useRateRulesData()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const calculateTotalRevenue = () => {
    return rules.reduce((total, rule) => {
      if (!rule.isActive) return total
      return total + (rule.matchCount * rule.actions.baseRate * (rule.actions.multiplier || 1))
    }, 0)
  }

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
        <div className="flex justify-end">
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Total Records: <strong className="text-black">20</strong></span>
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
                // Generate paginated data
                const totalItems = 100
                const startIndex = (currentPage - 1) * itemsPerPage
                const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
                
                return Array.from({ length: endIndex - startIndex }, (_, i) => {
                  const index = startIndex + i
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

                  return (
                    <TableRow key={index}>
                      <TableCell className="border">{inbDate}</TableCell>
                      <TableCell className="border">{outbDate}</TableCell>
                      <TableCell className="border font-mono text-xs">{recId}</TableCell>
                      <TableCell className="border">{desNo}</TableCell>
                      <TableCell className="border">{recNumb}</TableCell>
                      <TableCell className="border">{origOE}</TableCell>
                      <TableCell className="border">{destOE}</TableCell>
                      <TableCell className="border">{flightNos[Math.floor(Math.random() * flightNos.length)]}</TableCell>
                      <TableCell className="border">{flightNos[Math.floor(Math.random() * flightNos.length)]}</TableCell>
                      <TableCell className="border">{mailCat}</TableCell>
                      <TableCell className="border">{mailClass}</TableCell>
                      <TableCell className="border text-right">{(Math.random() * 50 + 0.1).toFixed(1)}</TableCell>
                      <TableCell className="border">{invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)]}</TableCell>
                      <TableCell className="border text-xs bg-yellow-200">{appliedRules[Math.floor(Math.random() * appliedRules.length)]}</TableCell>
                      <TableCell className="border text-xs bg-yellow-200 text-right">€{(Math.random() * 15 + 2.5).toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, 100)} of 100 entries
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(100 / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(100 / itemsPerPage)}
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
  )
}
