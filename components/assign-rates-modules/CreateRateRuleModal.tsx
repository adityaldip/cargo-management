"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { RateRule, RateRuleCondition } from "@/types/rate-management"
import { useRatesData } from "./hooks"

interface CreateRateRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ruleData: Partial<RateRule>) => Promise<{ success: boolean; error?: string }>
}


export function CreateRateRuleModal({ isOpen, onClose, onSave }: CreateRateRuleModalProps) {
  const { rates } = useRatesData()
  
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
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    selectedRateId: ""
  })
  
  const [conditions, setConditions] = useState<RateRuleCondition[]>([
    { field: cargoDataFields[0]?.key || "orig_oe", operator: "equals", value: "" }
  ])
  
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setFormData({ name: "", description: "", isActive: true, selectedRateId: "" })
    setConditions([{ field: cargoDataFields[0]?.key || "orig_oe", operator: "equals", value: "" }])
    setError(null)
    onClose()
  }

  const addCondition = () => {
    setConditions(prev => [...prev, { field: cargoDataFields[0]?.key || "orig_oe", operator: "equals", value: "" }])
  }

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateCondition = (index: number, updates: Partial<RateRuleCondition>) => {
    setConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }


  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError("Rule name is required")
      return
    }

    if (conditions.some(c => !c.value.trim())) {
      setError("All condition values are required")
      return
    }

    if (!formData.selectedRateId) {
      setError("Please select a rate")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const selectedRate = rates.find(rate => rate.id === formData.selectedRateId)
      
      const ruleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        conditions: conditions.filter(c => c.value.trim()),
        rate: selectedRate?.base_rate || 0,
        currency: selectedRate?.currency || 'EUR',
        rate_id: formData.selectedRateId
      }

      const result = await onSave(ruleData)
      
      if (result.success) {
        handleClose()
      } else {
        setError(result.error || "Failed to create rate rule")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Create New Rate Rule</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-3">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rule name"
                className="w-full h-8 text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter rule description"
                className="w-full text-sm"
                rows={2}
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conditions</Label>
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50 group">
                  {index === 0 ? (
                    <span className="text-xs font-medium text-gray-700 min-w-10">Where</span>
                  ) : (
                    <span className="text-xs font-medium text-gray-700 min-w-10">And</span>
                  )}

                  <Select 
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value, value: "" })}
                  >
                    <SelectTrigger className="h-7 min-w-28 max-w-40 text-xs">
                      <SelectValue placeholder="Property" />
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
                    onValueChange={(value) => updateCondition(index, { operator: value as RateRuleCondition['operator'] })}
                  >
                    <SelectTrigger className="h-7 min-w-20 max-w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Is</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="starts_with">Starts with</SelectItem>
                      <SelectItem value="ends_with">Ends with</SelectItem>
                      <SelectItem value="greater_than">Greater than</SelectItem>
                      <SelectItem value="less_than">Less than</SelectItem>
                      <SelectItem value="between">Between</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Value"
                    className="h-7 text-xs flex-1"
                  />

                  {condition.operator === "between" && (
                    <Input
                      value={condition.value2 || ""}
                      onChange={(e) => updateCondition(index, { value2: e.target.value })}
                      placeholder="To"
                      className="h-7 text-xs w-16"
                    />
                  )}

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={addCondition}
                className="h-7 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add condition
              </Button>
            </div>
          </div>

          {/* Rate Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Rate Selection</Label>
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="space-y-1.5">
                <Label htmlFor="rateSelect" className="text-sm">Select Rate *</Label>
                <Select 
                  value={formData.selectedRateId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, selectedRateId: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Choose a rate from the rates table" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {rates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{rate.name || rate.description || `Rate ${rate.id}`}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {rate.currency || 'EUR'} {(rate.base_rate || 0).toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.selectedRateId && (
                  <div className="text-xs text-gray-600 mt-1">
                    Selected rate details will be applied to this rule
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isCreating}
            className="h-8 text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isCreating || !formData.name.trim() || !formData.selectedRateId}
            className="h-8 text-sm"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                Creating...
              </>
            ) : (
              'Create Rule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
