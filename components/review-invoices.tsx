"use client"

import { useState, useMemo, useEffect } from "react"
import jsPDF from 'jspdf'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Receipt, 
  Download, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Eye,
  FileText,
  Calendar,
  Euro,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProcessedData } from "@/types/cargo-data"

interface ReviewInvoicesProps {
  data: ProcessedData | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  date: string
  dueDate: string
  amount: number
  status: "paid" | "pending" | "overdue" | "draft"
  items: number
  totalWeight: number
  route: string
  paymentMethod?: string
}

// Sample invoice data
const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2025-001",
    customer: "AirMail Limited",
    date: "2025-01-15",
    dueDate: "2025-02-14",
    amount: 2847.50,
    status: "paid",
    items: 25,
    totalWeight: 156.8,
    route: "USFRAT → USRIXT",
    paymentMethod: "Bank Transfer"
  },
  {
    id: "2",
    invoiceNumber: "INV-2025-002",
    customer: "Euro Express",
    date: "2025-01-18",
    dueDate: "2025-02-17",
    amount: 4125.75,
    status: "pending",
    items: 18,
    totalWeight: 234.6,
    route: "DKCPHA → FRANK"
  },
  {
    id: "3",
    invoiceNumber: "INV-2025-003",
    customer: "Nordic Post",
    date: "2025-01-10",
    dueDate: "2025-02-09",
    amount: 3456.80,
    status: "overdue",
    items: 32,
    totalWeight: 287.3,
    route: "SEARNK → OSLO"
  },
  {
    id: "4",
    invoiceNumber: "INV-2025-004",
    customer: "Central Mail",
    date: "2025-01-22",
    dueDate: "2025-02-21",
    amount: 5802.30,
    status: "draft",
    items: 42,
    totalWeight: 892.4,
    route: "CZPRG → DEBER"
  },
  {
    id: "5",
    invoiceNumber: "INV-2025-005",
    customer: "Scan Mail",
    date: "2025-01-25",
    dueDate: "2025-02-24",
    amount: 3458.20,
    status: "pending",
    items: 28,
    totalWeight: 456.7,
    route: "SEARNK → OSLOG"
  }
]

// Pre-existing customer data for demo purposes
const preExistingCustomers = [
  {
    customer: "AirMail Limited / ZZXDA14",
    totalKg: 245.8,
    totalEur: 1250.75,
    parcels: 45,
    euRevenue: 850.25,
    nonEuRevenue: 400.5,
    routes: new Set(["USFRAT → USRIXT", "USFRAT → USROMT", "USFRAT → USVNOT"]),
  },
  {
    customer: "Euro Express",
    totalKg: 312.4,
    totalEur: 1564.2,
    parcels: 52,
    euRevenue: 1100.15,
    nonEuRevenue: 464.05,
    routes: new Set(["DKCPHA → FRANK", "GBLON → FRANK"]),
  },
  {
    customer: "Nordic Post",
    totalKg: 189.3,
    totalEur: 945.2,
    parcels: 32,
    euRevenue: 945.2,
    nonEuRevenue: 0,
    routes: new Set(["SEARNK → OSLO", "DKCPH → GBLON"]),
  },
  {
    customer: "Central Mail",
    totalKg: 456.7,
    totalEur: 2283.5,
    parcels: 78,
    euRevenue: 1825.8,
    nonEuRevenue: 457.7,
    routes: new Set(["CZPRG → DEBER", "CZPRG → FRANK"]),
  },
  {
    customer: "Scan Mail",
    totalKg: 203.1,
    totalEur: 1015.5,
    parcels: 35,
    euRevenue: 1015.5,
    nonEuRevenue: 0,
    routes: new Set(["SEARNK → OSLOG", "SEARNK → DKCPH"]),
  }
]

export function ReviewInvoices({ data }: ReviewInvoicesProps) {
  const [invoices] = useState<Invoice[]>(SAMPLE_INVOICES)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"revenue" | "weight" | "parcels">("revenue")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  
  // Track if component has hydrated to prevent hydration mismatch
  const [isHydrated, setIsHydrated] = useState(false)

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.route.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Paginated invoices
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage)

  // Calculate summary statistics
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = filteredInvoices.filter(inv => inv.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingAmount = filteredInvoices.filter(inv => inv.status === "pending").reduce((sum, invoice) => sum + invoice.amount, 0)
  const overdueAmount = filteredInvoices.filter(inv => inv.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0)

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

  const getStatusBadge = (status: Invoice["status"]) => {
    const statusConfig = {
      paid: { label: "Paid", className: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      overdue: { label: "Overdue", className: "bg-red-100 text-red-800", icon: AlertTriangle },
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800", icon: FileText }
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <Badge className={cn("flex items-center gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on invoices:`, selectedInvoices)
    // Here you would implement the bulk action logic
  }

  const handleDownloadClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPdfPreview(true)
  }

  const closePdfPreview = () => {
    setShowPdfPreview(false)
    setSelectedInvoice(null)
  }

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica')
    
    // Company header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('CARGO MANAGEMENT LTD', 20, 30)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('123 Business Street, Business City, BC 12345', 20, 40)
    doc.text('Phone: +1 (555) 123-4567 | Email: info@cargomgmt.com', 20, 45)
    
    // Invoice details (right side)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 150, 30)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('INVOICE NO:', 150, 40)
    doc.text(invoice.invoiceNumber, 180, 40)
    
    doc.text('DATE:', 150, 45)
    doc.text(new Date(invoice.date).toLocaleDateString('en-GB'), 180, 45)
    
    doc.text('DUE DATE:', 150, 50)
    doc.text(new Date(invoice.dueDate).toLocaleDateString('en-GB'), 180, 50)
    
    // Issued to section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ISSUED TO:', 20, 70)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.customer, 20, 80)
    doc.text('123 Business Street', 20, 85)
    doc.text('Business City, BC 12345', 20, 90)
    
    // Pay to section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PAY TO:', 20, 110)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Cargo Management Ltd', 20, 120)
    doc.text('Account Name: Cargo Management', 20, 125)
    doc.text('Account No.: 1234 5678 9012', 20, 130)
    
    // Cargo Shipment Details Table
    const startY = 150
    const lineHeight = 8
    const tableWidth = 170
    const colWidths = [30, 20, 20, 20, 30, 30, 30] // Sector, empty, empty, Mail Cat, Total KG, Rate, Total EUR
    
    // Table headers
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('SECTOR', 20, startY)
    doc.text('MAIL CAT.', 80, startY)
    doc.text('TOTAL KG', 110, startY)
    doc.text('RATE', 140, startY)
    doc.text('TOTAL EUR', 170, startY)
    
    // Draw line under headers
    doc.line(20, startY + 2, 200, startY + 2)
    
    // Sample cargo data based on invoice
    const cargoData = [
      { sector: 'DUS RIX', mailCat: 'A,B', totalKg: 16.6, rate: 1.0, totalEur: 16.6 },
      { sector: 'VNO FRA', mailCat: 'A,B', totalKg: 22.2, rate: 0.85, totalEur: 18.87 },
      { sector: 'BUD ATH', mailCat: 'A,B', totalKg: 138.5, rate: 1.0, totalEur: 138.5 },
      { sector: 'ATH RIX', mailCat: 'A,B', totalKg: 248.2, rate: 0.85, totalEur: 210.97 },
      { sector: 'ATH ARN', mailCat: 'A,B', totalKg: 45.3, rate: 0.9, totalEur: 40.77 },
      { sector: 'ATH KEF', mailCat: 'A,B', totalKg: 12.8, rate: 0.85, totalEur: 10.88 },
      { sector: 'ATH RMO', mailCat: 'A,B', totalKg: 67.4, rate: 0.9, totalEur: 60.66 },
      { sector: 'ATH LJU', mailCat: 'A,B', totalKg: 23.1, rate: 0.8, totalEur: 18.48 },
      { sector: 'OSL TLL', mailCat: 'A,B', totalKg: 0.1, rate: 0.9, totalEur: 0.09 },
      { sector: 'BUD VNO', mailCat: 'A,B', totalKg: 2490.7, rate: 0.8523908941, totalEur: 2123.05 }
    ]
    
    // Line items
    doc.setFont('helvetica', 'normal')
    let currentY = startY + 10
    
    cargoData.forEach(item => {
      doc.text(item.sector, 20, currentY)
      doc.text(item.mailCat, 80, currentY)
      doc.text(item.totalKg.toString(), 110, currentY)
      doc.text(item.rate.toString(), 140, currentY)
      doc.text(`€${item.totalEur.toFixed(2)}`, 170, currentY)
      currentY += lineHeight
    })
    
    // Draw line under items
    doc.line(20, currentY + 2, 200, currentY + 2)
    
    // Summary section
    currentY += 10
    const totalKg = cargoData.reduce((sum, item) => sum + item.totalKg, 0)
    const totalEur = cargoData.reduce((sum, item) => sum + item.totalEur, 0)
    const avgRate = totalEur / totalKg
    
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', 20, currentY)
    doc.text('', 80, currentY) // Empty for mail cat
    doc.text(totalKg.toFixed(1), 110, currentY)
    doc.text(avgRate.toFixed(10), 140, currentY)
    doc.text(`€${totalEur.toFixed(2)}`, 170, currentY)
    
    // Additional invoice summary
    currentY += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const subtotal = totalEur * 0.9
    const tax = totalEur * 0.1
    const finalTotal = totalEur
    
    doc.text('SUBTOTAL:', 120, currentY)
    doc.text(`€${subtotal.toFixed(2)}`, 180, currentY)
    currentY += lineHeight
    
    doc.text('Tax:', 120, currentY)
    doc.text('10%', 180, currentY)
    currentY += lineHeight
    
    // Total line
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', 120, currentY)
    doc.text(`€${finalTotal.toFixed(2)}`, 180, currentY)
    
    // Footer
    currentY += 20
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Thank you for your business!', 20, currentY)
    doc.text('Payment is due within 30 days of invoice date.', 20, currentY + 5)
    
    // Save the PDF
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
  }

  // Export function
  const handleExport = () => {
    const csvData = filteredInvoices.map(invoice => ({
      "Invoice Number": invoice.invoiceNumber,
      "Customer": invoice.customer,
      "Date": invoice.date,
      "Amount": `€${invoice.amount.toFixed(2)}`,
      "Total Weight": `${invoice.totalWeight}kg`,
      "Payment Method": invoice.paymentMethod || ""
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'invoices.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Sample Data Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-800 font-medium">
            This is sample data and not connected to the database yet
          </p>
        </div>
      </div>

      {/* Main Content with PDF Preview */}
      <div className="flex gap-4">
        {/* Invoices Table */}
        <div className={cn("transition-all duration-300", showPdfPreview ? "w-1/2" : "w-full")}>
          <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Management
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table className="border border-collapse text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="border w-8 p-1 text-center">
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
                  <TableHead className="border p-2">Invoice</TableHead>
                  <TableHead className="border p-2">Customer</TableHead>
                  <TableHead className="border p-2">Date</TableHead>
                  <TableHead className="border p-2">Amount</TableHead>
                  <TableHead className="border p-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="border p-1 text-center">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="rounded border-gray-300"
                        title={`Select invoice ${invoice.invoiceNumber}`}
                      />
                    </TableCell>
                    <TableCell className="border p-2 font-medium">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{invoice.invoiceNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="border p-2 text-xs">{invoice.customer}</TableCell>
                    <TableCell className="border p-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{new Date(invoice.date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="border p-2">
                      <div className="text-xs">
                        <div>{invoice.items} items</div>
                        <div className="text-gray-500">{invoice.totalWeight}kg</div>
                      </div>
                    </TableCell>
                    <TableCell className="border p-1 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleDownloadClick(invoice)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
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
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-16 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
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
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded">
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
        {showPdfPreview && selectedInvoice && (
          <div className="w-1/2">
            <Card className="bg-white border-gray-200 shadow-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-black flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice Preview
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePdfPreview}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-full overflow-auto">
                <div className="bg-white border border-gray-200 rounded-lg p-8 h-full">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">ISSUED TO:</h2>
                        <div className="text-sm text-gray-700">
                          <div>{selectedInvoice.customer}</div>
                          <div>123 Business Street</div>
                          <div>Business City, BC 12345</div>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-800 mb-2">PAY TO:</h2>
                        <div className="text-sm text-gray-700">
                          <div>Cargo Management Ltd</div>
                          <div>Account Name: Cargo Management</div>
                          <div>Account No.: 1234 5678 9012</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex justify-between w-48">
                        <span className="text-sm text-gray-700">INVOICE NO:</span>
                        <span className="text-sm font-semibold">{selectedInvoice.invoiceNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Shipment Details Table */}
                  <div className="mb-8">
                    <div className="border-t border-gray-300 pt-4">
                      <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-gray-800 mb-4">
                        <div>SECTOR</div>
                        <div>MAIL CAT.</div>
                        <div className="text-right">TOTAL KG</div>
                        <div className="text-right">RATE</div>
                        <div className="text-right">TOTAL EUR</div>
                      </div>
                      
                      {/* Sample cargo data */}
                      <div className="space-y-2">
                        {[
                          { sector: 'DUS RIX', mailCat: 'A,B', totalKg: 16.6, rate: 1.0, totalEur: 16.6 },
                          { sector: 'VNO FRA', mailCat: 'A,B', totalKg: 22.2, rate: 0.85, totalEur: 18.87 },
                          { sector: 'BUD ATH', mailCat: 'A,B', totalKg: 138.5, rate: 1.0, totalEur: 138.5 },
                          { sector: 'ATH RIX', mailCat: 'A,B', totalKg: 248.2, rate: 0.85, totalEur: 210.97 },
                          { sector: 'ATH ARN', mailCat: 'A,B', totalKg: 45.3, rate: 0.9, totalEur: 40.77 },
                          { sector: 'ATH KEF', mailCat: 'A,B', totalKg: 12.8, rate: 0.85, totalEur: 10.88 },
                          { sector: 'ATH RMO', mailCat: 'A,B', totalKg: 67.4, rate: 0.9, totalEur: 60.66 },
                          { sector: 'ATH LJU', mailCat: 'A,B', totalKg: 23.1, rate: 0.8, totalEur: 18.48 },
                          { sector: 'OSL TLL', mailCat: 'A,B', totalKg: 0.1, rate: 0.9, totalEur: 0.09 },
                          { sector: 'BUD VNO', mailCat: 'A,B', totalKg: 2490.7, rate: 0.8523908941, totalEur: 2123.05 }
                        ].map((item, index) => (
                          <div key={index} className="grid grid-cols-5 gap-4 text-sm text-gray-700 py-1">
                            <div className="font-mono">{item.sector}</div>
                            <div>{item.mailCat}</div>
                            <div className="text-right">{item.totalKg}</div>
                            <div className="text-right">{item.rate}</div>
                            <div className="text-right font-semibold">€{item.totalEur.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-gray-300 mt-4 pt-4">
                        <div className="grid grid-cols-5 gap-4 text-sm font-bold text-gray-800">
                          <div>TOTAL</div>
                          <div></div>
                          <div className="text-right">9952.7</div>
                          <div className="text-right">0.8511680248</div>
                          <div className="text-right">€8471.42</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => generatePDF(selectedInvoice)}
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
