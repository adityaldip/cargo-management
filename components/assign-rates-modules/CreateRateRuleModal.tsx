"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { RateRule } from "./types"

interface CreateRateRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ruleData: Partial<RateRule>) => Promise<{ success: boolean; error?: string }>
}

interface RuleCondition {
  field: string
  operator: string
  value: string
  value2?: string
}

interface RuleAction {
  rateType: string
  baseRate: number
  multiplier?: number
  currency: string
  tags: string[]
}

export function CreateRateRuleModal({ isOpen, onClose, onSave }: CreateRateRuleModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true
  })
  
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { field: "route", operator: "contains", value: "" }
  ])
  
  const [actions, setActions] = useState<RuleAction>({
    rateType: "per_kg",
    baseRate: 0,
    multiplier: 1,
    currency: "EUR",
    tags: []
  })
  
  const [tagInput, setTagInput] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setFormData({ name: "", description: "", isActive: true })
    setConditions([{ field: "route", operator: "contains", value: "" }])
    setActions({ rateType: "per_kg", baseRate: 0, multiplier: 1, currency: "EUR", tags: [] })
    setTagInput("")
    setError(null)
    onClose()
  }

  const addCondition = () => {
    setConditions(prev => [...prev, { field: "route", operator: "contains", value: "" }])
  }

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  const addTag = () => {
    if (tagInput.trim() && !actions.tags.includes(tagInput.trim())) {
      setActions(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setActions(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
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

    if (!actions.baseRate || actions.baseRate <= 0) {
      setError("Base rate must be greater than 0")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const ruleData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        conditions: conditions.filter(c => c.value.trim()),
        actions: actions
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Rate Rule</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rule name"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter rule description"
                className="w-full"
                rows={2}
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Conditions</Label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
                  {index === 0 ? (
                    <span className="text-sm font-medium text-gray-700 min-w-12">Where</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-700 min-w-12">And</span>
                  )}

                  <Select 
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value, value: "" })}
                  >
                    <SelectTrigger className="h-8 min-w-32 max-w-48 text-xs">
                      <SelectValue placeholder="Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="route">Route</SelectItem>
                      <SelectItem value="weight">Weight (kg)</SelectItem>
                      <SelectItem value="mail_category">Mail Category</SelectItem>
                      <SelectItem value="mail_class">Mail Class</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="flight_number">Flight Number</SelectItem>
                      <SelectItem value="distance">Distance (km)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value })}
                  >
                    <SelectTrigger className="h-8 min-w-24 max-w-32 text-xs">
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
                    className="h-8 text-xs flex-1"
                  />

                  {condition.operator === "between" && (
                    <Input
                      value={condition.value2 || ""}
                      onChange={(e) => updateCondition(index, { value2: e.target.value })}
                      placeholder="To"
                      className="h-8 text-xs w-20"
                    />
                  )}

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
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
                className="h-8 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add condition
              </Button>
            </div>
          </div>

          {/* Rate Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Rate Configuration</Label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate *</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actions.baseRate}
                    onChange={(e) => setActions(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={actions.currency} onValueChange={(value) => setActions(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rateType">Rate Type</Label>
                  <Select value={actions.rateType} onValueChange={(value) => setActions(prev => ({ ...prev, rateType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Rate</SelectItem>
                      <SelectItem value="per_kg">Per Kilogram</SelectItem>
                      <SelectItem value="distance_based">Distance Based</SelectItem>
                      <SelectItem value="zone_based">Zone Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(actions.rateType === "per_kg" || actions.rateType === "distance_based" || actions.rateType === "zone_based") && (
                <div className="space-y-2">
                  <Label htmlFor="multiplier">Multiplier</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.01"
                    min="0"
                    value={actions.multiplier}
                    onChange={(e) => setActions(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1 }))}
                    placeholder="1.00"
                    className="max-w-32"
                  />
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter tag"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actions.tags.map((tag, index) => (
                    <div key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-4 w-4 p-0 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isCreating || !formData.name.trim()}
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
