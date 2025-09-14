export interface ReportData {
  rowLabel: string
  // Monthly data
  jan: number | null
  feb: number | null
  mar: number | null
  apr: number | null
  may: number | null
  jun: number | null
  jul: number | null
  aug: number | null
  sep: number | null
  oct: number | null
  nov: number | null
  dec: number | null
  // Weekly data - dynamic weeks (week1 to week52)
  [key: `week${number}`]: number | null
  // Totals
  total: number
  revenue: number
  weight: number
}

export interface ReportingSummary {
  totalRevenue: number
  totalWeight: number
  totalRecords: number
  routeCount: number
}

export interface ReportingFilters {
  dateFrom?: string
  dateTo?: string
  viewBy?: 'revenue' | 'weight'
  viewPeriod?: 'total' | 'week' | 'month'
}

export interface ReportingResponse {
  data: ReportData[]
  summary: ReportingSummary
  filters: ReportingFilters
}
