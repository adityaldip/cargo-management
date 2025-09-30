"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorBanner } from "@/components/ui/status-banner"
import { 
  UserCheck, 
  Plus
} from "lucide-react"
import { useCustomerData } from "./hooks"
import { CustomerWithCodes } from "./types"
import { CustomerModal } from "./CustomerModal"
import { CustomerTable } from "./CustomerTable"


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
    fetchCustomerCodes,
    updateCustomerCodes,
    toggleCustomerCode,
    refetch
  } = useCustomerData()
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customerCodeAssignmentEnabled, setCustomerCodeAssignmentEnabled] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCodes | null>(null)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)
  
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

  const handleSaveCustomer = async (customerData: any, products: Array<{product: string}>) => {
    if (!customerData.name.trim()) {
      setError('Please fill in customer name')
      return
    }

    if (!customerData.email.trim()) {
      setError('Please fill in email address')
      return
    }

    // Validate contractee code
    if (!customerData.code.trim()) {
      setError('Please fill in contractee code')
      return
    }

    // Validate products
    const validProducts = products.filter(code => code.product.trim())
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
          name: customerData.name.trim(),
          email: customerData.email.trim(),
          phone: customerData.phone.trim() || null,
          address: customerData.address.trim() || null,
          city: customerData.city.trim() || null,
          state: customerData.state.trim() || null,
          postal_code: customerData.postal_code.trim() || null,
          country: customerData.country.trim() || null,
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
          name: customerData.name.trim(),
          code: customerData.code.trim().toUpperCase(),
          email: customerData.email.trim() || `${customerData.code.trim().toLowerCase()}@example.com`,
          phone: customerData.phone.trim() || null,
          address: customerData.address.trim() || null,
          city: customerData.city.trim() || null,
          state: customerData.state.trim() || null,
          postal_code: customerData.postal_code.trim() || null,
          country: customerData.country.trim() || null,
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
          
          <CustomerTable
            customers={customers}
            loading={loading}
            customerSearchTerm={customerSearchTerm}
            setCustomerSearchTerm={setCustomerSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            customerCodeAssignmentEnabled={customerCodeAssignmentEnabled}
            setCustomerCodeAssignmentEnabled={setCustomerCodeAssignmentEnabled}
            togglingCustomers={togglingCustomers}
            onToggleCustomer={handleToggleCustomer}
            onToggleCustomerCode={handleToggleCustomerCode}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onRefresh={refetch}
            isRefreshing={isRefreshing}
          />
        </CardContent>
      </Card>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerEditorOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCustomer}
        selectedCustomer={selectedCustomer}
        customerForm={newCustomerForm}
        setCustomerForm={setNewCustomerForm}
        customerCodes={customerCodes}
        setCustomerCodes={setCustomerCodes}
        isCreating={isCreating}
        error={error}
      />
    </div>
  )
}
