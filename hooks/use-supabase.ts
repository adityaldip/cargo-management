import { useState, useEffect } from 'react'
import { 
  customerOperations, 
  customerRulesOperations, 
  rateRulesOperations, 
  cargoDataOperations,
  columnMappingOperations,
  invoiceOperations 
} from '@/lib/supabase-operations'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']

// Generic hook for data fetching with loading and error states
export function useSupabaseData<T>(
  fetchFunction: () => Promise<{ data: T | null; error: string | null }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetchFunction()
      if (result.error) {
        setError(result.error)
      } else {
        setData(result.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, dependencies)

  return { data, loading, error, refetch }
}

// Customers hook
export function useCustomers() {
  const { data, loading, error, refetch } = useSupabaseData(
    customerOperations.getAll
  )

  const createCustomer = async (customer: Tables['customers']['Insert']) => {
    const result = await customerOperations.create(customer)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateCustomer = async (id: string, updates: Tables['customers']['Update']) => {
    const result = await customerOperations.update(id, updates)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const deleteCustomer = async (id: string) => {
    const result = await customerOperations.delete(id)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const toggleCustomerActive = async (id: string, isActive: boolean) => {
    const result = await customerOperations.toggleActive(id, isActive)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  return {
    customers: data,
    loading,
    error,
    refetch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerActive,
  }
}

// Customer Rules hook
export function useCustomerRules() {
  const { data, loading, error, refetch } = useSupabaseData(
    customerRulesOperations.getAll
  )

  const createRule = async (rule: Tables['customer_rules']['Insert']) => {
    const result = await customerRulesOperations.create(rule)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateRule = async (id: string, updates: Tables['customer_rules']['Update']) => {
    const result = await customerRulesOperations.update(id, updates)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const deleteRule = async (id: string) => {
    const result = await customerRulesOperations.delete(id)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const toggleRuleActive = async (id: string, isActive: boolean) => {
    const result = await customerRulesOperations.toggleActive(id, isActive)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateRulePriority = async (id: string, priority: number) => {
    const result = await customerRulesOperations.updatePriority(id, priority)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  return {
    rules: data,
    loading,
    error,
    refetch,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    updateRulePriority,
  }
}

// Rate Rules hook
export function useRateRules() {
  const { data, loading, error, refetch } = useSupabaseData(
    rateRulesOperations.getAll
  )

  const createRule = async (rule: Tables['rate_rules']['Insert']) => {
    const result = await rateRulesOperations.create(rule)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateRule = async (id: string, updates: Tables['rate_rules']['Update']) => {
    const result = await rateRulesOperations.update(id, updates)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const deleteRule = async (id: string) => {
    const result = await rateRulesOperations.delete(id)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const toggleRuleActive = async (id: string, isActive: boolean) => {
    const result = await rateRulesOperations.toggleActive(id, isActive)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateRulePriority = async (id: string, priority: number) => {
    const result = await rateRulesOperations.updatePriority(id, priority)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  return {
    rules: data,
    loading,
    error,
    refetch,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    updateRulePriority,
  }
}

// Cargo Data hook
export function useCargoData(page: number = 1, limit: number = 50) {
  const { data, loading, error, refetch } = useSupabaseData(
    () => cargoDataOperations.getAll(page, limit),
    [page, limit]
  )

  const bulkInsertCargo = async (cargoData: Tables['cargo_data']['Insert'][]) => {
    const result = await cargoDataOperations.bulkInsert(cargoData)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateCargo = async (id: string, updates: Tables['cargo_data']['Update']) => {
    const result = await cargoDataOperations.update(id, updates)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const deleteCargo = async (id: string) => {
    const result = await cargoDataOperations.delete(id)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const searchCargo = async (query: string) => {
    return await cargoDataOperations.search(query)
  }

  return {
    cargoData: data,
    loading,
    error,
    refetch,
    bulkInsertCargo,
    updateCargo,
    deleteCargo,
    searchCargo,
  }
}

// Column Mappings hook
export function useColumnMappings() {
  const { data, loading, error, refetch } = useSupabaseData(
    columnMappingOperations.getAll
  )

  const upsertMapping = async (mapping: Tables['column_mappings']['Insert']) => {
    const result = await columnMappingOperations.upsert(mapping)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const bulkUpsertMappings = async (mappings: Tables['column_mappings']['Insert'][]) => {
    const result = await columnMappingOperations.bulkUpsert(mappings)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const deleteMapping = async (id: string) => {
    const result = await columnMappingOperations.delete(id)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  return {
    mappings: data,
    loading,
    error,
    refetch,
    upsertMapping,
    bulkUpsertMappings,
    deleteMapping,
  }
}

// Invoices hook
export function useInvoices() {
  const { data, loading, error, refetch } = useSupabaseData(
    invoiceOperations.getAll
  )

  const createInvoice = async (invoice: Tables['invoices']['Insert']) => {
    const result = await invoiceOperations.create(invoice)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateInvoice = async (id: string, updates: Tables['invoices']['Update']) => {
    const result = await invoiceOperations.update(id, updates)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const deleteInvoice = async (id: string) => {
    const result = await invoiceOperations.delete(id)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  const updateInvoiceStatus = async (id: string, status: Database['public']['Enums']['invoice_status']) => {
    const result = await invoiceOperations.updateStatus(id, status)
    if (!result.error) {
      await refetch()
    }
    return result
  }

  return {
    invoices: data,
    loading,
    error,
    refetch,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
  }
}
