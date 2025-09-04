"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calculator,
  Plus, 
  GripVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  MapPin,
  Weight,
  Package,
  DollarSign,
  Plane,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RateRule } from "./types"
import { SAMPLE_RATE_RULES } from "./sample-data"
import { useRateRulesData } from "./hooks"
import { CreateRateRuleModal } from "./CreateRateRuleModal"

export function ConfigureRates() {
  const {
    rateRules: rules,
    loading,
    error,
    isRefreshing,
    setError,
    refetch,
    toggleRateRule,
    deleteRateRule,
    createRateRule,
    updateRateRule,
    updateRateRulePriorities
  } = useRateRulesData()
  
  const [localRules, setLocalRules] = useState<RateRule[]>([])

  // Sync local rules when database rules change
  useEffect(() => {
    if (rules.length > 0) {
      setLocalRules(rules)
    }
  }, [rules])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("OR")
  const [filterConditions, setFilterConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([{ field: "route", operator: "equals", value: "" }])
  
  // State for expanded rule editing
  const [editingRuleConditions, setEditingRuleConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([])
  const [editingRuleLogic, setEditingRuleLogic] = useState<"AND" | "OR">("AND")

  // Use local rules if available, fallback to database rules
  const displayRules = localRules.length > 0 ? localRules : rules

  // Filter rules based on search and conditions
  const filteredRules = displayRules.filter(rule => {
    // First apply search filter
    const matchesSearch = !searchTerm || (
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.actions.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleToggleRule = async (ruleId: string) => {
    await toggleRateRule(ruleId)
  }

  const handleEditRule = (rule: RateRule) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
      setEditingRuleConditions([])
    } else {
      setExpandedRule(rule.id)
      // Initialize editing state with current rule conditions
      const initialConditions = rule.conditions.map(cond => ({
        field: cond.field,
        operator: cond.operator,
        value: cond.value
      }))
      setEditingRuleConditions(initialConditions.length > 0 ? initialConditions : [{ field: "route", operator: "equals", value: "" }])
      setEditingRuleLogic("AND")
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
    
    if (!draggedRule || draggedRule === targetRuleId) return

    const draggedIndex = displayRules.findIndex(r => r.id === draggedRule)
    const targetIndex = displayRules.findIndex(r => r.id === targetRuleId)
    
    const newRules = [...displayRules]
    const [draggedItem] = newRules.splice(draggedIndex, 1)
    newRules.splice(targetIndex, 0, draggedItem)
    
    // Update priorities based on new order
    const updatedRules = newRules.map((rule, index) => ({
      ...rule,
      priority: index + 1
    }))
    
    // Update local state optimistically
    setLocalRules(updatedRules)
    
    // Update database
    const success = await updateRateRulePriorities(updatedRules)
    if (!success) {
      // Revert on failure
      setLocalRules(displayRules)
    }
    
    setDraggedRule(null)
  }

  const getStatusIcon = (rule: RateRule) => {
    if (!rule.isActive) return <Pause className="h-4 w-4 text-gray-400" />
    if (rule.matchCount > 100) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (rule.matchCount > 50) return <Play className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getConditionIcon = (field: string) => {
    const icons = {
      route: MapPin,
      weight: Weight,
      mail_category: Package,
      customer: DollarSign,
      flight_number: Plane,
      distance: Calculator
    }
    const Icon = icons[field as keyof typeof icons] || Settings
    return <Icon className="h-3 w-3" />
  }

  const clearFilters = () => {
    setFilterConditions([{ field: "route", operator: "equals", value: "" }])
    setFilterLogic("OR")
    setShowFilters(false)
  }

  // Get unique values for each field type from sample rules
  const getFieldValues = (fieldType: string) => {
    const allValues = SAMPLE_RATE_RULES.flatMap(rule => 
      rule.conditions.map(cond => cond.value)
    )
    return [...new Set(allValues)]
  }

  // Helper functions for editing rule conditions
  const addEditingRuleCondition = () => {
    setEditingRuleConditions(prev => [...prev, { field: "route", operator: "equals", value: "" }])
  }

  const removeEditingRuleCondition = (index: number) => {
    setEditingRuleConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateEditingRuleCondition = (index: number, updates: Partial<typeof editingRuleConditions[0]>) => {
    setEditingRuleConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Rate Assignment Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-3 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
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
            <Settings className="h-5 w-5 text-red-600" />
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

      <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-black flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Rate Assignment Rules
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
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
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Play className="h-4 w-4 mr-2" />
              Execute Rate Assignment
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filter Section */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showFilters && filterConditions.some(c => c.value) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-8 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {filteredRules.length} of {displayRules.length} rules
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="border rounded-lg">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, rule.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, rule.id)}
                className={cn(
                  "flex items-center gap-4 p-3 transition-all cursor-pointer hover:bg-gray-50",
                  rule.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                  draggedRule === rule.id && "opacity-50",
                  expandedRule === rule.id && "bg-gray-50"
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
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="scale-75"
                  />
                </div>
                
                {/* Rule Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                </div>

                {/* Rate Info */}
                <div className="text-right">
                  <p className="text-sm font-medium text-black">
                    {rule.actions.currency} {rule.actions.baseRate.toFixed(2)}
                    {rule.actions.rateType === "per_kg" && "/kg"}
                  </p>
                  {rule.lastRun && (
                    <p className="text-xs text-gray-400">
                      Last run: {new Date(rule.lastRun).toLocaleDateString()}
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
                        const result = await deleteRateRule(rule.id)
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
                                updateEditingRuleCondition(index, { field: value, value: "" })
                              }}
                            >
                              <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                <SelectValue placeholder="Property" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="route">Route</SelectItem>
                                <SelectItem value="weight">Weight (kg)</SelectItem>
                                <SelectItem value="mail_category">Mail Category</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="flight_number">Flight Number</SelectItem>
                                <SelectItem value="distance">Distance (km)</SelectItem>
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
                                <SelectItem value="greater_than">Greater than</SelectItem>
                                <SelectItem value="less_than">Less than</SelectItem>
                                <SelectItem value="between">Between</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select 
                              value={condition.value}
                              onValueChange={(value) => updateEditingRuleCondition(index, { value })}
                            >
                              <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1">
                                <SelectValue placeholder="Value" />
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

                        {/* Rate Assignment Row */}
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium text-gray-700 min-w-12">Rate</span>
                            <Input 
                              placeholder="Base rate"
                              defaultValue={rule.actions.baseRate}
                              className="h-8 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 w-24"
                            />
                            <Select defaultValue={rule.actions.currency}>
                              <SelectTrigger className="h-8 w-20 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select defaultValue={rule.actions.rateType}>
                              <SelectTrigger className="h-8 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1 min-w-32 max-w-48">
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
                          Add condition
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
                      >
                        Cancel
                      </Button>
                                              <Button 
                          size="sm"
                          onClick={async () => {
                            // Save the rule with current editing conditions
                            const updatedRule = {
                              conditions: editingRuleConditions,
                              // You can add more fields here as needed
                            }
                            await updateRateRule(rule.id, updatedRule)
                            setExpandedRule(null)
                          }}
                          className="bg-black hover:bg-gray-800 text-white h-7 text-xs"
                        >
                          Save Changes
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
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No rate rules found matching your search criteria</p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Create Rate Rule Modal */}
    <CreateRateRuleModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onSave={createRateRule}
    />
    </>
  )
}
