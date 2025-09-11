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
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { WarningBanner } from "@/components/ui/status-banner"
import { cn } from "@/lib/utils"
import type { ProcessedData, CargoInvoice } from "@/types/cargo-data"
import { type Invoice } from "@/lib/pdf-generator"
import { preExistingCustomers } from "@/lib/sample-invoice-data"
import { InvoicePdfPreview } from "@/components/invoice-pdf-preview"
import { useCargoInvoices } from "@/hooks/use-cargo-invoices"

interface ReviewInvoicesProps {
  data: ProcessedData | null
}

export function ReviewInvoices({ data }: ReviewInvoicesProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"revenue" | "weight" | "parcels">("revenue")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [useRealData, setUseRealData] = useState(true)
  
  // Track if component has hydrated to prevent hydration mismatch
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Fetch real cargo data invoices
  const { 
    invoices: realInvoices, 
    loading, 
    error, 
    pagination, 
    refetch 
  } = useCargoInvoices({
    page: currentPage,
    limit: itemsPerPage
  })
  
  // Use real data only
  const invoices = realInvoices
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | CargoInvoice | null>(
    realInvoices.length > 0 ? realInvoices[0] : null
  )

  // Filter invoices - simplified since we removed search and status filters
  const filteredInvoices = invoices

  // Paginated invoices - use real pagination
  const totalPages = pagination.totalPages
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices


  // Add hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Update selected invoice when data changes
  useEffect(() => {
    if (invoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(invoices[0])
    }
  }, [invoices, selectedInvoice])

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
      {/* Data Source Banner and Controls */}
      {/* <div className="flex items-center justify-between mb-4">
        <WarningBanner 
          message="Connected to cargo_data database"
          className="flex-1"
        />
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div> */}

      {/* Error Banner */}
      {error && (
        <WarningBanner 
          message={`Error loading real data: ${error}`}
          className="mb-4 bg-red-50 border-red-200 text-red-800"
        />
      )}

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
                {loading ? (
                  <div className="p-4 space-y-3">
                    {/* Loading indicator */}
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading invoices...</span>
                      </div>
                    </div>
                    {/* Table header skeleton */}
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-6" />
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                    {/* Table rows skeleton */}
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex gap-2">
                        <Skeleton className="h-12 w-6" />
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
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
                      {paginatedInvoices.map((invoice, index) => (
                        <TableRow 
                          key={invoice.id || `invoice-${index}`} 
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
                              <div className="text-gray-500">{invoice.totalWeight.toFixed(2)}kg</div>
                              {'currency' in invoice && (
                                <div className="text-xs text-blue-600">
                                  {invoice.currency} {invoice.amount.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>


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
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, pagination.total)} of {pagination.total} entries
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
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
                        disabled={currentPage >= totalPages || loading}
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
        {loading ? (
          <div className="w-1/2 h-[calc(100vh-2rem)]">
            <Card className="bg-white border-gray-200 shadow-sm h-full pt-0" style={{ paddingBottom: 0 }}>
              <CardContent className="h-full p-0 flex flex-col">          
                <div className="bg-white border border-gray-200 rounded-lg px-3 pt-2 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                  
                  {/* Loading indicator for PDF preview */}
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading invoice preview...</span>
                    </div>
                  </div>
                  
                  {/* Invoice Header Skeleton */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-2">
                      <div>
                        <Skeleton className="h-4 w-16 mb-1" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-4 w-12 mb-1" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>

                  {/* Table Skeleton */}
                  <div className="mb-2 flex-1 flex flex-col">
                    <div className="border-t border-gray-300 pt-2 flex-1 flex flex-col">
                      {/* Table header skeleton */}
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      
                      {/* Table rows skeleton */}
                      <div className="flex-1 space-y-1">
                        {Array.from({ length: 8 }).map((_, index) => (
                          <div key={index} className="grid grid-cols-5 gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                      
                      {/* Totals skeleton */}
                      <div className="border-t border-gray-300 mt-2 pt-2">
                        <div className="grid grid-cols-5 gap-2">
                          <Skeleton className="h-4 w-8" />
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <InvoicePdfPreview selectedInvoice={selectedInvoice} />
        )}
      </div>
    </div>
  )
}
