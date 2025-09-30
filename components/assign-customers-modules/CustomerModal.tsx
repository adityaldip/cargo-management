"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { CustomerWithCodes } from "./types"

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customerData: any, products: Array<{product: string}>) => Promise<void>
  selectedCustomer: CustomerWithCodes | null
  customerForm: {
    name: string
    code: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  setCustomerForm: (form: any) => void
  customerCodes: Array<{product: string}>
  setCustomerCodes: (codes: Array<{product: string}>) => void
  isCreating: boolean
  error: string | null
}

export function CustomerModal({
  isOpen,
  onClose,
  onSave,
  selectedCustomer,
  customerForm,
  setCustomerForm,
  customerCodes,
  setCustomerCodes,
  isCreating,
  error
}: CustomerModalProps) {
  const handleSave = async () => {
    if (!customerForm.name.trim()) {
      return
    }

    if (!customerForm.email.trim()) {
      return
    }

    if (!customerForm.code.trim()) {
      return
    }

    const validProducts = customerCodes.filter(code => code.product.trim())
    if (validProducts.length === 0) {
      return
    }

    await onSave(customerForm, validProducts)
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter contractee name"
                  className="w-full h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="code" className="text-sm">Contractee Code *</Label>
                <Input
                  id="code"
                  value={customerForm.code}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CPHA"
                  className="w-full font-mono h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className="w-full h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="w-full h-8"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="address" className="text-sm">Address</Label>
                <Input
                  id="address"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
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
                  value={customerForm.city}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  className="w-full h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="state" className="text-sm">State/Province</Label>
                <Input
                  id="state"
                  value={customerForm.state}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state or province"
                  className="w-full h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postal_code" className="text-sm">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={customerForm.postal_code}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="Enter postal code"
                  className="w-full h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="country" className="text-sm">Country</Label>
                <Input
                  id="country"
                  value={customerForm.country}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                  className="w-full h-8"
                />
              </div>
            </div>
          </div>

          {/* Contractee Code and Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Contractee Products *</h3>
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
            onClick={onClose}
            disabled={isCreating}
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isCreating || !customerForm.name.trim() || !customerForm.email.trim() || !customerForm.code.trim() || customerCodes.every(code => !code.product.trim())}
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
  )
}
