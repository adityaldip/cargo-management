"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import { GripVertical } from "lucide-react"
import { useRateRulesData } from "./hooks"
import { RateRule } from "@/store/rate-rules-store"
import { ratesAPI } from "@/lib/api-client"

interface Rate {
  id: string
  name: string
  description?: string
  rate_type: string
  base_rate: number
  currency: string
  multiplier: number
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function SetupRates() {
  const {
    rateRules,
    loading,
    error,
    isRefreshing,
    setError,
    refetch,
    updateRateRule,
    updateRateRulePriorities
  } = useRateRulesData()
  
  const [localRules, setLocalRules] = useState<RateRule[]>([])
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  
  // Rate management state
  const [isCreateRateModalOpen, setIsCreateRateModalOpen] = useState(false)

  // Sync local rules when database rules change
  useEffect(() => {
    if (rateRules.length > 0) {
      setLocalRules(rateRules)
    }
  }, [rateRules])


  const displayRules = localRules.length > 0 ? localRules : rateRules

  const handleCreateRate = async (rateData: Partial<Rate>) => {
    try {
      setError(null)
      const { data, error } = await ratesAPI.create(rateData)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      // Refresh rate rules to show the new rate
      await refetch()
      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to create rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const toggleRuleActive = async (ruleId: string) => {
    const rule = displayRules.find(r => r.id === ruleId)
    if (rule) {
      await updateRateRule(ruleId, { isActive: !rule.isActive })
    }
  }

  const updateRuleName = async (ruleId: string, name: string) => {
    await updateRateRule(ruleId, { name })
  }

  const handleRuleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggedRule(ruleId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleRuleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleRuleDrop = async (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault()
    
    if (!draggedRule || draggedRule === targetRuleId || isReordering) return

    setIsReordering(true)
    
    try {
      const draggedIndex = displayRules.findIndex(r => r.id === draggedRule)
      const targetIndex = displayRules.findIndex(r => r.id === targetRuleId)
      
      const newRules = [...displayRules]
      const [draggedItem] = newRules.splice(draggedIndex, 1)
      newRules.splice(targetIndex, 0, draggedItem)
      
      // Update priorities based on new positions
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
    } catch (error) {
      console.error('Error reordering rules:', error)
      // Revert on error
      setLocalRules(displayRules)
    } finally {
      setIsReordering(false)
      setDraggedRule(null)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Set Up Rates</CardTitle>
            <p className="text-sm text-gray-600">
              Configure rate fields and their display order
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-1 p-1 border border-gray-200 rounded-lg animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
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

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-black flex items-center gap-2">
                Set Up Rates
                {isReordering && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Manage rate rules priority order and status
                {isReordering && (
                  <span className="ml-2 text-blue-600 font-medium">Reordering...</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateRateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Rate Rules List */}
            <div className="space-y-1">
              {displayRules.filter(rule => rule && rule.id).map((rule, index) => (
                <div 
                  key={rule.id} 
                  draggable
                  onDragStart={(e) => handleRuleDragStart(e, rule.id)}
                  onDragOver={handleRuleDragOver}
                  onDrop={(e) => handleRuleDrop(e, rule.id)}
                  className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                    draggedRule === rule.id ? 'opacity-50' : ''
                  } ${isReordering ? 'pointer-events-none opacity-75' : ''}`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab hover:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Priority Badge */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                    {rule.priority}
                  </div>

                  {/* Active Switch */}
                  <div className="flex items-center">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRuleActive(rule.id)}
                      className="scale-75"
                    />
                  </div>

                  {/* Rule Name Input */}
                  <div className="flex-1">
                    <Input
                      value={rule.name}
                      onChange={(e) => updateRuleName(rule.id, e.target.value)}
                      className="text-sm"
                      placeholder="Rule name"
                    />
                  </div>

                  {/* Rate Info */}
                  <div className="text-right min-w-20">
                    <p className="text-xs font-medium text-black">
                      {rule.currency || 'EUR'} {(rule.rate || 0).toFixed(2)}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Rate Modal would go here */}
      {/* You can create a separate CreateRateModal component */}
    </div>
  )
}
