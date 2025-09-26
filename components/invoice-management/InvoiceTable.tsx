"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, FileText, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CargoInvoice } from "@/types/cargo-data"
import { type Invoice } from "@/lib/pdf-generator"

interface InvoiceTableProps {
  invoices: (CargoInvoice | Invoice)[]
  selectedInvoices: string[]
  selectedInvoice: CargoInvoice | Invoice | null
  loading: boolean
  onSelectInvoice: (invoiceId: string) => void
  onSelectAll: (invoiceIds: string[]) => void
  onInvoiceClick: (invoice: CargoInvoice | Invoice) => void
}

export function InvoiceTable({
  invoices,
  selectedInvoices,
  selectedInvoice,
  loading,
  onSelectInvoice,
  onSelectAll,
  onInvoiceClick
}: InvoiceTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectAll(invoices.map(inv => inv.id))
    } else {
      onSelectAll([])
    }
  }

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm pt-2" style={{ paddingBottom: "8px" }}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between pb-0 px-4 pt-0">
            <CardTitle className="text-black flex items-center gap-2 text-base pb-2">
              <Receipt className="h-4 w-4" />
              Invoice Management
            </CardTitle>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm">Loading invoices...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
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
              {invoices.map((invoice, index) => (
                <TableRow 
                  key={invoice.id || `invoice-${index}`} 
                  className={cn(
                    "hover:bg-gray-50 cursor-pointer",
                    selectedInvoice?.id === invoice.id && "bg-blue-50 border-blue-200"
                  )}
                  onClick={() => onInvoiceClick(invoice)}
                >
                  <TableCell className="border p-0.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        onSelectInvoice(invoice.id)
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
        </div>
      </CardContent>
    </Card>
  )
}
