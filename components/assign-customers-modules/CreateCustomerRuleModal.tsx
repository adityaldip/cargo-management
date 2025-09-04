"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { CustomerRuleExtended } from "./types"

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

  const handleClose = () => {
    setFormData({ name: "", description: "", isActive: true })
    setConditions([{ field: "orig_oe", operator: "equals", value: "" }])
    setAssignTo("")
    setIsLoading(false)
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
    setConditions(prev => [...prev, { field: "orig_oe", operator: "equals", value: "" }])
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

            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="text-sm font-medium text-gray-700 min-w-12">
                    {index === 0 ? "Where" : "And"}
                  </div>

                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value, value: "" })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orig_oe">Origin OE</SelectItem>
                      <SelectItem value="dest_oe">Destination OE</SelectItem>
                      <SelectItem value="mail_category">Mail Category</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="customer_code">Customer Code</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Is</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="starts_with">Starts with</SelectItem>
                      <SelectItem value="ends_with">Ends with</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1"
                  />

                  {conditions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="p-2 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Assignment */}
          <div className="space-y-2">
            <Label htmlFor="assign-to">Assign To Customer *</Label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="premium-express">Premium Express Ltd</SelectItem>
                <SelectItem value="nordic-post">Nordic Post AS</SelectItem>
                <SelectItem value="baltic-express">Baltic Express Network</SelectItem>
                <SelectItem value="cargo-masters">Cargo Masters International</SelectItem>
                <SelectItem value="general-mail">General Mail Services</SelectItem>
                <SelectItem value="euro-logistics">Euro Logistics GmbH</SelectItem>
                <SelectItem value="air-freight">Air Freight Solutions</SelectItem>
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
