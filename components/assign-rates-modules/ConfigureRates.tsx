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
import { RateRule } from "@/types/rate-management"
import { SAMPLE_RATE_RULES } from "./sample-data"
import { useRateRulesData, useRatesData } from "./hooks"
import { CreateRateRuleModal } from "./CreateRateRuleModal"
import { RateRuleEditor } from "./RateRuleEditor"
import { SweetAlert } from "@/components/ui/sweet-alert"
import { useToast } from "@/hooks/use-toast"
import { rateRulesAPI } from "@/lib/api-client"

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
  
  const { rates } = useRatesData()
  
  const [localRules, setLocalRules] = useState<RateRule[]>([])

  // Load record count
  const loadRecordCount = async () => {
    setIsLoadingCount(true)
    try {
      const response = await fetch(`/api/rate-rules/count`)
      const result = await response.json()
      
      if (result.success) {
        setRecordCount({
          toProcess: result.data.totalRecords,
          total: result.data.totalRecords
        })
      } else {
        console.error('Failed to load record count:', result.error)
      }
    } catch (error) {
      console.error('Error loading record count:', error)
    } finally {
      setIsLoadingCount(false)
    }
  }

  // Load record count on component mount
  useEffect(() => {
    loadRecordCount()
  }, [])

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
  const [editingRuleRateId, setEditingRuleRateId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [openFieldSelects, setOpenFieldSelects] = useState<Record<number, boolean>>({})
  const [openOperatorSelects, setOpenOperatorSelects] = useState<Record<number, boolean>>({})
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionStep, setExecutionStep] = useState("")
  const [recordCount, setRecordCount] = useState<{toProcess: number, total: number} | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(false)
  
  // Sweet Alert state
  const [sweetAlert, setSweetAlert] = useState({
    isVisible: false,
    title: "",
    text: "",
    type: "warning" as "warning" | "error" | "success" | "info",
    onConfirm: () => {},
    ruleToDelete: null as RateRule | null
  })
  
  // Toast hook
  const { toast } = useToast()
  
  // Available field options from cargo_data columns (matching RulesConfiguration.tsx)
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

  // Use local rules if available, fallback to database rules
  const displayRules = localRules.length > 0 ? localRules : rules

  // Filter rules based on search and conditions
  const filteredRules = displayRules.filter(rule => {
    // First apply search filter
    const matchesSearch = !searchTerm || (
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
    const result = await toggleRateRule(ruleId)
    if (result.success) {
      toast({
        title: "Success",
        description: "Rate rule status updated successfully",
        variant: "default"
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update rate rule status",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRule = (rule: RateRule) => {
    setSweetAlert({
      isVisible: true,
      title: "Delete Rate Rule",
      text: `Are you sure you want to delete "${rule.name}"? This action cannot be undone.`,
      type: "warning",
      onConfirm: () => confirmDeleteRule(rule.id),
      ruleToDelete: rule
    })
  }

  const confirmDeleteRule = async (ruleId: string) => {
    const result = await deleteRateRule(ruleId)
    if (result.success) {
      toast({
        title: "Success",
        description: "Rate rule deleted successfully",
        variant: "default"
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete rate rule",
        variant: "destructive"
      })
    }
  }

  const handleEditRule = (rule: RateRule) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
      setEditingRuleConditions([])
      setEditingRuleRateId("")
    } else {
      setExpandedRule(rule.id)
      // Initialize editing state with current rule conditions
      const initialConditions = rule.conditions.map(cond => ({
        field: cond.field,
        operator: cond.operator,
        value: cond.value
      }))
      setEditingRuleConditions(initialConditions.length > 0 ? initialConditions : [{ field: cargoDataFields[0]?.key || "orig_oe", operator: "equals", value: "" }])
      setEditingRuleLogic("AND")
      // Initialize rate ID from the rule's rateId field, rate_id field, or actions
      const rateId = rule.rateId || rule.rate_id || rule.actions?.assignRate || ""
      console.log('Rule data:', rule)
      console.log('Rule.rateId:', rule.rateId)
      console.log('Rule.actions:', rule.actions)
      console.log('Rule.actions?.assignRate:', rule.actions?.assignRate)
      console.log('Extracted rateId:', rateId)
      setEditingRuleRateId(rateId)
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
    
    // Update priorities based on new order (sequential like customer rules)
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
    if ((rule.matchCount ?? 0) > 100) return <CheckCircle className="h-4 w-4 text-green-500" />
    if ((rule.matchCount ?? 0) > 50) return <Play className="h-4 w-4 text-blue-500" />
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
    // Use the first available field option from cargo data fields
    const firstField = cargoDataFields[0]?.key || "orig_oe"
    setEditingRuleConditions(prev => [...prev, { field: firstField, operator: "equals", value: "" }])
  }

  const removeEditingRuleCondition = (index: number) => {
    setEditingRuleConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateEditingRuleCondition = (index: number, updates: Partial<typeof editingRuleConditions[0]>) => {
    setEditingRuleConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  // Save changes to rate rule
  const handleSaveChanges = async () => {
    if (!Array.isArray(displayRules)) return
    const currentRule = displayRules.find(r => r.id === expandedRule)
    if (!currentRule) return

    setIsSaving(true)
    setError(null)

    try {
      // Prepare update data
      const updateData = {
        conditions: editingRuleConditions.filter(cond => cond.value.trim()),
        rate_id: editingRuleRateId
      }

      console.log('Saving rate rule with data:', updateData)
      const result = await updateRateRule(currentRule.id, updateData)
      console.log('Save result:', result)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Rate rule updated successfully",
          variant: "default"
        })
        // Close editor
        setExpandedRule(null)
        setEditingRuleConditions([])
        setEditingRuleRateId("")
      } else {
        const errorMsg = result.error || "Failed to save rule"
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Save error:', err)
      const errorMsg = `Failed to save rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Execute rate rules to assign rates to cargo data
  const handleExecuteRules = async () => {
    if (!Array.isArray(displayRules) || displayRules.length === 0) {
      setError("No rate rules available to execute")
      return
    }

    const activeRules = displayRules.filter(rule => rule.isActive)
    console.log('Total rate rules:', displayRules.length)
    console.log('Active rate rules:', activeRules.length)
    console.log('Active rate rules details:', activeRules.map(r => ({ id: r.id, name: r.name, isActive: r.isActive })))
    
    if (activeRules.length === 0) {
      setError("No active rate rules found. Please activate at least one rule before executing.")
      return
    }

    setIsExecuting(true)
    setExecutionProgress(0)
    setExecutionStep("Starting rate rule execution...")
    setError(null)

    try {
      // Set initial progress and step
      setExecutionProgress(10)
      setExecutionStep("Starting rate rule execution...")
      
      // Update progress and step messages during execution
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => {
          if (prev >= 85) return prev // Don't go above 85% until API completes
          return prev + Math.random() * 5
        })
      }, 1000)

      const stepInterval = setInterval(() => {
        setExecutionStep(prev => {
          const steps = [
            "Starting rate rule execution...",
            "Fetching active rate rules...",
            "Loading cargo data...",
            "Processing rule conditions...",
            "Matching cargo records...",
            "Calculating rates...",
            "Updating assignments...",
            "Finalizing results..."
          ]
          const currentIndex = steps.indexOf(prev)
          return steps[Math.min(currentIndex + 1, steps.length - 1)]
        })
      }, 2000)

      console.log('Calling rateRulesAPI.executeRules()...')
      const { data, error } = await rateRulesAPI.executeRules()
      console.log('API Response:', { data, error })
      
      // Clear intervals and set final progress
      clearInterval(progressInterval)
      clearInterval(stepInterval)
      setExecutionProgress(100)
      setExecutionStep("Execution completed!")
      
      if (error) {
        setError(`Failed to execute rate rules: ${error}`)
        toast({
          title: "Execution Failed",
          description: `Failed to execute rate rules: ${error}`,
          variant: "destructive",
        })
        return
      }

      if (data && (data as any).success) {
        // Show success message with results
        const results = (data as any).results
        
        toast({
          title: "Rate Rules Executed Successfully!",
          description: `Processed ${results.totalProcessed} records, assigned ${results.totalAssigned} rates`,
          duration: 5000,
        })

        // // Show detailed results in a second toast
        // setTimeout(() => {
        //   const ruleBreakdown = results.ruleResults.map((r: any) => `${r.ruleName}: ${r.matches} matches`).join(', ')
        //   toast({
        //     title: "Rule Breakdown",
        //     description: ruleBreakdown,
        //     duration: 8000,
        //   })
        // }, 1000)
        
        // Refresh rules to get updated match counts
        await refetch()
      } else {
        setError("Failed to execute rate rules: Unknown error")
        toast({
          title: "Execution Failed",
          description: "Failed to execute rate rules: Unknown error",
          variant: "destructive",
        })
      }
      
    } catch (err) {
      setError(`Failed to execute rate rules: ${err instanceof Error ? err.message : 'Unknown error'}`)
      toast({
        title: "Execution Failed",
        description: `Failed to execute rate rules: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
      setExecutionProgress(0)
      setExecutionStep("")
    }
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

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Rate Assignment Rules
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 w-32"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
                disabled={isRefreshing}
                className="h-9 w-32"
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <div className="relative">
                <Button 
                  size="sm"
                  className="bg-black hover:bg-gray-800 text-white h-9 w-32"
                  onClick={handleExecuteRules}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
                {isExecuting && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${executionProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Execution Progress Bar Section */}
        {isExecuting && (
          <div className="px-6 pb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium text-gray-900">Executing Rate Rules...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{executionProgress.toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, executionProgress))}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex-1 truncate">{executionStep}</span>
              </div>
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                {filteredRules.length} of {displayRules.length} rules
              </div>
              {/* Record Count Display */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {isLoadingCount ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                ) : recordCount ? (
                  <>
                    <span>Total records:</span>
                    <span className="font-semibold text-blue-600">{recordCount.total.toLocaleString()}</span>
                    <span className="text-gray-400">(all data will be processed)</span>
                  </>
                ) : null}
              </div>
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
                  "flex items-center gap-1 p-1 transition-all cursor-pointer hover:bg-gray-50",
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
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                  {rule.priority}
                </div>

                {/* Toggle Switch */}
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={() => handleToggleRule(rule.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="scale-75"
                />
                
                {/* Rule Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                </div>


                {/* Actions */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteRule(rule)
                  }}
                  className="h-6 w-6 p-0 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Expanded Edit Section */}
              {expandedRule === rule.id && (
                <RateRuleEditor
                  rule={rule}
                  rates={rates}
                  isSaving={isSaving}
                  editingRuleConditions={editingRuleConditions}
                  editingRuleLogic={editingRuleLogic}
                  editingRuleRateId={editingRuleRateId}
                  openFieldSelects={openFieldSelects}
                  openOperatorSelects={openOperatorSelects}
                  onUpdateConditions={setEditingRuleConditions}
                  onUpdateLogic={setEditingRuleLogic}
                  onUpdateRateId={setEditingRuleRateId}
                  onUpdateFieldSelect={(index, open) => setOpenFieldSelects(prev => ({ ...prev, [index]: open }))}
                  onUpdateOperatorSelect={(index, open) => setOpenOperatorSelects(prev => ({ ...prev, [index]: open }))}
                  onAddCondition={addEditingRuleCondition}
                  onRemoveCondition={removeEditingRuleCondition}
                  onUpdateCondition={updateEditingRuleCondition}
                  onSave={handleSaveChanges}
                  onCancel={() => setExpandedRule(null)}
                />
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
    </div>

    {/* Create Rate Rule Modal */}
    <CreateRateRuleModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onSave={createRateRule}
    />

    {/* Sweet Alert for Delete Confirmation */}
    <SweetAlert
      isVisible={sweetAlert.isVisible}
      title={sweetAlert.title}
      text={sweetAlert.text}
      type={sweetAlert.type}
      confirmButtonText="Yes, Delete!"
      cancelButtonText="Cancel"
      onConfirm={sweetAlert.onConfirm}
      onClose={() => setSweetAlert(prev => ({ ...prev, isVisible: false }))}
    />
    </>
  )
}
