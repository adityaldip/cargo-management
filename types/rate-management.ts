// Rate Management Types

export interface Rate {
  id: string
  name: string
  description?: string
  rate_type: string
  base_rate: number
  currency: string
  multiplier: number
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RateRule {
  id: string
  name: string
  description?: string
  isActive: boolean
  priority: number
  conditions: RateRuleCondition[]
  rate: number
  currency: string
  matchCount?: number
  multiplier?: number
  createdAt: string
  updatedAt: string
  rateId?: string
  rate_id?: string
  actions?: {
    assignRate?: string
    [key: string]: any
  }
}

export interface RateRuleCondition {
  id?: string
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'between'
  value: string
  value2?: string // for 'between' operator
  logic?: 'AND' | 'OR'
}

export interface RateConfig {
  key: string
  label: string
  visible: boolean
  order: number
  id?: string
}

export interface AssignRatesProps {
  data: any | null
  savedRateConditions?: any[]
  onSaveRateConditions?: (conditions: any[]) => void
  onContinue?: () => void
}

export type ViewType = "setup" | "configure" | "execute"

// Legacy types for backward compatibility
export interface LegacyRateRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  conditions: {
    field: "route" | "weight" | "mail_category" | "customer" | "flight_number" | "distance"
    operator: "equals" | "contains" | "greater_than" | "less_than" | "starts_with" | "ends_with" | "between"
    value: string
    value2?: string // for 'between' operator
  }[]
  actions: {
    rateType: "fixed" | "per_kg" | "distance_based" | "zone_based"
    baseRate: number
    multiplier?: number
    currency: "EUR" | "USD" | "GBP"
    tags: string[]
  }
  matchCount: number
  lastRun?: string
}
