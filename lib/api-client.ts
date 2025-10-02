// Client-side API utilities for server-side database operations

const API_BASE = '/api'

// Generic API request helper with timeout and retry logic
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  timeout: number = 10000
): Promise<{ data: T | null; error: string | null }> {
  let controller: AbortController | null = null
  let timeoutId: NodeJS.Timeout | null = null
  
  try {
    controller = new AbortController()
    timeoutId = setTimeout(() => {
      if (controller && !controller.signal.aborted) {
        controller.abort()
      }
    }, timeout)

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    })

    // Clear timeout if request completes successfully
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: 'Request failed' }))
      return { data: null, error: result.error || `HTTP ${response.status}: Request failed` }
    }

    const result = await response.json()
    return { data: result.data || result, error: null }
  } catch (error) {
    console.error('API Request Error:', error)
    
    // Clean up timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { data: null, error: 'Request timeout - please try again' }
    }
    
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

// Customer API operations
export const customerAPI = {
  // Get all customers
  async getAll() {
    return apiRequest('/customers')
  },

  // Get customer by ID
  async getById(id: string) {
    return apiRequest(`/customers/${id}`)
  },

  // Create new customer
  async create(customerData: any) {
    return apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  },

  // Update customer
  async update(id: string, updates: any) {
    return apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete customer
  async delete(id: string) {
    return apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    })
  },

  // Toggle customer active status
  async toggleActive(id: string, isActive: boolean) {
    return apiRequest(`/customers/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  },
}

// Customer Codes API operations
export const customerCodesAPI = {
  // Get all customer codes (bulk operation - much faster)
  async getAll(customerIds?: string[]) {
    const params = customerIds ? `?customer_ids=${customerIds.join(',')}` : ''
    return apiRequest(`/customer-codes${params}`)
  },

  // Get all customer codes for a customer
  async getByCustomerId(customerId: string) {
    return apiRequest(`/customers/${customerId}/codes`)
  },

  // Create customer code
  async create(customerId: string, codeData: { code: string; product?: string }) {
    return apiRequest(`/customers/${customerId}/codes`, {
      method: 'POST',
      body: JSON.stringify(codeData),
    })
  },

  // Update customer code
  async update(codeId: string, updates: { code?: string; product?: string }) {
    return apiRequest(`/customer-codes/${codeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete customer code
  async delete(codeId: string) {
    return apiRequest(`/customer-codes/${codeId}`, {
      method: 'DELETE',
    })
  },

  // Bulk update customer codes (replace all codes for a customer)
  async bulkUpdate(customerId: string, codes: Array<{ code: string; product?: string }>) {
    return apiRequest(`/customers/${customerId}/codes/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ codes }),
    })
  },

  // Toggle customer code active status
  async toggleActive(codeId: string, isActive: boolean) {
    return apiRequest(`/customer-codes/${codeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  },
}

// Customer Rules API operations
export const rulesAPI = {
  // Get all rules
  async getAll() {
    return apiRequest('/rules')
  },

  // Get rule by ID
  async getById(id: string) {
    return apiRequest(`/rules/${id}`)
  },

  // Create new rule
  async create(ruleData: any) {
    return apiRequest('/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    })
  },

  // Update rule
  async update(id: string, updates: any) {
    return apiRequest(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete rule
  async delete(id: string) {
    return apiRequest(`/rules/${id}`, {
      method: 'DELETE',
    })
  },

  // Toggle rule active status
  async toggleActive(id: string, isActive: boolean) {
    return apiRequest(`/rules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })
  },

  // Update multiple rule priorities (for drag & drop)
  async updatePriorities(rules: Array<{ id: string; priority: number }>) {
    return apiRequest('/rules/priorities', {
      method: 'PATCH',
      body: JSON.stringify({ rules }),
    })
  },

  // Execute rules to assign customers
  async executeRules(options: { ruleIds?: string[], dryRun?: boolean } = {}) {
    const { ruleIds, dryRun = false } = options
    return apiRequest('/rules/execute', {
      method: 'POST',
      body: JSON.stringify({ ruleIds, dryRun, processAllData: true }),
    }, 300000) // 5 minutes timeout for rule execution (matches server timeout)
  },

  // Test API connection
  async testConnection() {
    return apiRequest('/rules/test', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
    })
  },
}

// Rates API operations
export const ratesAPI = {
  // Get all rates
  async getAll() {
    return apiRequest('/rates')
  },

  // Get rate by ID
  async getById(id: string) {
    return apiRequest(`/rates/${id}`)
  },

  // Create new rate
  async create(rateData: any) {
    return apiRequest('/rates', {
      method: 'POST',
      body: JSON.stringify(rateData),
    })
  },

  // Update rate
  async update(id: string, updates: any) {
    return apiRequest(`/rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete rate
  async delete(id: string) {
    return apiRequest(`/rates/${id}`, {
      method: 'DELETE',
    })
  },
}

// Rate Rules API operations
export const rateRulesAPI = {
  // Get all rate rules
  async getAll() {
    return apiRequest('/rate-rules')
  },

  // Get rate rule by ID
  async getById(id: string) {
    return apiRequest(`/rate-rules/${id}`)
  },

  // Create new rate rule
  async create(ruleData: any) {
    return apiRequest('/rate-rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    })
  },

  // Update rate rule
  async update(id: string, updates: any) {
    return apiRequest(`/rate-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete rate rule
  async delete(id: string) {
    return apiRequest(`/rate-rules/${id}`, {
      method: 'DELETE',
    })
  },

  // Toggle rate rule active status
  async toggleActive(id: string, isActive: boolean) {
    return apiRequest(`/rate-rules/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    })
  },

  // Update multiple rate rule priorities (for drag & drop)
  async updatePriorities(ruleUpdates: Array<{ id: string; priority: number }>) {
    return apiRequest('/rate-rules/priorities', {
      method: 'PATCH',
      body: JSON.stringify({ ruleUpdates }),
    })
  },

  // Execute rate rules to assign rates to cargo data
  async executeRules(ruleIds?: string[], dryRun: boolean = false) {
    return apiRequest('/rate-rules/execute', {
      method: 'POST',
      body: JSON.stringify({ ruleIds, dryRun }),
    }, 300000) // 5 minutes timeout for rule execution (matches server timeout)
  },
}

export const airportCodeAPI = {
  // Get all airport codes
  async getAll() {
    return apiRequest('/airport-codes')
  },

  // Get airport code by ID
  async getById(id: string) {
    return apiRequest(`/airport-codes/${id}`)
  },

  // Create airport code
  async create(airportCodeData: any) {
    return apiRequest('/airport-codes', {
      method: 'POST',
      body: JSON.stringify(airportCodeData)
    })
  },

  // Update airport code
  async update(id: string, updates: any) {
    return apiRequest(`/airport-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Delete airport code
  async delete(id: string) {
    return apiRequest(`/airport-codes/${id}`, {
      method: 'DELETE'
    })
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean) {
    return apiRequest(`/airport-codes/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    })
  },

  // Toggle EU status
  async toggleEU(id: string, isEU: boolean) {
    return apiRequest(`/airport-codes/${id}/toggle-eu`, {
      method: 'PATCH',
      body: JSON.stringify({ is_eu: isEU })
    })
  }
}

// Flights API operations
export const flightsAPI = {
  // Get all flights
  async getAll() {
    return apiRequest('/flights')
  },

  // Get flight by ID
  async getById(id: string) {
    return apiRequest(`/flights/${id}`)
  },

  // Create flight
  async create(flightData: any) {
    return apiRequest('/flights', {
      method: 'POST',
      body: JSON.stringify(flightData)
    })
  },

  // Update flight
  async update(id: string, updates: any) {
    return apiRequest(`/flights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Delete flight
  async delete(id: string) {
    return apiRequest(`/flights/${id}`, {
      method: 'DELETE'
    })
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean) {
    return apiRequest(`/flights/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    })
  }
}

// Sector Rates API operations
export const sectorRatesAPI = {
  // Get all sector rates
  async getAll() {
    return apiRequest('/sector-rates')
  },

  // Get sector rate by ID
  async getById(id: string) {
    return apiRequest(`/sector-rates/${id}`)
  },

  // Create sector rate
  async create(sectorRateData: any) {
    return apiRequest('/sector-rates', {
      method: 'POST',
      body: JSON.stringify(sectorRateData)
    })
  },

  // Update sector rate
  async update(id: string, updates: any) {
    return apiRequest(`/sector-rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  // Delete sector rate
  async delete(id: string) {
    return apiRequest(`/sector-rates/${id}`, {
      method: 'DELETE'
    })
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean) {
    return apiRequest(`/sector-rates/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    })
  }
}

