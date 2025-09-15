"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Settings, 
  Plus, 
  GripVertical,
  Trash2,
  Play,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Check,
  X,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IgnoreRule } from "@/lib/ignore-rules-utils"
import type { ProcessedData } from "@/types/cargo-data"
import { useIgnoreRulesStore } from "@/store/ignore-rules-store"
import { DisabledBanner } from "@/components/ui/status-banner"
import { useToast } from "@/hooks/use-toast"
import { applyIgnoreRulesWithConditions } from "@/lib/ignore-rules-utils"

interface IgnoreTrackingRulesProps {
  onRulesChange?: (rules: IgnoreRule[]) => void
  uploadedData?: ProcessedData | null
  onRulesApplied?: () => void
  onViewIgnored?: () => void
  dataSource?: "mail-agent" | "mail-system"
}

export function IgnoreTrackingRules({ onRulesChange, uploadedData, onRulesApplied, onViewIgnored, dataSource = "mail-system" }: IgnoreTrackingRulesProps) {
  const [rules, setRules] = useState<IgnoreRule[]>([
    {
      id: "ignore-tracking-rules",
      name: "Ignore Tracking Rules",
      is_active: true,
      priority: 1,
      field: "inb_flight_no",
      operator: "equals",
      value: "",
      description: "Ignore tracking rules for flight numbers"
    }
  ])
  
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [expandingRuleId, setExpandingRuleId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  
  // Editing state
  const [editingRuleName, setEditingRuleName] = useState("")
  const [editingRuleConditions, setEditingRuleConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([])
  const [editingRuleLogic, setEditingRuleLogic] = useState<"AND" | "OR">("AND")
  const [editingRuleAction, setEditingRuleAction] = useState<"ignore" | "remove">("ignore")
  const [isSaving, setIsSaving] = useState(false)
  const [isApplyingRules, setIsApplyingRules] = useState(false)
  
  // Zustand store
  const {
    getConditionsForDataSource,
    setConditionsForDataSource,
  } = useIgnoreRulesStore()
  
  // Toast hook
  const { toast } = useToast()
  
  // Get current conditions based on data source
  const currentConditions = getConditionsForDataSource(dataSource)

  // Available field options for tracking data
  const trackingFields = [
    { key: 'inb_flight_no', label: 'Inb. Flight No.' },
  ]

  const operators = [
    { value: "equals", label: "Is" },
  ]

  // Extract unique values from uploaded data for inb_flight_no field
  const getFieldOptions = (fieldKey: string): string[] => {
    if (!uploadedData?.data || fieldKey !== 'inb_flight_no') return []
    
    const values = new Set<string>()
    
    uploadedData.data.forEach(record => {
      const value = record.inbFlightNo
      if (value && value.trim()) {
        values.add(value.trim())
      }
    })
    
    return Array.from(values).sort()
  }

  // Load conditions from Zustand store on component mount
  useEffect(() => {
    if (currentConditions.length > 0) {
      setEditingRuleConditions(currentConditions)
    }
  }, [currentConditions])

  // Notify parent component when rules change
  useEffect(() => {
    onRulesChange?.(rules)
  }, [rules, onRulesChange])

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, is_active: !rule.is_active }
        : rule
    ))
  }

  const handleEditRule = (rule: IgnoreRule) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
      setExpandingRuleId(null)
      // Clear editing state
      setEditingRuleName("")
      setEditingRuleConditions([])
      setEditingRuleAction("ignore")
    } else {
      setExpandingRuleId(rule.id)
      
      // Use setTimeout to show immediate feedback, then process data
      setTimeout(() => {
        setExpandedRule(rule.id)
        
        // Initialize editing state with current rule data
        setEditingRuleName(rule.name)
        
        // Load conditions from Zustand store or create from current rule
        if (currentConditions.length > 0) {
          setEditingRuleConditions(currentConditions)
        } else {
          // Convert single rule to conditions format
          setEditingRuleConditions([{
            field: rule.field,
            operator: rule.operator,
            value: rule.value
          }])
        }
        setEditingRuleAction("ignore") // Default action
        setExpandingRuleId(null)
      }, 0)
    }
  }

  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggedRule(ruleId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault()
    
    if (!draggedRule || draggedRule === targetRuleId || isReordering) return

    const draggedIndex = rules.findIndex(r => r.id === draggedRule)
    const targetIndex = rules.findIndex(r => r.id === targetRuleId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    setIsReordering(true)
    
    const newRules = [...rules]
    const [draggedItem] = newRules.splice(draggedIndex, 1)
    newRules.splice(targetIndex, 0, draggedItem)
    
    // Update priorities based on new order
    const updatedRules = newRules.map((rule, index) => ({
      ...rule,
      priority: index + 1
    }))
    
    setRules(updatedRules)
    setDraggedRule(null)
    setIsReordering(false)
  }

  // Helper functions for editing rule conditions
  const addEditingRuleCondition = () => {
    setEditingRuleConditions(prev => [...prev, { 
      field: trackingFields[0].key, 
      operator: "equals", 
      value: "" 
    }])
  }

  const removeEditingRuleCondition = (index: number) => {
    setEditingRuleConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateEditingRuleCondition = (index: number, updates: Partial<typeof editingRuleConditions[0]>) => {
    setEditingRuleConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  const deleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this rule? This action cannot be undone.")) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId))
      if (expandedRule === ruleId) {
        setExpandedRule(null)
      }
    }
  }

  const handleSaveChanges = () => {
    const currentRule = rules.find(r => r.id === expandedRule)
    if (!currentRule) return

    setIsSaving(true)

    // Simulate save delay
    setTimeout(() => {
      // Update the single rule with the first condition (for display purposes)
      // The multiple conditions are stored in Zustand store
      if (editingRuleConditions.length > 0) {
        const firstCondition = editingRuleConditions[0]
        setRules(prev => prev.map(rule => 
          rule.id === currentRule.id 
            ? { 
                ...rule, 
                name: editingRuleName.trim() || "Ignore Tracking Rules",
                field: firstCondition.field,
                operator: firstCondition.operator,
                value: firstCondition.value.trim()
              } 
            : rule
        ))
        
        // Save conditions to Zustand store
        setConditionsForDataSource(dataSource, editingRuleConditions)
      }

      // Close editor
      setExpandedRule(null)
      setEditingRuleName("")
      setEditingRuleAction("ignore")
      setIsSaving(false)
      
      // Trigger rules applied callback
      onRulesApplied?.()
    }, 500)
  }

  const handleApplyRules = async () => {
    if (!uploadedData?.data) {
      toast({
        title: "No data available",
        description: "Please upload data first before applying rules.",
        variant: "destructive"
      })
      return
    }

    setIsApplyingRules(true)

    try {
      // Get persisted conditions from Zustand store
      const persistedConditions = getConditionsForDataSource(dataSource)
      
      // Apply ignore rules to get filtered data (excluding ignored records)
      const filteredData = applyIgnoreRulesWithConditions(uploadedData.data, rules, persistedConditions)
      
      const originalCount = uploadedData.data.length
      const filteredCount = filteredData.length
      const ignoredCount = originalCount - filteredCount

      // Show success toast with statistics
      toast({
        title: "Rules applied successfully",
        description: `${ignoredCount} records ignored, ${filteredCount} records remaining.`,
      })

      // Trigger the rules applied callback to continue workflow
      onRulesApplied?.()

    } catch (error) {
      console.error('Error applying rules:', error)
      toast({
        title: "Error applying rules",
        description: "An error occurred while applying the ignore rules. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplyingRules(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Disabled Banner */}
      <DisabledBanner className="mb-4" />
      
      <Card className="bg-white border-gray-200 shadow-sm" style={{ padding:"12px 0px 12px 0px" }}>
        <CardContent>
        <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Settings className="h-5 w-5" />
                Automation Rules
              {isReordering && (
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                  <span className="text-xs">Reordering...</span>
                </div>
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  // Navigate to ignored tab
                  onViewIgnored?.()
                }}
              >
                Skip
              </Button>
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleApplyRules}
                disabled={isApplyingRules || !uploadedData?.data}
              >
                {isApplyingRules ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Applying...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Apply Rules
                  </>
                )}
              </Button>
            </div>
          </div>          
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
                {uploadedData && (
                  <span className="ml-2">• {uploadedData.data.length} records available</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            {rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, rule.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rule.id)}
                  className={cn(
                    "flex items-center gap-1 p-1 transition-colors duration-150 cursor-pointer hover:bg-gray-50",
                    rule.is_active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                    draggedRule === rule.id && "opacity-50",
                    (expandedRule === rule.id || expandingRuleId === rule.id) && "bg-gray-50",
                    isReordering && "pointer-events-none opacity-75"
                  )}
                  onClick={() => handleEditRule(rule)}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab hover:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Priority Badge */}
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    {rule.priority}
                  </div>

                  {/* Toggle Switch */}
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => toggleRule(rule.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="scale-75"
                  />
                  
                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    {expandedRule === rule.id ? (
                      <Input
                        value={editingRuleName}
                        onChange={(e) => setEditingRuleName(e.target.value)}
                        className="max-w-64 bg-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div>
                        <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                        <p className="text-xs text-gray-500">
                          {trackingFields.find(f => f.key === rule.field)?.label} {operators.find(o => o.value === rule.operator)?.label.toLowerCase()} "{rule.value}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {/* <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRule(rule.id)
                    }}
                    className="h-6 w-6 p-0 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button> */}
                </div>

                {/* Loading State for Expanding */}
                {expandingRuleId === rule.id && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading editor...</span>
                    </div>
                  </div>
                )}

                {/* Expanded Edit Section */}
                {expandedRule === rule.id && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="space-y-4">
                      {/* Conditions Section */}
                      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        {/* Add Condition Button - Moved to top */}
                        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addEditingRuleCondition}
                            className="h-8 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Add condition
                          </Button>
                        </div>
                        
                        {/* Filter Conditions */}
                        <div className="p-4 space-y-2">
                          {editingRuleConditions.map((condition, index) => (
                            <div key={index}>
                              <div className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
                              {index === 0 ? (
                                <span className="text-xs font-medium text-gray-700 w-18 flex-shrink-0">Where</span>
                              ) : (
                                <Select 
                                  value={editingRuleLogic}
                                  onValueChange={(value) => setEditingRuleLogic(value as "AND" | "OR")}
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
                                onValueChange={(value) => updateEditingRuleCondition(index, { field: value })}
                              >
                                <SelectTrigger className="h-7 w-36 text-xs border-gray-200">
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {trackingFields.map((field) => (
                                    <SelectItem key={field.key} value={field.key} className="text-xs">
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select 
                                value={condition.operator}
                                onValueChange={(value) => updateEditingRuleCondition(index, { operator: value })}
                              >
                                <SelectTrigger className="h-7 w-28 text-xs border-gray-200">
                                  <SelectValue placeholder="Operator..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {operators.map((operator) => (
                                    <SelectItem key={operator.value} value={operator.value} className="text-xs">
                                      {operator.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                value={condition.value}
                                onChange={(e) => updateEditingRuleCondition(index, { value: e.target.value })}
                                placeholder="Enter flight number..."
                                className="h-7 text-xs border-gray-200 flex-1 min-w-32"
                              />

                              {condition.value && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateEditingRuleCondition(index, { value: "" })}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                                  title="Clear selection"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              {editingRuleConditions.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEditingRuleCondition(index)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                              </div>
                              
                              {/* Show preview of available values for this field */}
                              {condition.field && uploadedData && (
                                <div className="text-xs text-gray-500 pl-20 pb-2">
                                  Available values: {getFieldOptions(condition.field).length > 0 
                                    ? `${getFieldOptions(condition.field).slice(0, 3).join(', ')}${getFieldOptions(condition.field).length > 3 ? ` (+${getFieldOptions(condition.field).length - 3} more)` : ''}`
                                    : 'No values found'
                                  }
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Then Action Row */}
                          <div className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
                            <span className="text-xs font-medium text-gray-700 w-18 flex-shrink-0">Then</span>
                            <Select 
                              value={editingRuleAction}
                              onValueChange={(value) => setEditingRuleAction(value as "ignore" | "remove")}
                            >
                              <SelectTrigger className="h-7 w-32 text-xs border-gray-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore">ignore</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-gray-500">the matching records</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setExpandedRule(null)}
                          className="h-7 text-xs"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveChanges}
                          disabled={isSaving || !editingRuleName.trim() || editingRuleConditions.some(c => !c.value.trim())}
                          className="bg-black hover:bg-gray-800 text-white h-7 text-xs"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {rules.length === 0 && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No ignore rules configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

