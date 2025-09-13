export interface CargoData {
  id: string
  origOE: string
  destOE: string
  inbFlightNo: string
  outbFlightNo?: string
  mailCat: string
  mailClass: string
  totalKg: number
  invoiceExtend: string
  customer?: string
  date?: string
  sector?: string
  euromail?: string
  combined?: string
  totalEur?: number
  vatEur?: number
  recordId?: string
  desNo?: string
  recNumb?: string
  outbDate?: string
}

// Database cargo_data table interface
export interface DatabaseCargoData {
  id: string
  rec_id: string
  inb_flight_date: string | null
  outb_flight_date: string | null
  des_no: string | null
  rec_numb: string | null
  orig_oe: string | null
  dest_oe: string | null
  inb_flight_no: string | null
  outb_flight_no: string | null
  mail_cat: string | null
  mail_class: string | null
  total_kg: number | null
  invoice: string | null
  customer_name_number: string | null
  assigned_customer: string | null
  customer_code_id: string | null
  assigned_rate: number | null
  rate_currency: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
  assigned_at: string | null
  rate_id: string | null
  rate_value: number | null
  rates?: {
    id: string
    name: string
    description: string | null
    rate_type: string
    base_rate: number
    currency: string
  } | null
}

// Invoice data interface for cargo_data based invoices
export interface CargoInvoice {
  id: string
  invoiceNumber: string
  customer: string
  date: string
  dueDate: string
  amount: number
  status: "paid" | "pending" | "overdue" | "draft"
  items: number
  totalWeight: number
  route: string
  currency: string
  paymentMethod?: string
  itemsDetails: CargoInvoiceItem[]
  // Customer details from customers table
  customer_id?: string
  customer_code?: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  customer_contact_person?: string
  customer_city?: string
  customer_state?: string
  customer_postal_code?: string
  customer_country?: string
  customer_accounting_label?: string
}

export interface CargoInvoiceItem {
  id: string
  recId: string
  route: string
  mailCat: string
  mailClass: string
  weight: number
  rate: number
  amount: number
  date: string
  invoice?: string
  origOE: string
  destOE: string
  rateInfo?: {
    id: string
    name: string
    description: string | null
    rate_type: string
    base_rate: number
    currency: string
  } | null
}

export interface ProcessedData {
  data: CargoData[]
  missingFields: string[]
  warnings: string[]
  summary: {
    totalRecords: number
    euSubtotal: number
    nonEuSubtotal: number
    total: number
    totalKg: number
  }
}

export interface FileProcessingResult {
  success: boolean
  data?: ProcessedData
  error?: string
}
