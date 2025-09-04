"use client"

import { useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  UserCheck, 
  Plus, 
  Edit,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

// Dummy customer data
interface Customer {
  id: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  contact_person: string
  priority: "high" | "medium" | "low"
  is_active: boolean
  created_date: string
  total_shipments: number
}

const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "Premium Express Ltd",
    code: "PREM001",
    email: "contact@premiumexpress.com",
    phone: "+371 2345 6789",
    address: "Riga, Latvia",
    contact_person: "Anna Berzina",
    priority: "high",
    is_active: true,
    created_date: "2023-01-15",
    total_shipments: 245
  },
  {
    id: "2",
    name: "Nordic Post AS",
    code: "NORD002",
    email: "info@nordicpost.ee",
    phone: "+372 5678 9012",
    address: "Tallinn, Estonia",
    contact_person: "Erik Saar",
    priority: "high",
    is_active: true,
    created_date: "2023-02-20",
    total_shipments: 189
  },
  {
    id: "3",
    name: "Baltic Express Network",
    code: "BALT003",
    email: "support@balticexpress.lt",
    phone: "+370 6789 0123",
    address: "Vilnius, Lithuania",
    contact_person: "Ruta Kazlauskas",
    priority: "medium",
    is_active: true,
    created_date: "2023-03-10",
    total_shipments: 156
  },
  {
    id: "4",
    name: "Cargo Masters International",
    code: "CARG004",
    email: "operations@cargomasters.com",
    phone: "+49 30 1234 5678",
    address: "Berlin, Germany",
    contact_person: "Hans Mueller",
    priority: "medium",
    is_active: true,
    created_date: "2023-04-05",
    total_shipments: 134
  },
  {
    id: "5",
    name: "General Mail Services",
    code: "GENM005",
    email: "service@generalmail.com",
    phone: "+33 1 2345 6789",
    address: "Paris, France",
    contact_person: "Marie Dubois",
    priority: "low",
    is_active: false,
    created_date: "2023-05-12",
    total_shipments: 78
  }
]

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const handleToggleCustomer = (customerId: string) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId ? { ...customer, is_active: !customer.is_active } : customer
    ))
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsCustomerEditorOpen(true)
  }

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(prev => prev.filter(customer => customer.id !== customerId))
    }
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Customer Management */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent>
          <div className="flex items-center justify-between pb-2">
            <CardTitle className="text-black flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Customer Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null)
                  setIsCustomerEditorOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCustomers(SAMPLE_CUSTOMERS)}
              >
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="h-8 py-1 text-xs">Status</TableHead>
                  <TableHead className="h-8 py-1 text-xs">Customer</TableHead>
                  <TableHead className="h-8 py-1 text-xs">Code</TableHead>
                  <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="">
                    <TableCell className="py-1 px-1">
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={customer.is_active}
                          onCheckedChange={() => handleToggleCustomer(customer.id)}
                          className="scale-75"
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          customer.is_active ? "text-green-600" : "text-gray-400"
                        )}>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div>
                        <p className="font-medium text-black text-sm leading-tight">{customer.name}</p>
                        <p className="text-xs text-gray-500 leading-tight">{customer.address}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                        {customer.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex gap-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditCustomer(customer)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No customers found matching your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
