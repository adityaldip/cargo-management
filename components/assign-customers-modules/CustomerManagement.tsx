"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown } from "lucide-react"
import { ErrorBanner } from "@/components/ui/status-banner"
import { 
  UserCheck, 
  Plus, 
  Edit,
  Trash2,
  X,
  Loader2
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
    toggleCustomerCode,
    refetch
  } = useCustomerData()
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customerCodeAssignmentEnabled, setCustomerCodeAssignmentEnabled] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCodes | null>(null)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20) // Increased default page size
  const [showAll, setShowAll] = useState(false)
  
  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: ""
  })
  const [customerCodes, setCustomerCodes] = useState<Array<{product: string}>>([{product: ""}])
  const [isCreating, setIsCreating] = useState(false)
  const [togglingCustomers, setTogglingCustomers] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(customerSearchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [customerSearchTerm])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, statusFilter])

  // Memoized filtered customers for better performance
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer => {
        // Search filter
        const matchesSearch = customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          customer.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (customer.codes && customer.codes.some(code => 
            code.product && typeof code.product === 'string' && code.product.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          ))
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'active' && customer.is_active) ||
          (statusFilter === 'inactive' && !customer.is_active)
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name)
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [customers, debouncedSearchTerm, statusFilter, sortOrder])

  // Pagination logic with performance optimization
  const totalItems = filteredCustomers.length
  const displayItems = showAll ? filteredCustomers : filteredCustomers.slice(0, itemsPerPage)
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const hasMoreItems = filteredCustomers.length > itemsPerPage

  const handleToggleCustomer = async (customerId: string) => {
    // Prevent multiple toggles on the same customer
    if (togglingCustomers.has(customerId)) {
      return
    }

    try {
      // Add to toggling set
      setTogglingCustomers(prev => new Set(prev).add(customerId))
      setError(null)
      
      await toggleCustomer(customerId)
    } catch (err) {
      const errorMsg = `Failed to toggle customer: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
    } finally {
      // Remove from toggling set
      setTogglingCustomers(prev => {
        const newSet = new Set(prev)
        newSet.delete(customerId)
        return newSet
      })
    }
  }

  const handleToggleCustomerCode = async (customerId: string, codeId: string | number) => {
    // Find the customer and code
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    const codeIndex = customer.codes.findIndex(code => 
      (typeof codeId === 'string' && code.id === codeId) || 
      (typeof codeId === 'number' && customer.codes.indexOf(code) === codeId)
    )
    
    if (codeIndex === -1) return

    const code = customer.codes[codeIndex]
    const newActiveState = !code.is_active

    // Call the API to toggle the customer code
    if (typeof codeId === 'string') {
      await toggleCustomerCode(codeId, newActiveState)
    } else {
      console.warn('Cannot toggle customer code without proper ID')
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
      code: customer.code,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      postal_code: customer.postal_code || "",
      country: customer.country || ""
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
          product: code.product || ""
        })))
      } else {
        // Fallback to empty product if no codes found
        setCustomerCodes([{product: ""}])
      }
    } catch (err) {
      console.error('Error fetching customer codes:', err)
      // Fallback to empty product
      setCustomerCodes([{product: ""}])
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

    if (!newCustomerForm.email.trim()) {
      setError('Please fill in email address')
      return
    }

    // Validate contractee code
    if (!newCustomerForm.code.trim()) {
      setError('Please fill in contractee code')
      return
    }

    // Validate products
    const validProducts = customerCodes.filter(code => code.product.trim())
    if (validProducts.length === 0) {
      setError('Please add at least one product')
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
          email: newCustomerForm.email.trim(),
          phone: newCustomerForm.phone.trim() || null,
          address: newCustomerForm.address.trim() || null,
          city: newCustomerForm.city.trim() || null,
          state: newCustomerForm.state.trim() || null,
          postal_code: newCustomerForm.postal_code.trim() || null,
          country: newCustomerForm.country.trim() || null,
        })

        if (result?.success) {
          // Update customer codes
          const codesResult = await updateCustomerCodes(selectedCustomer.id, validProducts)
          if (codesResult?.success) {
            handleCloseModal()
          }
        }
      } else {
        // Create new customer
        const result = await createCustomer({
          name: newCustomerForm.name.trim(),
          code: newCustomerForm.code.trim().toUpperCase(),
          email: newCustomerForm.email.trim() || `${newCustomerForm.code.trim().toLowerCase()}@example.com`,
          phone: newCustomerForm.phone.trim() || null,
          address: newCustomerForm.address.trim() || null,
          city: newCustomerForm.city.trim() || null,
          state: newCustomerForm.state.trim() || null,
          postal_code: newCustomerForm.postal_code.trim() || null,
          country: newCustomerForm.country.trim() || null,
          contact_person: null,
          priority: "medium",
          is_active: true,
          total_shipments: 0
        }, validProducts)

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
      code: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: ""
    })
    setCustomerCodes([{product: ""}])
    setIsCustomerEditorOpen(true)
  }

  const handleCloseModal = () => {
    setNewCustomerForm({
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: ""
    })
    setCustomerCodes([{product: ""}])
    setSelectedCustomer(null)
    setIsCustomerEditorOpen(false)
    setError(null)
  }

  // Customer codes management functions
  const addCustomerCode = () => {
    setCustomerCodes([...customerCodes, {product: ""}])
  }

  const removeCustomerCode = (index: number) => {
    if (customerCodes.length > 1) {
      setCustomerCodes(customerCodes.filter((_, i) => i !== index))
    }
  }

  const updateCustomerCode = (index: number, field: 'product', value: string) => {
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
                Contractee Management
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
              Contractee Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNewCustomer}
                disabled={!customerCodeAssignmentEnabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contractee
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
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="h-8 w-auto min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Search and Code Assignment Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search contractees by name, code, or product..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full pr-8"
              />
              {customerSearchTerm !== debouncedSearchTerm && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={customerCodeAssignmentEnabled}
                onCheckedChange={setCustomerCodeAssignmentEnabled}
                className="scale-75"
              />
              <span className="text-sm text-gray-600">Allow Product Assignment</span>
            </div>
          </div>
          
          {/* Results Summary */}
          {filteredCustomers.length > 0 && (
            <div className="mb-3 text-sm text-gray-600">
              Showing {filteredCustomers.length} contractee{filteredCustomers.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && ` (${statusFilter} only)`}
              {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
              {!customerCodeAssignmentEnabled && (
                <span className="ml-2 text-orange-600 font-medium">
                  • Product Assignment Disabled
                </span>
              )}
            </div>
          )}
          
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
                      Contractee
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3 ml-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="h-8 py-1 text-xs">Code</TableHead>
                  <TableHead className="h-8 py-1 text-xs">Products</TableHead>
                  <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((customer) => (
                  <TableRow key={customer.id} className="">
                    <TableCell className="py-1 px-1">
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <Switch
                            checked={customer.is_active}
                            onCheckedChange={() => handleToggleCustomer(customer.id)}
                            disabled={togglingCustomers.has(customer.id)}
                            className="scale-75"
                          />
                          {togglingCustomers.has(customer.id) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                            </div>
                          )}
                        </div>
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
                      <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                        {customer.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <div className="flex flex-wrap gap-1">
                        {/* Display products from customer_codes table */}
                        {customer.codes && customer.codes.length > 0 ? customer.codes.map((codeItem, index) => (
                          <div key={codeItem.id || index} className="flex items-center gap-1">
                            <Switch
                              checked={codeItem.is_active}
                              onCheckedChange={() => handleToggleCustomerCode(customer.id, codeItem.id || index)}
                              disabled={!customerCodeAssignmentEnabled}
                              className="scale-50"
                            />
                            <Badge 
                              variant={codeItem.is_active ? "secondary" : "outline"} 
                              className={cn(
                                "text-xs px-1 py-0 h-5",
                                !codeItem.is_active && "opacity-50"
                              )}
                            >
                              {codeItem.product || 'No Product'}
                            </Badge>
                          </div>
                        )) : (
                          <span className="text-xs text-gray-400">No products</span>
                        )}
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Performance Controls */}
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setShowAll(false)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {showAll ? `Showing all ${totalItems} entries` : `Showing ${displayItems.length} of ${totalItems} entries`}
                </span>
                
                {hasMoreItems && !showAll && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(true)}
                  >
                    Show All
                  </Button>
                )}
                
                {showAll && hasMoreItems && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(false)}
                  >
                    Show Less
                  </Button>
                )}
              </div>
            </div>
          )}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No contractees found matching your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Modal */}
      <Dialog open={isCustomerEditorOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">
              {selectedCustomer ? 'Edit Contractee' : 'Add Contractee'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Contractee Name *</Label>
                  <Input
                    id="name"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter contractee name"
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="code" className="text-sm">Contractee Code *</Label>
                  <Input
                    id="code"
                    value={newCustomerForm.code}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., CPHA"
                    className="w-full font-mono h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="address" className="text-sm">Address</Label>
                  <Input
                    id="address"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter street address"
                    className="w-full h-8"
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-900">Address Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-sm">City</Label>
                  <Input
                    id="city"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state" className="text-sm">State/Province</Label>
                  <Input
                    id="state"
                    value={newCustomerForm.state}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter state or province"
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postal_code" className="text-sm">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={newCustomerForm.postal_code}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="Enter postal code"
                    className="w-full h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-sm">Country</Label>
                  <Input
                    id="country"
                    value={newCustomerForm.country}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter country"
                    className="w-full h-8"
                  />
                </div>
              </div>
            </div>

            {/* Contractee Code and Products Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900">Contractee Code & Products *</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomerCode}
                  className="flex items-center gap-1 h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Product
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="space-y-2">
                  {customerCodes.map((codeItem, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`product-${index}`} className="text-xs text-gray-600">
                          Product *
                        </Label>
                        <Input
                          id={`product-${index}`}
                          value={codeItem.product}
                          onChange={(e) => updateCustomerCode(index, 'product', e.target.value)}
                          placeholder="e.g., Express Mail"
                          className="text-sm h-8"
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
          
          <DialogFooter className="pt-2">
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              disabled={isCreating}
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomer}
              disabled={isCreating || !newCustomerForm.name.trim() || !newCustomerForm.email.trim() || !newCustomerForm.code.trim() || customerCodes.every(code => !code.product.trim())}
              size="sm"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedCustomer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                selectedCustomer ? 'Update Contractee' : 'Add Contractee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
