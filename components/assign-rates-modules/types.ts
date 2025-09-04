export interface RateRule {
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
}

export type ViewType = "setup" | "configure" | "execute"
