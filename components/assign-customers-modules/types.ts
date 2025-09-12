import { Database } from "@/types/database"

// Database types
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerCode = Database['public']['Tables']['customer_codes']['Row']
export type CustomerRuleDB = Database['public']['Tables']['customer_rules']['Row']

// Extended customer type with codes
export interface CustomerWithCodes extends Customer {
  codes: CustomerCode[]
}

// Extended rule type that matches our component interface
export interface CustomerRuleExtended extends Omit<CustomerRuleDB, 'conditions' | 'actions' | 'where_fields'> {
  conditions: Array<{
    field: string
    operator: string
    value: string
  }>
  actions: {
    assignTo: string // This will now store customer_code ID instead of customer ID
  }
  where: string[]
}

// Shared props interface
export interface AssignCustomersProps {
  data: any | null
  savedPriorityConditions?: any[]
  onSavePriorityConditions?: (conditions: any[]) => void
}

// Tab type
export type TabType = "customers" | "configure" | "execute"
export type ViewType = "rules" | "results"
