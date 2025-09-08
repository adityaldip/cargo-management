"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Receipt, 
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { WarningBanner } from "@/components/ui/status-banner"
import { cn } from "@/lib/utils"
import type { ProcessedData } from "@/types/cargo-data"
import { type Invoice } from "@/lib/pdf-generator"
import { SAMPLE_INVOICES, preExistingCustomers } from "@/lib/sample-invoice-data"
import { InvoicePdfPreview } from "@/components/invoice-pdf-preview"

interface ReviewInvoicesProps {
  data: ProcessedData | null
}



export function ReviewInvoices({ data }: ReviewInvoicesProps) {
  const [invoices] = useState<Invoice[]>(SAMPLE_INVOICES)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"revenue" | "weight" | "parcels">("revenue")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(SAMPLE_INVOICES[0])
  
  // Track if component has hydrated to prevent hydration mismatch
  const [isHydrated, setIsHydrated] = useState(false)

  // Filter invoices - simplified since we removed search and status filters
  const filteredInvoices = invoices

  // Paginated invoices
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage)


  // Add hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Customer analysis logic - prevent hydration mismatch
  const customerAnalysis = useMemo(() => {
    if (!isHydrated) {
      // Before hydration, always use pre-existing customers to prevent hydration mismatch
      return preExistingCustomers
        .sort((a, b) => {
          switch (sortBy) {
            case "weight":
              return b.totalKg - a.totalKg
            case "parcels":
              return b.parcels - a.parcels
            default:
              return b.totalEur - a.totalEur
          }
        })
    }
    
    if (data) {
      const analysis = data.data.reduce(
        (acc, record) => {
          const customer = record.customer || "Unknown"
          if (!acc[customer]) {
            acc[customer] = {
              customer,
              totalKg: 0,
              totalEur: 0,
              parcels: 0,
              euRevenue: 0,
              nonEuRevenue: 0,
              routes: new Set<string>(),
            }
          }
          acc[customer].totalKg += record.totalKg
          acc[customer].totalEur += record.totalEur || 0
          acc[customer].parcels += 1

          const route = `${record.origOE} → ${record.destOE}`
          acc[customer].routes.add(route)

          if (record.euromail === "EU") {
            acc[customer].euRevenue += record.totalEur || 0
          } else {
            acc[customer].nonEuRevenue += record.totalEur || 0
          }

          return acc
        },
        {} as Record<
          string,
          {
            customer: string
            totalKg: number
            totalEur: number
            parcels: number
            euRevenue: number
            nonEuRevenue: number
            routes: Set<string>
          }
        >,
      )

      return Object.values(analysis)
        .sort((a, b) => {
          switch (sortBy) {
            case "weight":
              return b.totalKg - a.totalKg
            case "parcels":
              return b.parcels - a.parcels
            default:
              return b.totalEur - a.totalEur
          }
        })
    }

    // Use pre-existing customers when no import data
    return preExistingCustomers
      .sort((a, b) => {
        switch (sortBy) {
          case "weight":
            return b.totalKg - a.totalKg
          case "parcels":
            return b.parcels - a.parcels
          default:
            return b.totalEur - a.totalEur
        }
      })
  }, [isHydrated, data, sortBy])


  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }





  return (
    <div className="space-y-2 pt-1">
      {/* Sample Data Banner */}
      <WarningBanner 
        message="This is sample data and not connected to the database yet"
        className="mb-4"
      />

      {/* Main Content with PDF Preview */}
      <div className="flex gap-2">
        {/* Invoices Table */}
        <div className="w-1/2">
          <Card className="bg-white border-gray-200 shadow-sm pt-2" style={{ paddingBottom: "8px" }}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between pb-0 px-4 pt-0">
                <CardTitle className="text-black flex items-center gap-2 text-base pb-2">
                  <Receipt className="h-4 w-4" />
                  Invoice Management
                </CardTitle>
              </div>          
              <div className="overflow-x-auto">
                <Table className="border border-collapse text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border w-6 p-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices(paginatedInvoices.map(inv => inv.id))
                            } else {
                              setSelectedInvoices([])
                            }
                          }}
                          className="rounded border-gray-300"
                          title="Select all invoices on this page"
                        />
                      </TableHead>
                      <TableHead className="border p-1">Invoice</TableHead>
                      <TableHead className="border p-1">Customer</TableHead>
                      <TableHead className="border p-1">Date</TableHead>
                      <TableHead className="border p-1">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice.id} 
                        className={cn(
                          "hover:bg-gray-50 cursor-pointer",
                          selectedInvoice?.id === invoice.id && "bg-blue-50 border-blue-200"
                        )}
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <TableCell className="border p-0.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleSelectInvoice(invoice.id)
                            }}
                            className="rounded border-gray-300"
                            title={`Select invoice ${invoice.invoiceNumber}`}
                          />
                        </TableCell>
                        <TableCell className="border p-1 font-medium">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{invoice.invoiceNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border p-1 text-sm">{invoice.customer}</TableCell>
                        <TableCell className="border p-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{new Date(invoice.date).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border p-1">
                          <div className="text-sm">
                            <div>{invoice.items} items</div>
                            <div className="text-gray-500">{invoice.totalWeight}kg</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredInvoices.length === 0 && (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No invoices found matching your criteria</p>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredInvoices.length > 0 && (
                <div className="flex items-center justify-between mt-0 pt-2 border-t px-4 pb-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Show</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger className="w-16 h-7 text-sm">
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
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="px-2 py-1 text-sm bg-gray-100 rounded">
                        {currentPage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PDF Preview Panel */}
        <InvoicePdfPreview selectedInvoice={selectedInvoice} />
      </div>
    </div>
  )
}
