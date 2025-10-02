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
  async getStats(search: string = '', filterParams: any = {}) {
    try {
      const params = new URLSearchParams({ search })
      
      // Add filter parameters if provided
      if (filterParams.filters) {
        params.append('filters', filterParams.filters)
      }
      if (filterParams.filterLogic) {
        params.append('filterLogic', filterParams.filterLogic)
      }
      
      const response = await fetch(`/api/cargo-data/stats?${params}`)
      
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

  // Bulk update cargo data - much faster for multiple records
  async bulkUpdate(updates: Array<{ id: string; updates: Tables['cargo_data']['Update'] }>) {
    if (!updates || updates.length === 0) {
      return { data: null, error: 'No updates provided' }
    }

    console.log(`🔄 bulkUpdate called with ${updates.length} records`)
    
    // Process in batches to avoid payload size limits
    // Use larger batches for better performance, smaller for very large datasets
    const batchSize = updates.length > 10000 ? 2000 : 1000 // Adaptive batch sizing
    const results = []
    let totalUpdated = 0
    let totalFailed = 0
    const errors: string[] = []

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      console.log(`🔄 Processing bulk update batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)} (${batch.length} records)`)
      
      try {
        // Use individual updates within each batch for better error handling
        // Skip validation for better performance since we're only updating existing records
        const batchPromises = batch.map(async ({ id, updates: updateData }) => {
          try {
            // Direct update without validation for maximum performance
            // Since we're only processing existing records from our query, validation is redundant
            const { error } = await supabase
              .from('cargo_data')
              .update({
                ...updateData,
                updated_at: new Date().toISOString()
              })
              .eq('id', id)
              .select('id')
            
            if (error) {
              console.error(`❌ Failed to update cargo record ${id}:`, error)
              return { success: false, error: error.message, id }
            }
            
            return { success: true, id }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            console.error(`❌ Exception updating cargo record ${id}:`, errorMsg)
            return { success: false, error: errorMsg, id }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        // Count successes and failures
        batchResults.forEach(result => {
          if (result.success) {
            totalUpdated++
          } else {
            totalFailed++
            errors.push(`Record ${result.id}: ${result.error}`)
          }
        })
        
        console.log(`✅ Batch completed: ${batchResults.filter(r => r.success).length} successful, ${batchResults.filter(r => !r.success).length} failed`)
        
      } catch (batchError) {
        console.error(`❌ Batch processing error:`, batchError)
        totalFailed += batch.length
        errors.push(`Batch error: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
      }
    }

    console.log(`✅ Bulk update completed: ${totalUpdated} successful, ${totalFailed} failed`)
    
    if (totalFailed > 0) {
      console.error(`❌ ${totalFailed} updates failed. First few errors:`)
      errors.slice(0, 5).forEach(error => console.error(`  - ${error}`))
      
      // Return partial success if some updates succeeded
      if (totalUpdated === 0) {
        return { data: null, error: `All updates failed. First error: ${errors[0]}` }
      } else {
        console.warn(`⚠️ Partial success: ${totalUpdated} updates succeeded, ${totalFailed} failed`)
      }
    }

    return { data: { totalUpdated, totalFailed, errors }, error: null }
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
      console.log('🔍 getFilteredIds called with:', { filters, filterLogic, page, limit })
      
      if (!filters) {
        // If no filters, just get all IDs
        return safeSupabaseOperation(() =>
          supabase
            .from('cargo_data')
            .select('id')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
        )
      }
      
      // Parse and apply filters
      const filterConditions = JSON.parse(filters)
      console.log('🔍 Applying filters to getFilteredIds:', filterConditions, 'with logic:', filterLogic)
      
      let query = supabase
        .from('cargo_data')
        .select('id')
        .order('created_at', { ascending: false })
      
      // Apply filter conditions based on logic
      if (filterLogic === 'OR') {
        // For OR logic, build OR conditions
        const orConditions: string[] = []
        
        filterConditions.forEach((condition: any) => {
          const { field, operator, value } = condition
          
          // Map frontend field names to database column names
          const dbField = field === 'assigned_customer' ? 'assigned_customer' :
                         field === 'assigned_rate' ? 'assigned_rate' :
                         field === 'total_kg' ? 'total_kg' :
                         field === 'inb_flight_date' ? 'inb_flight_date' :
                         field === 'outb_flight_date' ? 'outb_flight_date' :
                         field === 'rec_id' ? 'rec_id' :
                         field === 'orig_oe' ? 'orig_oe' :
                         field === 'dest_oe' ? 'dest_oe' :
                         field === 'mail_cat' ? 'mail_cat' :
                         field === 'mail_class' ? 'mail_class' :
                         field === 'invoice' ? 'invoice' :
                         field
          
          switch (operator) {
            case 'equals':
              orConditions.push(`${dbField}.eq.${value}`)
              break
            case 'contains':
              orConditions.push(`${dbField}.ilike.%${value}%`)
              break
            case 'starts_with':
              orConditions.push(`${dbField}.ilike.${value}%`)
              break
            case 'ends_with':
              orConditions.push(`${dbField}.ilike.%${value}`)
              break
            case 'greater_than':
              orConditions.push(`${dbField}.gt.${parseFloat(value)}`)
              break
            case 'less_than':
              orConditions.push(`${dbField}.lt.${parseFloat(value)}`)
              break
            case 'not_empty':
              orConditions.push(`and(${dbField}.not.is.null,${dbField}.neq.)`)
              break
            case 'is_empty':
              orConditions.push(`or(${dbField}.is.null,${dbField}.eq.)`)
              break
          }
        })
        
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','))
        }
      } else {
        // For AND logic (default), apply filters sequentially
        filterConditions.forEach((condition: any) => {
          const { field, operator, value } = condition
          
          // Map frontend field names to database column names
          const dbField = field === 'assigned_customer' ? 'assigned_customer' :
                         field === 'assigned_rate' ? 'assigned_rate' :
                         field === 'total_kg' ? 'total_kg' :
                         field === 'inb_flight_date' ? 'inb_flight_date' :
                         field === 'outb_flight_date' ? 'outb_flight_date' :
                         field === 'rec_id' ? 'rec_id' :
                         field === 'orig_oe' ? 'orig_oe' :
                         field === 'dest_oe' ? 'dest_oe' :
                         field === 'mail_cat' ? 'mail_cat' :
                         field === 'mail_class' ? 'mail_class' :
                         field === 'invoice' ? 'invoice' :
                         field
          
          switch (operator) {
            case 'equals':
              query = query.eq(dbField, value)
              break
            case 'contains':
              query = query.ilike(dbField, `%${value}%`)
              break
            case 'starts_with':
              query = query.ilike(dbField, `${value}%`)
              break
            case 'ends_with':
              query = query.ilike(dbField, `%${value}`)
              break
            case 'greater_than':
              query = query.gt(dbField, parseFloat(value))
              break
            case 'less_than':
              query = query.lt(dbField, parseFloat(value))
              break
            case 'not_empty':
              query = query.not(dbField, 'is', null).neq(dbField, '')
              break
            case 'is_empty':
              query = query.or(`${dbField}.is.null,${dbField}.eq.`)
              break
          }
        })
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1)
      
      return safeSupabaseOperation(() => query)
      
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

// Airport Code Operations
export const airportCodeOperations = {
  // Get all airport codes
  async getAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .select('*')
        .order('code', { ascending: true })
    )
  },

  // Get airport code by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .select('*')
        .eq('id', id)
        .single()
    )
  },

  // Create new airport code
  async create(airportCode: Tables['airport_code']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .insert(airportCode)
        .select()
        .single()
    )
  },

  // Update airport code
  async update(id: string, updates: Tables['airport_code']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete airport code
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .delete()
        .eq('id', id)
    )
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean) {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Toggle EU status
  async toggleEU(id: string, isEU: boolean) {
    return safeSupabaseOperation(() =>
      supabase
        .from('airport_code')
        .update({ is_eu: isEU })
        .eq('id', id)
        .select()
        .single()
    )
  },
}

// Flight Operations
export const flightOperations = {
  // Get all flights
  async getAll() {
    return safeSupabaseOperation(() =>
      supabase
        .from('flights')
        .select('*')
        .order('created_at', { ascending: false })
    )
  },

  // Get flight by ID
  async getById(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('flights')
        .select('*')
        .eq('id', id)
        .single()
    )
  },

  // Create new flight
  async create(flight: Tables['flights']['Insert']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('flights')
        .insert(flight)
        .select()
        .single()
    )
  },

  // Update flight
  async update(id: string, updates: Tables['flights']['Update']) {
    return safeSupabaseOperation(() =>
      supabase
        .from('flights')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },

  // Delete flight
  async delete(id: string) {
    return safeSupabaseOperation(() =>
      supabase
        .from('flights')
        .delete()
        .eq('id', id)
    )
  },

  // Toggle flight active status
  async toggleActive(id: string, isActive: boolean) {
    return safeSupabaseOperation(() =>
      supabase
        .from('flights')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    )
  },
}

