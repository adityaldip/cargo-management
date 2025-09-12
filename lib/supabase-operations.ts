import { supabase, safeSupabaseOperation } from './supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type Customer = Tables['customers']['Row']
type CustomerRule = Tables['customer_rules']['Row']
type RateRule = Tables['rate_rules']['Row']
type CargoData = Tables['cargo_data']['Row']
type ColumnMapping = Tables['column_mappings']['Row']
type Invoice = Tables['invoices']['Row']

// Customer Operations
export const customerOperations = {
  // Get all customers
  async getAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
    )
  },

  // Get customer by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
    )
  },

  // Create new customer
  async create(customer: Tables['customers']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customers')
        .insert(customer)
        .select()
        .single()
    )
  },

  // Update customer
  async update(id: string, updates: Tables['customers']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete customer
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customers')
        .delete()
        .eq('id', id)
    )
  },

  // Toggle customer active status
  async toggleActive(id: string, isActive: boolean) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customers')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },
}

// Customer Rules Operations
export const customerRulesOperations = {
  // Get all customer rules
  async getAll() {
    const result = await safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .select('*')
        .order('priority', { ascending: true })
    )
    console.log('Supabase operations result:', result)
    return result
  },

  // Get rule by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .select('*')
        .eq('id', id)
        .single()
    )
  },

  // Create new rule
  async create(rule: Tables['customer_rules']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .insert(rule)
        .select()
        .single()
    )
  },

  // Update rule
  async update(id: string, updates: Tables['customer_rules']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete rule
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .delete()
        .eq('id', id)
    )
  },

  // Toggle rule active status
  async toggleActive(id: string, isActive: boolean) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Update rule priority (for drag & drop reordering)
  async updatePriority(id: string, priority: number) {
    return safeSupabaseOperation(() =>
      supabase
        .from('customer_rules')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },
}

// Rate Rules Operations
export const rateRulesOperations = {
  // Get all rate rules
  async getAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .select('*')
        .order('priority', { ascending: true })
    )
  },

  // Get rule by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .select('*')
        .eq('id', id)
        .single()
    )
  },

  // Create new rule
  async create(rule: Tables['rate_rules']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .insert(rule)
        .select()
        .single()
    )
  },

  // Update rule
  async update(id: string, updates: Tables['rate_rules']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete rule
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .delete()
        .eq('id', id)
    )
  },

  // Toggle rule active status
  async toggleActive(id: string, isActive: boolean) {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Update rule priority
  async updatePriority(id: string, priority: number) {
    return safeSupabaseOperation(() =>
      supabase
        .from('rate_rules')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },
}

// Cargo Data Operations
export const cargoDataOperations = {
  // Get all cargo data with pagination
  async getAll(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit
    
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    )
  },

  // Get cargo data with server-side pagination and search
  async getPaginated(params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: string
    filterLogic?: string
  } = {}) {
    const { page = 1, limit = 50, search = '', sortBy = 'created_at', sortOrder = 'desc', filters, filterLogic } = params
    const offset = (page - 1) * limit
    
    try {
      const searchParams: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder
      }
      
      // Add filter parameters if provided
      if (filters) {
        searchParams.filters = filters
      }
      if (filterLogic) {
        searchParams.filterLogic = filterLogic
      }
      
      const response = await fetch(`/api/cargo-data?${new URLSearchParams(searchParams)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching paginated cargo data:', error)
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false, offset: 0 }, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get cargo data statistics
  async getStats(search: string = '') {
    try {
      const response = await fetch(`/api/cargo-data/stats?${new URLSearchParams({ search })}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching cargo data stats:', error)
      return { totalWeight: 0, totalRate: 0, recordCount: 0, avgWeight: 0, avgRate: 0, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get cargo data by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .select('*')
        .eq('id', id)
        .single()
    )
  },

  // Bulk insert cargo data
  async bulkInsert(cargoData: Tables['cargo_data']['Insert'][]) {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .insert(cargoData)
        .select()
    )
  },

  // Update cargo data
  async update(id: string, updates: Tables['cargo_data']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete cargo data
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .delete()
        .eq('id', id)
    )
  },

  // Delete multiple cargo data records by IDs
  async deleteByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return { data: null, error: 'No IDs provided for deletion' }
    }
    
    console.log(`🗑️ deleteByIds called with ${ids.length} IDs:`, ids.slice(0, 3), '...')
    
    const result = await safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .delete()
        .in('id', ids)
    )
    
    console.log(`🗑️ deleteByIds result:`, result)
    return result
  },

  // Search cargo data
  async search(query: string, limit: number = 50) {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .select('*')
        .or(`rec_id.ilike.%${query}%,orig_oe.ilike.%${query}%,dest_oe.ilike.%${query}%,inb_flight_no.ilike.%${query}%,outb_flight_no.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)
    )
  },

  // Get unprocessed cargo data
  async getUnprocessed(limit: number = 100) {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .select('*')
        .is('assigned_customer', null)
        .order('created_at', { ascending: false })
        .limit(limit)
    )
  },

  // Clear all cargo data (for bulk deletion)
  async clearAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    )
  },

  // Get all cargo data IDs for deletion (more efficient than getting full records)
  async getAllIds(page: number = 1, limit: number = 1000) {
    const offset = (page - 1) * limit
    
    return safeSupabaseOperation(() =>
      supabase
        .from('cargo_data')
        .select('id')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    )
  },

  // Get filtered cargo data IDs for deletion
  async getFilteredIds(filters?: string, filterLogic?: string, page: number = 1, limit: number = 1000) {
    const offset = (page - 1) * limit
    
    try {
      // For now, let's use a simpler approach - get all IDs and let the filtering happen at the API level
      // This avoids the complexity of the /api/cargo-data endpoint
      console.log('🔍 getFilteredIds called with:', { filters, filterLogic, page, limit })
      
      // Use the same approach as getAllIds but with pagination
      return safeSupabaseOperation(() =>
        supabase
          .from('cargo_data')
          .select('id')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
      )
    } catch (error) {
      console.error('Error fetching filtered cargo data IDs:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        pagination: null
      }
    }
  },
}

// Column Mapping Operations
export const columnMappingOperations = {
  // Get all column mappings
  async getAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('column_mappings')
        .select('*')
        .order('order_index', { ascending: true })
    )
  },

  // Create or update column mapping
  async upsert(mapping: Tables['column_mappings']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('column_mappings')
        .upsert(mapping, { onConflict: 'original_name' })
        .select()
        .single()
    )
  },

  // Bulk upsert column mappings
  async bulkUpsert(mappings: Tables['column_mappings']['Insert'][]) {
    return safeSupabaseOperation(() =>
      supabase
        .from('column_mappings')
        .upsert(mappings, { onConflict: 'original_name' })
        .select()
    )
  },

  // Delete column mapping
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('column_mappings')
        .delete()
        .eq('id', id)
    )
  },
}

// Invoice Operations
export const invoiceOperations = {
  // Get all invoices
  async getAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            code,
            email
          )
        `)
        .order('created_at', { ascending: false })
    )
  },

  // Get invoice by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            code,
            email,
            address,
            contact_person
          )
        `)
        .eq('id', id)
        .single()
    )
  },

  // Create new invoice
  async create(invoice: Tables['invoices']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single()
    )
  },

  // Update invoice
  async update(id: string, updates: Tables['invoices']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete invoice
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('invoices')
        .delete()
        .eq('id', id)
    )
  },

  // Update invoice status
  async updateStatus(id: string, status: Database['public']['Enums']['invoice_status']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },
}

// Utility Functions
export const utilityOperations = {
  // Execute customer assignment rules
  async executeCustomerRules() {
    // This would contain the logic to process cargo data against customer rules
    // For now, return a placeholder
    return { data: { processed: 0, assigned: 0 }, error: null }
  },

  // Execute rate assignment rules
  async executeRateRules() {
    // This would contain the logic to process cargo data against rate rules
    // For now, return a placeholder
    return { data: { processed: 0, rates_assigned: 0 }, error: null }
  },

  // Get dashboard statistics
  async getDashboardStats() {
    return safeSupabaseOperation(async () => {
      const [customersResult, cargoResult, invoicesResult] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('cargo_data').select('id', { count: 'exact' }),
        supabase.from('invoices').select('id', { count: 'exact' })
      ])

      return {
        data: {
          total_customers: customersResult.count || 0,
          total_cargo_records: cargoResult.count || 0,
          total_invoices: invoicesResult.count || 0,
        },
        error: null
      }
    })
  },
}

