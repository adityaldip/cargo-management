import { useState, useEffect } from "react"
import { customerAPI, rulesAPI, customerCodesAPI } from "@/lib/api-client"
import { Customer, CustomerCode, CustomerRuleExtended, CustomerWithCodes } from "./types"
import { useCustomerRulesStore } from "@/store/customer-rules-store"

export function useCustomerData() {
  const [customers, setCustomers] = useState<CustomerWithCodes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerCodes, setCustomerCodes] = useState<CustomerCode[]>([])
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchCustomers = async () => {
    try {
      // Fetch customers and customer codes in parallel for better performance
      const [customersResult, codesResult] = await Promise.all([
        customerAPI.getAll(),
        customerCodesAPI.getAll()
      ])

      if (customersResult.error) {
        setError(`Failed to fetch customers: ${customersResult.error}`)
        return
      }

      if (codesResult.error) {
        console.warn('Failed to fetch customer codes:', codesResult.error)
      }

      const customerData = customersResult.data
      const allCodes = codesResult.data || []

      if (customerData && Array.isArray(customerData)) {
        // Group codes by customer_id for faster lookup
        const codesByCustomer = allCodes.reduce((acc: Record<string, any[]>, code: any) => {
          const customerId = code.customer_id
          if (!acc[customerId]) {
            acc[customerId] = []
          }
          acc[customerId].push(code)
          return acc
        }, {})

        // Map customers with their codes and sort by name
        const customersWithCodes = customerData.map((customer: Customer) => ({
          ...customer,
          codes: codesByCustomer[customer.id] || []
        })).sort((a, b) => a.name.localeCompare(b.name))

        setCustomers(customersWithCodes)
        setLastFetchTime(Date.now())
      }
    } catch (err) {
      setError(`Failed to fetch customers: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const toggleCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    try {
      const { data: updatedCustomer, error } = await customerAPI.toggleActive(customerId, !customer.is_active)
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
      const { error } = await customerAPI.delete(customerId)
      if (error) {
        setError(`Failed to delete customer: ${error}`)
        return
      }
      
      setCustomers(prev => prev.filter(customer => customer.id !== customerId))
    } catch (err) {
      setError(`Failed to delete customer: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const createCustomer = async (customerData: any, customerCodes: Array<{code: string, accounting_label: string}>) => {
    try {
      // First create the customer
      const { data: newCustomer, error } = await customerAPI.create(customerData)
      if (error) {
        setError(`Failed to create customer: ${error}`)
        return { success: false, error }
      }
      
      if (newCustomer) {
        // Then create customer codes if provided
        if (customerCodes && customerCodes.length > 0) {
          try {
            const validCodes = customerCodes.filter(code => code.code.trim())
            if (validCodes.length > 0) {
              const { error: codesError } = await customerCodesAPI.bulkUpdate(
                (newCustomer as any).id, 
                validCodes.map(code => ({
                  code: code.code.trim(),
                  accounting_label: code.accounting_label.trim() || null
                }))
              )
              
              if (codesError) {
                console.warn('Failed to create customer codes:', codesError)
                setError(`Customer created but failed to save codes: ${codesError}`)
              }
            }
          } catch (codeError) {
            console.warn('Failed to create customer codes:', codeError)
            setError(`Customer created but failed to save codes: ${codeError}`)
          }
        }
        
        // Add the new customer with empty codes initially
        setCustomers(prev => [{ ...newCustomer as Customer, codes: [] }, ...prev])
        return { success: true, data: newCustomer }
      }
    } catch (err) {
      const errorMessage = `Failed to create customer: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateCustomer = async (customerId: string, updates: any) => {
    try {
      const { data: updatedCustomer, error } = await customerAPI.update(customerId, updates)
      if (error) {
        setError(`Failed to update customer: ${error}`)
        return { success: false, error }
      }
      
      if (updatedCustomer) {
        setCustomers(prev => prev.map(customer => 
          customer.id === customerId ? { ...updatedCustomer as Customer, codes: customer.codes } : customer
        ))
        return { success: true, data: updatedCustomer }
      }
    } catch (err) {
      const errorMessage = `Failed to update customer: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const loadData = async (forceRefresh = false) => {
    // Cache for 30 seconds to avoid unnecessary requests
    const cacheTime = 30 * 1000
    const now = Date.now()
    
    if (!forceRefresh && lastFetchTime > 0 && (now - lastFetchTime) < cacheTime) {
      console.log('Using cached data, skipping fetch')
      return
    }

    setLoading(true)
    setError(null)
    await fetchCustomers()
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const fetchCustomerCodes = async (customerId: string): Promise<CustomerCode[]> => {
    try {
      const { data: codes, error } = await customerCodesAPI.getByCustomerId(customerId)
      if (error) {
        console.error('Error fetching customer codes:', error)
        return []
      }
      return codes || []
    } catch (err) {
      console.error('Error fetching customer codes:', err)
      return []
    }
  }

  const updateCustomerCodes = async (customerId: string, codes: Array<{code: string, accounting_label: string}>) => {
    try {
      const validCodes = codes.filter(code => code.code.trim())
      if (validCodes.length === 0) {
        return { success: false, error: 'No valid codes provided' }
      }

      const { error } = await customerCodesAPI.bulkUpdate(
        customerId, 
        validCodes.map(code => ({
          code: code.code.trim(),
          accounting_label: code.accounting_label.trim() || null
        }))
      )
      
      if (error) {
        setError(`Failed to update customer codes: ${error}`)
        return { success: false, error }
      }
      
      // Update local state with new codes
      const updatedCodes = validCodes.map((code, index) => ({
        id: `temp-${Date.now()}-${index}`, // Temporary ID for local state
        customer_id: customerId,
        code: code.code.trim(),
        accounting_label: code.accounting_label.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, codes: updatedCodes }
          : customer
      ))
      
      return { success: true }
    } catch (err) {
      const errorMessage = `Failed to update customer codes: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return {
    customers,
    customerCodes,
    loading,
    error,
    setError,
    toggleCustomer,
    deleteCustomer,
    createCustomer,
    updateCustomer,
    fetchCustomerCodes,
    updateCustomerCodes,
    loadData,
    refetch: () => loadData(true) // Force refresh
  }
}

export function useCustomerRules() {
  const { rules, setRules } = useCustomerRulesStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchCustomerRules = async () => {
    try {
      console.log('Fetching customer rules...')
      const { data: rulesData, error } = await rulesAPI.getAll()
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
      const { data: updatedRule, error } = await rulesAPI.toggleActive(ruleId, !rule.is_active)
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
      // Use server-side API that handles the two-phase update strategy
      const { error } = await rulesAPI.updatePriorities(updatedRules)
      
      if (error) {
        setError(`Failed to update rule priorities: ${error}`)
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

  const createRule = async (ruleData: any) => {
    try {
      setError(null)

      // Transform component data to database format
      const dbRuleData = {
        name: ruleData.name,
        description: ruleData.description,
        is_active: ruleData.isActive ?? true,
        priority: ruleData.priority ?? rules.length + 1,
        conditions: ruleData.conditions || [],
        actions: ruleData.actions || { assignTo: "" },
        where_fields: ruleData.where || []
      }

      const { data, error } = await rulesAPI.create(dbRuleData)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      if (data) {
        // Transform database data to component format
        const dbRule = data as any
        const newRule: CustomerRuleExtended = {
          id: dbRule.id,
          name: dbRule.name,
          description: dbRule.description || "",
          is_active: dbRule.is_active,
          priority: dbRule.priority,
          match_count: dbRule.match_count || 0,
          created_at: dbRule.created_at,
          updated_at: dbRule.updated_at,
          last_run: dbRule.last_run,
          conditions: dbRule.conditions || [],
          actions: dbRule.actions || { assignTo: "" },
          where: dbRule.where_fields || []
        }

        // Update store
        const updatedRules = [newRule, ...rules]
        setRules(updatedRules)
      }
      
      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to create rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await rulesAPI.delete(ruleId)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      // Update store
      const updatedRules = rules.filter(r => r.id !== ruleId)
      setRules(updatedRules)
      
      return { success: true }
    } catch (err) {
      const errorMsg = `Failed to delete rule: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  return {
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
    loadData,
    refetch: () => loadData(true)
  }
}
