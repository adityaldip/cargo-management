// Client-side API utilities for server-side database operations

const API_BASE = '/api'

// Generic API request helper with timeout and retry logic
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  timeout: number = 10000
): Promise<{ data: T | null; error: string | null }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: 'Request failed' }))
      return { data: null, error: result.error || `HTTP ${response.status}: Request failed` }
    }

    const result = await response.json()
    return { data: result.data || result, error: null }
  } catch (error) {
    console.error('API Request Error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { data: null, error: 'Request timeout' }
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
  async create(customerId: string, codeData: { code: string; accounting_label?: string }) {
    return apiRequest(`/customers/${customerId}/codes`, {
      method: 'POST',
      body: JSON.stringify(codeData),
    })
  },

  // Update customer code
  async update(codeId: string, updates: { code?: string; accounting_label?: string }) {
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
  async bulkUpdate(customerId: string, codes: Array<{ code: string; accounting_label?: string }>) {
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
}

