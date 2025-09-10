"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { CustomerRuleExtended } from "./types"
import { supabase } from "@/lib/supabase"

interface CreateCustomerRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ruleData: Partial<CustomerRuleExtended>) => Promise<{ success: boolean; error?: string }>
}

interface RuleCondition {
  field: string
  operator: string
  value: string
}

export function CreateCustomerRuleModal({ isOpen, onClose, onSave }: CreateCustomerRuleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true
  })
  
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { field: "orig_oe", operator: "equals", value: "" }
  ])
  
  const [assignTo, setAssignTo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<{id: string, name: string, code: string, codes: {id: string, code: string, is_active: boolean}[]}[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [conditionLogic, setConditionLogic] = useState<"AND" | "OR">("AND")

  // Available field options from cargo_data columns (matching RulesConfiguration)
  const cargoDataFields = [
    { key: 'inb_flight_date', label: 'Inb. Flight Date' },
    { key: 'outb_flight_date', label: 'Outb. Flight Date' },
    { key: 'rec_id', label: 'Rec. ID' },
    { key: 'des_no', label: 'Des. No.' },
    { key: 'rec_numb', label: 'Rec. Number' },
    { key: 'orig_oe', label: 'Orig. OE' },
    { key: 'dest_oe', label: 'Dest. OE' },
    { key: 'inb_flight_no', label: 'Inb. Flight No.' },
    { key: 'outb_flight_no', label: 'Outb. Flight No.' },
    { key: 'mail_cat', label: 'Mail Category' },
    { key: 'mail_class', label: 'Mail Class' },
    { key: 'total_kg', label: 'Total Weight (kg)' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'assigned_customer', label: 'Customer' },
    { key: 'assigned_rate', label: 'Rate' }
  ]

  // Load customers from Supabase with their active codes
  useEffect(() => {
    const loadCustomers = async () => {
      if (!isOpen || customers.length > 0) {
        return
      }

      setLoadingCustomers(true)
      try {
        // First get all active customers
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name, code')
          .eq('is_active', true)
          .order('name')
        
        if (customersError) {
          console.error('Error loading customers:', customersError)
          return
        }

        if (!customersData || customersData.length === 0) {
          setCustomers([])
          return
        }

        // Get customer IDs for fetching codes
        const customerIds = customersData.map((c: any) => c.id)
        
        // Get all active codes for these customers
        const { data: codesData, error: codesError } = await supabase
          .from('customer_codes')
          .select('id, customer_id, code, is_active')
          .in('customer_id', customerIds)
          .eq('is_active', true)
          .order('code')
        
        if (codesError) {
          console.error('Error loading customer codes:', codesError)
          return
        }

        // Combine customers with their codes
        const customersWithCodes = customersData.map((customer: any) => ({
          ...customer,
          codes: (codesData || []).filter((code: any) => code.customer_id === customer.id)
        }))
        
        setCustomers(customersWithCodes)
      } catch (err) {
        console.error('Error loading customers:', err)
      } finally {
        setLoadingCustomers(false)
      }
    }
    
    loadCustomers()
  }, [isOpen, customers.length])

  const handleClose = () => {
    setFormData({ name: "", description: "", isActive: true })
    setConditions([{ field: "orig_oe", operator: "equals", value: "" }])
    setAssignTo("")
    setIsLoading(false)
    setConditionLogic("AND")
    onClose()
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a rule name")
      return
    }

    if (!assignTo) {
      alert("Please select a customer to assign to")
      return
    }

    const validConditions = conditions.filter(c => c.value.trim())
    if (validConditions.length === 0) {
      alert("Please add at least one condition")
      return
    }

    setIsLoading(true)

    try {
      const ruleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        conditions: validConditions,
        actions: { assignTo },
        where: ["orig_oe", "dest_oe", "mail_category", "weight", "customer_code"] // Available fields
      }

      const result = await onSave(ruleData)
      
      if (result.success) {
        handleClose()
      } else {
        alert(`Failed to create rule: ${result.error}`)
      }
    } catch (error) {
      alert(`Error creating rule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const addCondition = () => {
    const firstField = cargoDataFields[0]?.key || "orig_oe"
    setConditions(prev => [...prev, { field: firstField, operator: "equals", value: "" }])
  }

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions(prev => prev.map((cond, i) => 
      i === index ? { ...cond, ...updates } : cond
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer Assignment Rule</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name *</Label>
              <Input
                id="rule-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rule name..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-description">Description</Label>
              <Textarea
                id="rule-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does..."
                className="w-full"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="rule-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="rule-active">Enable this rule</Label>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Conditions *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCondition}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            {/* Notion-Style Filter Section */}
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
              {/* Filter Conditions */}
              <div className="p-4 space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
                    {index === 0 ? (
                      <span className="text-xs font-medium text-gray-700 w-18 flex-shrink-0">Where</span>
                    ) : (
                      <Select 
                        value={conditionLogic}
                        onValueChange={(value) => setConditionLogic(value as "AND" | "OR")}
                      >
                        <SelectTrigger className="h-7 w-18 text-xs border-gray-200 flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">And</SelectItem>
                          <SelectItem value="OR">Or</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, { field: value, value: "" })}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs border-gray-200">
                        <SelectValue placeholder="Field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cargoDataFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, { operator: value })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs border-gray-200">
                        <SelectValue placeholder="Operator..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Is</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="starts_with">Starts</SelectItem>
                        <SelectItem value="ends_with">Ends</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Enter value..."
                      className="h-7 text-xs border-gray-200 flex-1 min-w-20"
                    />

                    {conditions.length > 1 && index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Assignment */}
          <div className="space-y-2">
            <Label htmlFor="assign-to">Assign To Customer *</Label>
            <Select value={assignTo} onValueChange={setAssignTo} disabled={loadingCustomers}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select customer..."} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => {
                  const activeCodes = customer.codes.filter(code => code.is_active)
                  return (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-gray-500 text-xs">
                          ({activeCodes.length > 0 ? activeCodes.map(c => c.code).join(', ') : 'No active codes'})
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name.trim() || !assignTo}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {isLoading ? "Creating..." : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
