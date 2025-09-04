"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Settings } from "lucide-react"
import { GripVertical } from "lucide-react"
import { RateRule } from "./types"
import { useRateRulesData } from "./hooks"

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

  // Sync local rules when database rules change
  useEffect(() => {
    if (rateRules.length > 0) {
      setLocalRules(rateRules)
    }
  }, [rateRules])

  const displayRules = localRules.length > 0 ? localRules : rateRules

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
    
    if (!draggedRule || draggedRule === targetRuleId) return

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
    
    setDraggedRule(null)
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
              <CardTitle className="text-black">Set Up Rates</CardTitle>
              <p className="text-sm text-gray-600">
                Manage rate rules priority order and status
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refetch}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Rate Rules List */}
            <div className="space-y-1">
              {displayRules.map((rule, index) => (
                <div 
                  key={rule.id} 
                  draggable
                  onDragStart={(e) => handleRuleDragStart(e, rule.id)}
                  onDragOver={handleRuleDragOver}
                  onDrop={(e) => handleRuleDrop(e, rule.id)}
                  className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                    draggedRule === rule.id ? 'opacity-50' : ''
                  }`}
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

                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
