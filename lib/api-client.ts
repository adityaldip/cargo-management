// Client-side API utilities for server-side database operations

const API_BASE = '/api'

// Generic API request helper
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: result.error || 'Request failed' }
    }

    return { data: result.data || result, error: null }
  } catch (error) {
    console.error('API Request Error:', error)
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

