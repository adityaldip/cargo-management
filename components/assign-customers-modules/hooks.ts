import { useState, useEffect } from "react"
import { customerOperations, customerRulesOperations } from "@/lib/supabase-operations"
import { Customer, CustomerRuleExtended } from "./types"

export function useCustomerData() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      const { data: customerData, error } = await customerOperations.getAll()
      if (error) {
        setError(`Failed to fetch customers: ${error}`)
        return
      }
      if (customerData && Array.isArray(customerData)) {
        setCustomers(customerData)
      }
    } catch (err) {
      setError(`Failed to fetch customers: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    try {
      const { data: updatedCustomer, error } = await customerOperations.toggleActive(customerId, !customer.is_active)
      if (error) {
        setError(`Failed to update customer: ${error}`)
        return
      }
      
      if (updatedCustomer && typeof updatedCustomer === 'object' && 'is_active' in updatedCustomer) {
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { ...c, is_active: (updatedCustomer as any).is_active } : c
        ))
      }
    } catch (err) {
      setError(`Failed to update customer: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const { error } = await customerOperations.delete(customerId)
      if (error) {
        setError(`Failed to delete customer: ${error}`)
        return
      }
      
      setCustomers(prev => prev.filter(customer => customer.id !== customerId))
    } catch (err) {
      setError(`Failed to delete customer: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    await fetchCustomers()
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    customers,
    loading,
    error,
    setError,
    toggleCustomer,
    deleteCustomer,
    loadData,
    refetch: loadData
  }
}

export function useCustomerRules() {
  const [rules, setRules] = useState<CustomerRuleExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load cached data immediately
  useEffect(() => {
    const cachedRules = localStorage.getItem('customer-rules-cache')
    if (cachedRules) {
      try {
        const parsedRules = JSON.parse(cachedRules)
        setRules(parsedRules)
        setLoading(false) // Show cached data immediately
      } catch (err) {
        console.warn('Failed to parse cached rules:', err)
      }
    }
  }, [])

  const fetchCustomerRules = async () => {
    try {
      console.log('Fetching customer rules...')
      const { data: rulesData, error } = await customerRulesOperations.getAll()
      console.log('Rules data:', rulesData, 'Error:', error)
      
      if (error) {
        setError(`Failed to fetch rules: ${error}`)
        return
      }
      if (rulesData && Array.isArray(rulesData)) {
        console.log(`Found ${rulesData.length} rules`)
        // Transform database rules to component format
        const transformedRules: CustomerRuleExtended[] = rulesData.map((rule) => ({
          ...rule,
          conditions: Array.isArray(rule.conditions) ? rule.conditions as any : [],
          actions: (rule.actions as any) || { assignTo: '' },
          where: rule.where_fields || []
        }))
        console.log('Transformed rules:', transformedRules)
        setRules(transformedRules)
        // Cache the rules for faster loading next time
        localStorage.setItem('customer-rules-cache', JSON.stringify(transformedRules))
      } else {
        console.log('No rules data or not an array:', rulesData)
      }
    } catch (err) {
      console.error('Error fetching rules:', err)
      setError(`Failed to fetch rules: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    try {
      const { data: updatedRule, error } = await customerRulesOperations.toggleActive(ruleId, !rule.is_active)
      if (error) {
        setError(`Failed to update rule: ${error}`)
        return
      }
      
      if (updatedRule && typeof updatedRule === 'object' && 'is_active' in updatedRule) {
        setRules(prev => prev.map(r => 
          r.id === ruleId ? { ...r, is_active: (updatedRule as any).is_active } : r
        ))
      }
    } catch (err) {
      setError(`Failed to update rule: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const updateRulePriorities = async (updatedRules: CustomerRuleExtended[]) => {
    try {
      const updatePromises = updatedRules.map(rule => 
        customerRulesOperations.updatePriority(rule.id, rule.priority)
      )
      
      const results = await Promise.all(updatePromises)
      const hasErrors = results.some(result => result.error)
      
      if (hasErrors) {
        setError('Failed to update rule priorities')
        return false
      }
      
      setRules(updatedRules)
      return true
    } catch (err) {
      setError(`Failed to update rule priorities: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return false
    }
  }

  const loadData = async (isRefetch = false) => {
    if (isRefetch) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    await fetchCustomerRules()
    setLoading(false)
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    rules,
    setRules,
    loading,
    isRefreshing,
    error,
    setError,
    toggleRule,
    updateRulePriorities,
    loadData,
    refetch: () => loadData(true)
  }
}
