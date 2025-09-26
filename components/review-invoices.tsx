"use client"

import { useState, useMemo, useEffect } from "react"
import type { ProcessedData, CargoInvoice } from "@/types/cargo-data"
import { type Invoice } from "@/lib/pdf-generator"
import { preExistingCustomers } from "@/lib/sample-invoice-data"
import { InvoicePdfPreview } from "@/components/invoice-pdf-preview"
import { useCargoInvoices } from "@/hooks/use-cargo-invoices"
import { 
  InvoiceTable, 
  PaginationControls, 
  LoadingSkeleton, 
  ErrorBanner 
} from "@/components/invoice-management"

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

  const handleSelectAll = (invoiceIds: string[]) => {
    setSelectedInvoices(invoiceIds)
  }

  const handleInvoiceClick = (invoice: CargoInvoice | Invoice) => {
    setSelectedInvoice(invoice)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-2 pt-1">
      {/* Error Banner */}
      <ErrorBanner error={error} />

      {/* Main Content with PDF Preview */}
      {loading ? (
        <LoadingSkeleton showPdfPreview={true} />
      ) : (
        <div className="flex gap-2">
          {/* Invoices Table */}
          <div className="w-1/2">
            <InvoiceTable
              invoices={paginatedInvoices}
              selectedInvoices={selectedInvoices}
              selectedInvoice={selectedInvoice}
              loading={loading}
              onSelectInvoice={handleSelectInvoice}
              onSelectAll={handleSelectAll}
              onInvoiceClick={handleInvoiceClick}
            />
            
            {/* Pagination Controls */}
            {filteredInvoices.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                total={pagination.total}
                startIndex={startIndex}
                loading={loading}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
          </div>

          {/* PDF Preview Panel */}
          <InvoicePdfPreview selectedInvoice={selectedInvoice} />
        </div>
      )}
    </div>
  )
}