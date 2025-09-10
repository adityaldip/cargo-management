"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { ErrorBanner } from "@/components/ui/status-banner"
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
  UserCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerRules } from "./hooks"
import { rulesAPI } from "@/lib/api-client"
import { CustomerRuleExtended } from "./types"
import { SAMPLE_CUSTOMER_RULES } from "@/lib/sample-rules"
import { CreateCustomerRuleModal } from "./CreateCustomerRuleModal"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { SweetAlert } from "@/components/ui/sweet-alert"

// Customer Rules Configuration Component - Updated
export function RulesConfiguration() {
  // Get customer rules data and functions from hook
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

  // Local state for UI components
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState<CustomerRuleExtended | null>(null)
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("OR")
  const [filterConditions, setFilterConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([{ field: "orig_oe", operator: "equals", value: "" }])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
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
  const [customers, setCustomers] = useState<{id: string, name: string, code: string, codes: {id: string, code: string, is_active: boolean}[]}[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [openCustomerSelect, setOpenCustomerSelect] = useState(false)
  const [openFieldSelects, setOpenFieldSelects] = useState<Record<number, boolean>>({})
  const [openOperatorSelects, setOpenOperatorSelects] = useState<Record<number, boolean>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionStep, setExecutionStep] = useState("")
  const { toast } = useToast()
  
  // Sweet Alert state for delete confirmation
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<CustomerRuleExtended | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Available field options from cargo_data columns (matching review-merged-excel.tsx)
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load customers from Supabase with their active codes
  useEffect(() => {
    const loadCustomers = async () => {
      // Check if we already have customers loaded
      if (customers.length > 0) {
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
  }, [customers.length]) // Only run when customers array is empty

  // Memoized filtered rules for better performance
  const filteredRules = useMemo(() => {
    if (!Array.isArray(rules)) return []
    return rules.filter(rule => {
      // First apply search filter
      const matchesSearch = !debouncedSearchTerm || (
        rule.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        rule.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (rule as any).actions?.assignTo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
  }, [rules, debouncedSearchTerm, showFilters, filterConditions, filterLogic])

  // Memoized pagination logic
  const paginationData = useMemo(() => {
    if (!Array.isArray(filteredRules)) {
      return {
        totalItems: 0,
        totalPages: 0,
        startIndex: 0,
        endIndex: 0,
        currentPageData: []
      }
    }
    const totalItems = filteredRules.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const currentPageData = filteredRules.slice(startIndex, endIndex)
    
    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      currentPageData
    }
  }, [filteredRules, currentPage, itemsPerPage])

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
        setEditingRuleConditions(initialConditions.length > 0 ? initialConditions : [{ field: cargoDataFields[0]?.key || "orig_oe", operator: "equals", value: "" }])
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
    
    if (!draggedRule || draggedRule === targetRuleId || isReordering || !Array.isArray(rules)) return

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
      const success = await updateRulePriorities(updatedRules as any)
      if (!success) {
        // Revert on failure
        await refetch() // Reload from database to get correct state
        return
      }
      
      // Update store with new order
      setRules(updatedRules)
      
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
    setFilterConditions([{ field: cargoDataFields[0]?.key || "orig_oe", operator: "equals", value: "" }])
    setFilterLogic("OR")
    setShowFilters(false)
    setCurrentPage(1) // Reset to first page when clearing filters
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

  // Memoized customers for better performance
  const memoizedCustomers = useMemo(() => {
    return customers.sort((a, b) => a.name.localeCompare(b.name))
  }, [customers])

  // Fast field values lookup (no computation during render)
  const getFieldValues = (fieldType: string) => {
    return allFieldValues
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

  // Save changes to Supabase
  const handleSaveChanges = async () => {
    if (!Array.isArray(rules)) return
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
        where_fields: (currentRule as any).where || []
      }

      // Update in Supabase
      const { data: updatedRule, error: updateError } = await rulesAPI.update(currentRule.id, updateData)
      
      if (updateError) {
        setError(`Failed to save changes: ${updateError}`)
        return
      }

      // Update local state
      ;(setRules as any)((prev: any) => prev.map((rule: any) => 
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
      const updatedRules = rules.map((rule: any) => 
        rule.id === currentRule.id 
          ? { 
              ...rule, 
              name: editingRuleName.trim(),
              conditions: editingRuleConditions.filter(cond => cond.value.trim()),
              actions: { assignTo: editingRuleAssignTo }
            } 
          : rule
      )
      setRules(updatedRules)

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

  // Handle delete rule confirmation
  const handleDeleteRuleClick = (rule: CustomerRuleExtended) => {
    setRuleToDelete(rule)
    setShowDeleteAlert(true)
  }

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return

    setIsDeleting(true)
    
    try {
      const result = await deleteRule(ruleToDelete.id)
      if (!result.success) {
        toast({
          title: "Delete Failed",
          description: `Failed to delete rule: ${result.error}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Rule Deleted",
          description: `"${ruleToDelete.name}" has been deleted successfully.`,
        })
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: `An error occurred while deleting the rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setRuleToDelete(null)
      setShowDeleteAlert(false)
    }
  }

  const cancelDeleteRule = () => {
    setRuleToDelete(null)
    setShowDeleteAlert(false)
  }

  // Execute rules to assign customers
  const handleExecuteRules = async () => {
    if (!Array.isArray(rules) || rules.length === 0) {
      setError("No rules available to execute")
      return
    }

    const activeRules = rules.filter(rule => (rule as any).is_active)
    console.log('Total rules:', rules.length)
    console.log('Active rules:', activeRules.length)
    console.log('Active rules details:', activeRules.map(r => ({ id: r.id, name: r.name, is_active: (r as any).is_active })))
    
    if (activeRules.length === 0) {
      setError("No active rules found. Please activate at least one rule before executing.")
      return
    }

    setIsExecuting(true)
    setExecutionProgress(0)
    setExecutionStep("Starting rule execution...")
    setError(null)

    try {
      // Simulate progress updates with realistic steps
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 300)

      // Update step messages
      const stepInterval = setInterval(() => {
        setExecutionStep(prev => {
          const steps = [
            "Starting rule execution...",
            "Fetching active rules...",
            "Loading cargo data...",
            "Processing rule conditions...",
            "Matching cargo records...",
            "Updating assignments...",
            "Finalizing results..."
          ]
          const currentIndex = steps.indexOf(prev)
          return steps[Math.min(currentIndex + 1, steps.length - 1)]
        })
      }, 800)

      console.log('Calling rulesAPI.executeRules()...')
      const { data, error } = await rulesAPI.executeRules()
      console.log('API Response:', { data, error })
      
      clearInterval(progressInterval)
      clearInterval(stepInterval)
      setExecutionProgress(100)
      setExecutionStep("Execution completed!")
      
      if (error) {
        setError(`Failed to execute rules: ${error}`)
        toast({
          title: "Execution Failed",
          description: `Failed to execute rules: ${error}`,
          variant: "destructive",
        })
        return
      }

      if (data && (data as any).success) {
        // Show success message with results
        const results = (data as any).results
        
        toast({
          title: "Rules Executed Successfully!",
          description: `Processed ${results.totalProcessed} records, assigned ${results.totalAssigned} customers`,
          duration: 5000,
        })

        // Show detailed results in a second toast
        setTimeout(() => {
          const ruleBreakdown = results.ruleResults.map((r: any) => `${r.ruleName}: ${r.matches} matches`).join(', ')
          toast({
            title: "Rule Breakdown",
            description: ruleBreakdown,
            duration: 8000,
          })
        }, 1000)
        
        // Refresh rules to get updated match counts
        await refetch()
      } else {
        setError("Failed to execute rules: Unknown error")
        toast({
          title: "Execution Failed",
          description: "Failed to execute rules: Unknown error",
          variant: "destructive",
        })
      }
      
    } catch (err) {
      setError(`Failed to execute rules: ${err instanceof Error ? err.message : 'Unknown error'}`)
      toast({
        title: "Execution Failed",
        description: `Failed to execute rules: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
      setExecutionProgress(0)
      setExecutionStep("")
    }
  }

  // Test Supabase connection directl
  // Show loading state with skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
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
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-1 animate-pulse">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-4 bg-gray-200 rounded scale-75"></div>
                    <div className="w-48 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Error Display */}
      {error && (
        <ErrorBanner 
          message={error}
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {/* Rules Management */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
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
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={isReordering}
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
                  {isRefreshing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    "Refresh"
                  )}
                </Button>
                {/* <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    console.log('Testing API connection...')
                    const { data, error } = await rulesAPI.testConnection()
                    console.log('Test result:', { data, error })
                    toast({
                      title: "API Test",
                      description: error ? `Error: ${error}` : `Success: ${data?.message}`,
                      variant: error ? "destructive" : "default"
                    })
                  }}
                  className="h-9 w-32"
                >
                  Test API
                </Button> */}
                <div className="relative">
                  <Button 
                    className="bg-black hover:bg-gray-800 text-white h-9 w-32"
                    onClick={handleExecuteRules}
                    disabled={isExecuting || isReordering}
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
                    <span className="text-sm font-medium text-gray-900">Executing Rules...</span>
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
          {/* Filter Section - Notion Style */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {paginationData.totalItems} of {rules.length} rules
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            {paginationData.currentPageData.map((rule) => (
              <div key={rule.id} className="border rounded-lg">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, rule.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rule.id)}
                  className={cn(
                    "flex items-center gap-1 p-1 transition-colors duration-150 cursor-pointer hover:bg-gray-50",
                    (rule as any).is_active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                    draggedRule === rule.id && "opacity-50",
                    (expandedRule === rule.id || expandingRuleId === rule.id) && "bg-gray-50",
                    isReordering && "pointer-events-none opacity-75"
                  )}
                  onClick={() => handleEditRule(rule as any)}
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
                    checked={(rule as any).is_active}
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
                        className="max-w-64 bg-gray"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                    )}
                  </div>

                  {/* Actions */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRuleClick(rule as any)
                    }}
                    className="h-6 w-6 p-0 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
                            <div key={index} className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
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

                              <Popover 
                                open={openFieldSelects[index]} 
                                onOpenChange={(open) => setOpenFieldSelects(prev => ({ ...prev, [index]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openFieldSelects[index]}
                                    className="h-7 w-36 text-xs border-gray-200 justify-between font-normal"
                                  >
                                    <span className="truncate">
                                      {condition.field
                                        ? cargoDataFields.find((field) => field.key === condition.field)?.label
                                        : "Field..."}
                                    </span>
                                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-0">
                                  <Command>
                                    <CommandInput placeholder="Search field..." className="h-8 text-xs" />
                                    <CommandEmpty>No field found.</CommandEmpty>
                                    <CommandGroup className="max-h-48 overflow-auto">
                                      {cargoDataFields.map((field) => (
                                        <CommandItem
                                          key={field.key}
                                          value={field.label}
                                          onSelect={() => {
                                            updateEditingRuleCondition(index, { field: field.key, value: "" })
                                            setOpenFieldSelects(prev => ({ ...prev, [index]: false }))
                                          }}
                                          className="text-xs"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-3 w-3",
                                              condition.field === field.key ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {field.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>

                              <Popover 
                                open={openOperatorSelects[index]} 
                                onOpenChange={(open) => setOpenOperatorSelects(prev => ({ ...prev, [index]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openOperatorSelects[index]}
                                    className="h-7 w-28 text-xs border-gray-200 justify-between font-normal"
                                  >
                                    <span className="truncate">
                                      {condition.operator === "equals" && "Is"}
                                      {condition.operator === "contains" && "Contains"}
                                      {condition.operator === "starts_with" && "Starts"}
                                      {condition.operator === "ends_with" && "Ends"}
                                      {!condition.operator && "Operator..."}
                                    </span>
                                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-32 p-0">
                                  <Command>
                                    <CommandInput placeholder="Search..." className="h-8 text-xs" />
                                    <CommandEmpty>No operator found.</CommandEmpty>
                                    <CommandGroup>
                                      {[
                                        { value: "equals", label: "Is" },
                                        { value: "contains", label: "Contains" },
                                        { value: "starts_with", label: "Starts" },
                                        { value: "ends_with", label: "Ends" }
                                      ].map((operator) => (
                                        <CommandItem
                                          key={operator.value}
                                          value={operator.label}
                                          onSelect={() => {
                                            updateEditingRuleCondition(index, { operator: operator.value })
                                            setOpenOperatorSelects(prev => ({ ...prev, [index]: false }))
                                          }}
                                          className="text-xs"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-3 w-3",
                                              condition.operator === operator.value ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {operator.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>

                              <Input
                                value={condition.value}
                                onChange={(e) => updateEditingRuleCondition(index, { value: e.target.value })}
                                placeholder="Enter value..."
                                className="h-7 text-xs border-gray-200 flex-1 min-w-20"
                              />

                              {editingRuleConditions.length > 1 && index > 0 && (
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
                          ))}

                          {/* Customer Assignment Row */}
                          <div className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
                            <span className="text-xs font-medium text-gray-700 w-12 flex-shrink-0">Customer</span>
                            <Popover open={openCustomerSelect} onOpenChange={setOpenCustomerSelect}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openCustomerSelect}
                                  className="h-7 text-xs border-gray-200 flex-1 min-w-32 max-w-48 justify-between font-normal"
                                  disabled={loadingCustomers}
                                >
                                  <span className="truncate">
                                    {editingRuleAssignTo
                                      ? (() => {
                                          const selectedCustomer = memoizedCustomers.find((customer) => customer.id === editingRuleAssignTo)
                                          if (selectedCustomer) {
                                            const activeCodes = selectedCustomer.codes.filter(code => code.is_active)
                                            if (activeCodes.length > 0) {
                                              return `${selectedCustomer.name} (${activeCodes.map(c => c.code).join(', ')})`
                                            }
                                            return selectedCustomer.name
                                          }
                                          return "Select customer..."
                                        })()
                                      : loadingCustomers 
                                        ? "Loading customers..." 
                                        : "Select customer..."}
                                  </span>
                                  <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-0">
                                <Command>
                                  <CommandInput placeholder="Search customer..." className="h-8 text-xs" />
                                  <CommandEmpty>
                                    {loadingCustomers ? "Loading..." : "No customer found."}
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-48 overflow-auto">
                                    {memoizedCustomers.map((customer) => {
                                      const activeCodes = customer.codes.filter(code => code.is_active)
                                      return (
                                        <CommandItem
                                          key={customer.id}
                                          value={`${customer.name} ${activeCodes.map(c => c.code).join(' ')}`}
                                          onSelect={() => {
                                            setEditingRuleAssignTo(customer.id)
                                            setOpenCustomerSelect(false)
                                          }}
                                          className="text-xs"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-3 w-3",
                                              editingRuleAssignTo === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{customer.name}</span>
                                            <span className="text-gray-500">
                                              ({activeCodes.length > 0 ? activeCodes.map(c => c.code).join(', ') : 'No active codes'})
                                            </span>
                                          </div>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
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

          {/* Pagination Controls */}
          {paginationData.totalItems > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {paginationData.startIndex + 1} to {paginationData.endIndex} of {paginationData.totalItems} entries
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                    disabled={currentPage >= paginationData.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {paginationData.totalItems === 0 && (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No rules found matching your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Create Customer Rule Modal */}
      <CreateCustomerRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createRule}
      />

      {/* Delete Rule Confirmation SweetAlert */}
      <SweetAlert
        isVisible={showDeleteAlert}
        title="Delete Rule"
        text={`Are you sure you want to delete "${ruleToDelete?.name}"? This action cannot be undone.`}
        type="warning"
        showCancelButton={!isDeleting}
        confirmButtonText="Yes, Delete!"
        cancelButtonText="Cancel"
        onConfirm={confirmDeleteRule}
        onCancel={cancelDeleteRule}
        onClose={() => !isDeleting && setShowDeleteAlert(false)}
        disabled={isDeleting}
      />
    </>
  )
}
