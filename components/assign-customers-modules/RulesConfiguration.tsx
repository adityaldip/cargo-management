"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Settings, 
  Plus, 
  Search, 
  GripVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerRules } from "./hooks"
import { rulesAPI } from "@/lib/api-client"
import { CustomerRuleExtended } from "./types"
import { SAMPLE_CUSTOMER_RULES } from "@/lib/sample-rules"
import { CreateCustomerRuleModal } from "./CreateCustomerRuleModal"
import { useEffect } from "react"

export function RulesConfiguration() {
  const {
    rules,
    setRules,
    loading,
    isRefreshing,
    error,
    setError,
    toggleRule,
    updateRulePriorities,
    createRule,
    deleteRule,
    refetch
  } = useCustomerRules()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState<CustomerRuleExtended | null>(null)
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("OR")
  const [filterConditions, setFilterConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([{ field: "orig_oe", operator: "equals", value: "" }])
  
  // State for expanded rule editing
  const [editingRuleConditions, setEditingRuleConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([])
  const [editingRuleLogic, setEditingRuleLogic] = useState<"AND" | "OR">("AND")
  const [expandingRuleId, setExpandingRuleId] = useState<string | null>(null)
  
  // State for editing rule basic info
  const [editingRuleName, setEditingRuleName] = useState("")
  const [editingRuleAssignTo, setEditingRuleAssignTo] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Filter rules based on search and conditions
  const filteredRules = rules.filter(rule => {
    // First apply search filter
    const matchesSearch = !searchTerm || (
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.actions.assignTo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (!matchesSearch) return false
    
    // Then apply condition filters if any are set
    if (!showFilters || filterConditions.every(cond => !cond.value)) return true
    
    const activeConditions = filterConditions.filter(cond => cond.value.trim())
    if (activeConditions.length === 0) return true
    
    const conditionResults = activeConditions.map((filterCond) => {
      const ruleConditions = rule.conditions || []
      return ruleConditions.some(ruleCond => {
        const fieldMatch = ruleCond.field === filterCond.field
        
        if (!fieldMatch) return false
        
        const ruleValue = ruleCond.value.toLowerCase()
        const filterValue = filterCond.value.toLowerCase()
        
        switch (filterCond.operator) {
          case "contains":
            return ruleValue.includes(filterValue)
          case "equals":
            return ruleValue === filterValue
          case "starts_with":
            return ruleValue.startsWith(filterValue)
          case "ends_with":
            return ruleValue.endsWith(filterValue)
          default:
            return false
        }
      })
    })
    
    return filterLogic === "OR" 
      ? conditionResults.some(result => result)
      : conditionResults.every(result => result)
  })

  const handleEditRule = (rule: CustomerRuleExtended) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
      setEditingRuleConditions([])
      setExpandingRuleId(null)
      // Clear editing state
      setEditingRuleName("")
      setEditingRuleAssignTo("")
    } else {
      setExpandingRuleId(rule.id)
      
      // Use setTimeout to show immediate feedback, then process data
      setTimeout(() => {
        setExpandedRule(rule.id)
        
        // Initialize editing state with current rule data
        setEditingRuleName(rule.name)
        setEditingRuleAssignTo(rule.actions.assignTo || "")
        
        // Initialize editing state with current rule conditions
        const initialConditions = rule.conditions.map((cond: any) => ({
          field: cond.field,
          operator: cond.operator,
          value: cond.value
        }))
        setEditingRuleConditions(initialConditions.length > 0 ? initialConditions : [{ field: "orig_oe", operator: "equals", value: "" }])
        setEditingRuleLogic("AND")
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

  const handleDrop = async (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault()
    
    if (!draggedRule || draggedRule === targetRuleId || isReordering) return

    const draggedIndex = rules.findIndex(r => r.id === draggedRule)
    const targetIndex = rules.findIndex(r => r.id === targetRuleId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    setIsReordering(true)
    setError(null)
    
    try {
      const newRules = [...rules]
      const [draggedItem] = newRules.splice(draggedIndex, 1)
      newRules.splice(targetIndex, 0, draggedItem)
      
      // Update priorities based on new order
      const updatedRules = newRules.map((rule, index) => ({
        ...rule,
        priority: index + 1
      }))
      
      // Optimistically update UI first
      setRules(updatedRules)
      
      // Update in database
      const success = await updateRulePriorities(updatedRules)
      if (!success) {
        // Revert on failure
        await refetch() // Reload from database to get correct state
        return
      }
      
      // Update cache with new order
      localStorage.setItem('customer-rules-cache', JSON.stringify(updatedRules))
      
    } catch (err) {
      setError(`Failed to reorder rules: ${err instanceof Error ? err.message : 'Unknown error'}`)
      // Reload from database on error
      await refetch()
    } finally {
      setDraggedRule(null)
      setIsReordering(false)
    }
  }

  const clearFilters = () => {
    setFilterConditions([{ field: "orig_oe", operator: "equals", value: "" }])
    setFilterLogic("OR")
    setShowFilters(false)
  }

  // Memoized field values for better performance
  const allFieldValues = useMemo(() => {
    const allValues = SAMPLE_CUSTOMER_RULES.flatMap(rule => 
      rule.conditions.map(cond => cond.value)
    )
    return [...new Set(allValues)].sort()
  }, [])

  // Memoized where options for better performance  
  const whereOptions = useMemo(() => {
    const allWhereOptions = SAMPLE_CUSTOMER_RULES.flatMap(rule => rule.where)
    const uniqueOptions = [...new Set(allWhereOptions)].sort()
    
    return uniqueOptions.map(option => ({
      label: option,
      value: option.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '')
    }))
  }, [])

  // Fast field values lookup (no computation during render)
  const getFieldValues = (fieldType: string) => {
    return allFieldValues
  }

  // Helper functions for editing rule conditions
  const addEditingRuleCondition = () => {
    // Use the first available field option from the current rule's where array
    const firstField = whereOptions[0]?.value || "orig_oe"
    setEditingRuleConditions(prev => [...prev, { field: firstField, operator: "equals", value: "" }])
  }

  const removeEditingRuleCondition = (index: number) => {
    setEditingRuleConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateEditingRuleCondition = (index: number, updates: Partial<typeof editingRuleConditions[0]>) => {
    setEditingRuleConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  // Save changes to Supabase
  const handleSaveChanges = async () => {
    const currentRule = rules.find(r => r.id === expandedRule)
    if (!currentRule) return

    setIsSaving(true)
    setError(null)

    try {
      // Prepare update data
      const updateData = {
        name: editingRuleName.trim(),
        conditions: editingRuleConditions.filter(cond => cond.value.trim()),
        actions: { assignTo: editingRuleAssignTo },
        where_fields: currentRule.where
      }

      // Update in Supabase
      const { data: updatedRule, error: updateError } = await rulesAPI.update(currentRule.id, updateData)
      
      if (updateError) {
        setError(`Failed to save changes: ${updateError}`)
        return
      }

      // Update local state
      setRules(prev => prev.map(rule => 
        rule.id === currentRule.id 
          ? { 
              ...rule, 
              name: editingRuleName.trim(),
              conditions: editingRuleConditions.filter(cond => cond.value.trim()),
              actions: { assignTo: editingRuleAssignTo }
            } 
          : rule
      ))

      // Update cache
      const updatedRules = rules.map(rule => 
        rule.id === currentRule.id 
          ? { 
              ...rule, 
              name: editingRuleName.trim(),
              conditions: editingRuleConditions.filter(cond => cond.value.trim()),
              actions: { assignTo: editingRuleAssignTo }
            } 
          : rule
      )
      localStorage.setItem('customer-rules-cache', JSON.stringify(updatedRules))

      // Close editor
      setExpandedRule(null)
      setEditingRuleConditions([])
      setEditingRuleName("")
      setEditingRuleAssignTo("")
      
    } catch (err) {
      setError(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Test Supabase connection directl
  // Show loading state with skeleton
  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Automation Rules
            </CardTitle>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-3 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
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

      {/* Rules Management */}
      <Card className="bg-white border-gray-200 shadow-sm">
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isReordering}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  "Refresh"
                )}
              </Button>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Play className="h-4 w-4 mr-2" />
                Execute Automation
              </Button>
            </div>
          </div>
          {/* Filter Section - Notion Style */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {filteredRules.length} of {rules.length} rules
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, rule.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rule.id)}
                  className={cn(
                    "flex items-center gap-4 p-1 transition-colors duration-150 cursor-pointer hover:bg-gray-50",
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
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    {rule.priority}
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => toggleRule(rule.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="scale-75"
                    />
                  </div>
                  
                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    {expandedRule === rule.id ? (
                      <Input
                        value={editingRuleName}
                        onChange={(e) => setEditingRuleName(e.target.value)}
                        className="max-w-64 bg-gray"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                    )}
                  </div>

                  {/* Assignment Info */}
                  <div className="text-right">
                    {rule.last_run && (
                      <p className="text-xs text-gray-400">
                        Last update: {new Date(rule.last_run).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`)) {
                          const result = await deleteRule(rule.id)
                          if (!result.success) {
                            alert(`Failed to delete rule: ${result.error}`)
                          }
                        }
                      }}
                      className="h-6 w-6 p-0 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
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

                      {/* Notion-Style Filter Section */}
                      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        {/* Filter Conditions */}
                        <div className="p-4 space-y-2">
                          {editingRuleConditions.map((condition, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
                              {index === 0 ? (
                                <span className="text-sm font-medium text-gray-700 min-w-12">Where</span>
                              ) : (
                                <Select 
                                  value={editingRuleLogic}
                                  onValueChange={(value) => setEditingRuleLogic(value as "AND" | "OR")}
                                >
                                  <SelectTrigger className="h-8 min-w-16 max-w-16 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
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
                                onValueChange={(value) => {
                                  // When field changes, clear the value since it may not be valid for the new field
                                  updateEditingRuleCondition(index, { field: value, value: "" })
                                }}
                              >
                                <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                  <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                  {rule.where.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select 
                                value={condition.operator}
                                onValueChange={(value) => updateEditingRuleCondition(index, { operator: value })}
                              >
                                <SelectTrigger className="h-8 min-w-24 max-w-32 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Is</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="starts_with">Starts with</SelectItem>
                                  <SelectItem value="ends_with">Ends with</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select 
                                value={condition.value}
                                onValueChange={(value) => updateEditingRuleCondition(index, { value })}
                              >
                                <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1">
                                  <SelectValue/>
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {getFieldValues(condition.field).map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingRuleConditions.length > 1 && index > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEditingRuleCondition(index)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Customer Assignment Row */}
                          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm font-medium text-gray-700 min-w-12">Customer</span>
                              <Select 
                                value={editingRuleAssignTo}
                                onValueChange={setEditingRuleAssignTo}
                              >
                                <SelectTrigger className="h-8 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1 min-w-32 max-w-64">
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

                        </div>

                        {/* Add Filter Button */}
                        <div className="px-4 pb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addEditingRuleCondition}
                            className="h-8 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Add filter rule
                          </Button>
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
                          disabled={isSaving || !editingRuleName.trim()}
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

          {filteredRules.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No rules found matching your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Rule Modal */}
      <CreateCustomerRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createRule}
      />
    </>
  )
}
