"use client"

import { useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  UserCheck, 
  Plus, 
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerData } from "./hooks"
import { Customer } from "./types"


export function CustomerManagement() {
  const {
    customers,
    loading,
    error,
    setError,
    toggleCustomer,
    deleteCustomer,
    createCustomer,
    updateCustomer,
    refetch
  } = useCustomerData()
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)
  
  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    code: ""
  })
  const [isCreating, setIsCreating] = useState(false)
  const [togglingCustomer, setTogglingCustomer] = useState<string | null>(null)

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const handleToggleCustomer = async (customerId: string) => {
    setTogglingCustomer(customerId)
    try {
      await toggleCustomer(customerId)
    } finally {
      setTogglingCustomer(null)
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    // Pre-populate form with customer data
    setNewCustomerForm({
      name: customer.name,
      code: customer.code
    })
    setIsCustomerEditorOpen(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    await deleteCustomer(customerId)
  }

  const handleSaveCustomer = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.code.trim()) {
      setError('Please fill in all required fields (Name, Code)')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const isEditing = selectedCustomer !== null
      
      if (isEditing) {
        // Update existing customer
        const result = await updateCustomer(selectedCustomer.id, {
          name: newCustomerForm.name.trim(),
          code: newCustomerForm.code.trim().toUpperCase(),
        })

        if (result?.success) {
          handleCloseModal()
        }
      } else {
        // Create new customer
        const result = await createCustomer({
          name: newCustomerForm.name.trim(),
          code: newCustomerForm.code.trim().toUpperCase(),
          email: `${newCustomerForm.code.trim().toLowerCase()}@example.com`, // Default email
          phone: null,
          address: null,
          contact_person: null,
          priority: "medium",
          is_active: true,
          total_shipments: 0
        })

        if (result?.success) {
          handleCloseModal()
        }
      }
    } catch (err) {
      console.error('Error saving customer:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateNewCustomer = () => {
    setSelectedCustomer(null)
    setNewCustomerForm({
      name: "",
      code: ""
    })
    setIsCustomerEditorOpen(true)
  }

  const handleCloseModal = () => {
    setNewCustomerForm({
      name: "",
      code: ""
    })
    setSelectedCustomer(null)
    setIsCustomerEditorOpen(false)
    setError(null)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between pb-2">
              <CardTitle className="text-black flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Customer Management
              </CardTitle>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-3 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

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
                onClick={handleCreateNewCustomer}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
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
                          disabled={togglingCustomer === customer.id}
                          className="scale-75"
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          customer.is_active ? "text-green-600" : "text-gray-400"
                        )}>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <div>
                        <p className="font-medium text-black text-sm leading-tight">{customer.name}</p>
                        <p className="text-xs text-gray-500 leading-tight">{customer.address || 'No address'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                        {customer.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 px-2">
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

      {/* Create Customer Modal */}
      <Dialog open={isCustomerEditorOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Customer' : 'Create New Customer'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Customer Code *</Label>
                <Input
                  id="code"
                  value={newCustomerForm.code}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Enter customer code (e.g., CUST001)"
                  className="w-full font-mono"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomer}
              disabled={isCreating || !newCustomerForm.name.trim() || !newCustomerForm.code.trim()}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedCustomer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                selectedCustomer ? 'Update Customer' : 'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
