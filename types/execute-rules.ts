// Types for ExecuteRules component

export interface CargoDataRecord {
  id: string
  inb_flight_date?: string
  outb_flight_date?: string
  rec_id?: string
  des_no?: string
  rec_numb?: string
  orig_oe?: string
  dest_oe?: string
  inb_flight_no?: string
  outb_flight_no?: string
  mail_cat?: string
  mail_class?: string
  total_kg?: string | number
  invoice?: string
  assigned_customer?: string
  customer_code_id?: string
  assigned_at?: string
  created_at?: string
  customers?: {
    id: string
    name: string
    code: string
  }
  customer_codes?: {
    id: string
    code: string
    customer_id: string
    customers: {
      id: string
      name: string
    }
  }
}

export interface Customer {
  id: string
  name: string
}

export interface ExecuteRulesProps {
  currentView: "rules" | "results"
  setCurrentView: (view: "rules" | "results") => void
}

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'number' | 'date'
}

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface Statistics {
  totalItems: number
  totalWeight: number
  avgWeight: number
  assignedCount: number
  unassignedCount: number
}
