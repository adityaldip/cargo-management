"use client"

import { useState } from "react"
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
  Euro
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

export function ReviewInvoices({ data }: ReviewInvoicesProps) {
  const [invoices] = useState<Invoice[]>(SAMPLE_INVOICES)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.route.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate summary statistics
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = filteredInvoices.filter(inv => inv.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingAmount = filteredInvoices.filter(inv => inv.status === "pending").reduce((sum, invoice) => sum + invoice.amount, 0)
  const overdueAmount = filteredInvoices.filter(inv => inv.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0)

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* <p className="text-gray-600">Review and manage generated invoices from processed cargo data</p> */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-black">{filteredInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-black">€{totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">€{paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">€{overdueAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Management
            </CardTitle>
            <div className="flex gap-2">
              {selectedInvoices.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction("download")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download ({selectedInvoices.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction("send")}
                  >
                    Send ({selectedInvoices.length})
                  </Button>
                </>
              )}
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Receipt className="h-4 w-4 mr-2" />
                Generate New Invoice
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search invoices, customers, or routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(filteredInvoices.map(inv => inv.id))
                        } else {
                          setSelectedInvoices([])
                        }
                      }}
                      className="rounded border-gray-300"
                      title="Select all invoices"
                    />
                  </TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="rounded border-gray-300"
                        title={`Select invoice ${invoice.invoiceNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        {invoice.invoiceNumber}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{invoice.route}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(invoice.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      €{invoice.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{invoice.items} items</div>
                        <div className="text-gray-500">{invoice.totalWeight}kg</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  )
}
