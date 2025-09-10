import { useState, useEffect } from 'react'
import { rateRulesAPI } from '@/lib/api-client'
import { RateRule } from '@/store/rate-rules-store'
import { useRateRulesStore } from '@/store/rate-rules-store'

export function useRateRulesData() {
  const { rateRules, setRateRules } = useRateRulesStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRateRules = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Data is already loaded from Zustand store
      if (!isRefresh && rateRules.length > 0) {
        setLoading(false)
        return
      }

      const { data: rateRulesData, error: fetchError } = await rateRulesAPI.getAll()

      if (fetchError) {
        setError(fetchError)
        return
      }

      if (rateRulesData) {
        // Transform database data to match our store types
        const transformedRules: RateRule[] = rateRulesData.map((rule: any) => {
          // Extract rate information from the joined rates table
          const rate = rule.rates || {}
          
          return {
            id: rule.id,
            name: rule.name || 'Unnamed Rule',
            description: rule.description || '',
            isActive: rule.is_active !== undefined ? rule.is_active : true,
            priority: rule.priority || 1,
            conditions: rule.conditions || [],
            rate: rate.base_rate || 0,
            currency: rate.currency || 'EUR',
            createdAt: rule.created_at || new Date().toISOString(),
            updatedAt: rule.updated_at || new Date().toISOString()
          }
        })

        setRateRules(transformedRules)
      }
    } catch (err) {
      setError(`Failed to fetch rate rules: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const refetch = () => fetchRateRules(true)

  const toggleRateRule = async (ruleId: string) => {
    try {
      const rule = rateRules.find(r => r.id === ruleId)
      if (!rule) return { success: false, error: 'Rule not found' }

      const { data, error } = await rateRulesAPI.toggleActive(ruleId, !rule.isActive)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      // Update local state optimistically
      setRateRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      ))

      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to toggle rate rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const deleteRateRule = async (ruleId: string) => {
    try {
      const { error } = await rateRulesAPI.delete(ruleId)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      // Update local state
      setRateRules(prev => prev.filter(r => r.id !== ruleId))
      
      return { success: true }
    } catch (err) {
      const errorMsg = `Failed to delete rate rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const createRateRule = async (ruleData: any) => {
    try {
      setError(null)

      // Transform component data to database format
      const dbRuleData = {
        name: ruleData.name,
        description: ruleData.description,
        is_active: ruleData.isActive ?? true,
        priority: ruleData.priority ?? rateRules.length + 1,
        conditions: ruleData.conditions || [],
        actions: {
          rateType: 'fixed',
          baseRate: ruleData.rate || 0,
          currency: ruleData.currency || 'EUR',
          tags: []
        },
        match_count: 0
      }

      const { data, error } = await rateRulesAPI.create(dbRuleData)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      // Refresh data after creation
      await refetch()
      
      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to create rate rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const updateRateRule = async (ruleId: string, updates: any) => {
    try {
      setError(null)

      // Transform component updates to database format
      const dbUpdates: any = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.conditions !== undefined) dbUpdates.conditions = updates.conditions
      if (updates.rate !== undefined || updates.currency !== undefined) {
        // Get existing rule to preserve other action properties
        const existingRule = rateRules.find(r => r.id === ruleId)
        // Get existing actions from the rule (this would need to be fetched from API)
        // For now, create a basic actions structure
        dbUpdates.actions = {
          rateType: 'fixed',
          baseRate: updates.rate !== undefined ? updates.rate : (existingRule?.rate || 0),
          currency: updates.currency !== undefined ? updates.currency : (existingRule?.currency || 'EUR'),
          tags: []
        }
      }

      const { data, error } = await rateRulesAPI.update(ruleId, dbUpdates)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      // Update local state
      setRateRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, ...updates } : r
      ))
      
      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to update rate rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const updateRateRulePriorities = async (updatedRules: RateRule[]) => {
    try {
      const ruleUpdates = updatedRules.map(rule => ({
        id: rule.id,
        priority: rule.priority
      }))

      const { data, error } = await rateRulesAPI.updatePriorities(ruleUpdates)
      
      if (error) {
        setError('Failed to update rate rule priorities')
        return false
      }

      setRateRules(updatedRules)
      return true
    } catch (err) {
      setError(`Failed to update rate rule priorities: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return false
    }
  }

  useEffect(() => {
    fetchRateRules()
  }, [])

  return {
    rateRules,
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
  }
}

