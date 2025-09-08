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
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { ErrorBanner } from "@/components/ui/status-banner"
import { 
  UserCheck, 
  Plus, 
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerData } from "./hooks"
import { Customer, CustomerCode, CustomerWithCodes } from "./types"


export function CustomerManagement() {
  const {
    customers,
    customerCodes: existingCustomerCodes,
    loading,
    error,
    setError,
    toggleCustomer,
    deleteCustomer,
    createCustomer,
    updateCustomer,
    fetchCustomerCodes,
    updateCustomerCodes,
    refetch
  } = useCustomerData()
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCodes | null>(null)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    code: ""
  })
  const [customerCodes, setCustomerCodes] = useState<Array<{code: string, accounting_label: string}>>([{code: "", accounting_label: ""}])
  const [isCreating, setIsCreating] = useState(false)
  const [togglingCustomer, setTogglingCustomer] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter and sort customers based on search and sort order
  const filteredCustomers = customers
    .filter(customer => 
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(customerSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name)
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Pagination logic
  const totalItems = filteredCustomers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handleToggleCustomer = async (customerId: string) => {
    setTogglingCustomer(customerId)
    try {
      await toggleCustomer(customerId)
    } finally {
      setTogglingCustomer(null)
    }
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleEditCustomer = async (customer: CustomerWithCodes) => {
    setSelectedCustomer(customer)
    // Pre-populate form with customer data
    setNewCustomerForm({
      name: customer.name,
      code: customer.code
    })
    
    // Use existing codes from customer object or fetch if not available
    try {
      let codes = customer.codes
      if (!codes || codes.length === 0) {
        const fetchedCodes = await fetchCustomerCodes(customer.id)
        codes = Array.isArray(fetchedCodes) ? fetchedCodes : []
      }
      
      if (Array.isArray(codes) && codes.length > 0) {
        setCustomerCodes(codes.map((code: any) => ({
          code: code.code,
          accounting_label: code.accounting_label || ""
        })))
      } else {
        // Fallback to primary code if no codes found
        setCustomerCodes([{code: customer.code, accounting_label: ""}])
      }
    } catch (err) {
      console.error('Error fetching customer codes:', err)
      // Fallback to primary code
      setCustomerCodes([{code: customer.code, accounting_label: ""}])
    }
    
    setIsCustomerEditorOpen(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    await deleteCustomer(customerId)
  }

  const handleSaveCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      setError('Please fill in customer name')
      return
    }

    // Validate customer codes
    const validCodes = customerCodes.filter(code => code.code.trim())
    if (validCodes.length === 0) {
      setError('Please add at least one customer code')
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
        })

        if (result?.success) {
          // Update customer codes
          const codesResult = await updateCustomerCodes(selectedCustomer.id, validCodes)
          if (codesResult?.success) {
            // Refresh data to show updated codes
            setIsRefreshing(true)
            await refetch()
            setIsRefreshing(false)
            handleCloseModal()
          }
        }
      } else {
        // Create new customer
        const result = await createCustomer({
          name: newCustomerForm.name.trim(),
          code: validCodes[0].code.trim().toUpperCase(), // Use first code as primary
          email: `${validCodes[0].code.trim().toLowerCase()}@example.com`, // Default email
          phone: null,
          address: null,
          contact_person: null,
          priority: "medium",
          is_active: true,
          total_shipments: 0
        }, validCodes)

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
    setCustomerCodes([{code: "", accounting_label: ""}])
    setIsCustomerEditorOpen(true)
  }

  const handleCloseModal = () => {
    setNewCustomerForm({
      name: "",
      code: ""
    })
    setCustomerCodes([{code: "", accounting_label: ""}])
    setSelectedCustomer(null)
    setIsCustomerEditorOpen(false)
    setError(null)
  }

  // Customer codes management functions
  const addCustomerCode = () => {
    setCustomerCodes([...customerCodes, {code: "", accounting_label: ""}])
  }

  const removeCustomerCode = (index: number) => {
    if (customerCodes.length > 1) {
      setCustomerCodes(customerCodes.filter((_, i) => i !== index))
    }
  }

  const updateCustomerCode = (index: number, field: 'code' | 'accounting_label', value: string) => {
    const updated = [...customerCodes]
    updated[index] = { ...updated[index], [field]: value }
    setCustomerCodes(updated)
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
        <ErrorBanner 
          message={error}
          className="mb-4"
          onClose={() => setError(null)}
        />
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
                Add Customer Code
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="h-8 py-1 text-xs">Status</TableHead>
                  <TableHead className="h-8 py-1 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSortToggle}
                      className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                    >
                      Customer
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3 ml-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="h-8 py-1 text-xs">Codes</TableHead>
                  <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Get paginated filtered data
                  const startIndex = (currentPage - 1) * itemsPerPage
                  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
                  const currentPageData = filteredCustomers.slice(startIndex, endIndex)
                  
                  return currentPageData.map((customer) => (
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
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <div className="flex flex-wrap gap-1">
                        {/* Display primary code from customer table */}
                        {/* <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                          {customer.code}
                        </Badge> */}
                        {/* Display additional codes from customer_codes table */}
                        {customer.codes && customer.codes.length > 0 && customer.codes.map((codeItem, index) => (
                          <Badge 
                            key={codeItem.id || index} 
                            variant="secondary" 
                            className="font-mono text-xs px-1 py-0 h-5"
                          >
                            {codeItem.code}
                          </Badge>
                        ))}
                      </div>
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
                  ))
                })()}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredCustomers.length > 0 && (
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
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
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
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Customer Code' : 'Add Customer Code'}
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

              {/* Customer Codes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Customer Codes *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomerCode}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Code
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {customerCodes.map((codeItem, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`code-${index}`} className="text-xs text-gray-600">
                            Code *
                          </Label>
                          <Input
                            id={`code-${index}`}
                            value={codeItem.code}
                            onChange={(e) => updateCustomerCode(index, 'code', e.target.value.toUpperCase())}
                            placeholder="e.g., CPHA"
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`accounting-${index}`} className="text-xs text-gray-600">
                            Accounting Label
                          </Label>
                          <Input
                            id={`accounting-${index}`}
                            value={codeItem.accounting_label}
                            onChange={(e) => updateCustomerCode(index, 'accounting_label', e.target.value)}
                            placeholder="e.g., Danija 1"
                            className="text-sm"
                          />
                        </div>
                        {customerCodes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomerCode(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
              disabled={isCreating || !newCustomerForm.name.trim() || customerCodes.every(code => !code.code.trim())}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedCustomer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                selectedCustomer ? 'Update Customer Code' : 'Add Customer Code'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
