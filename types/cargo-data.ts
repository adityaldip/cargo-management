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
