// Price assignment types
export interface Flight {
  id: string
  flightNumber: string
  origin: string
  destination: string
  airline: string
  aircraft: string
  departureTime: string
  arrivalTime: string
  status: 'scheduled' | 'delayed' | 'cancelled' | 'completed'
  price?: number
}

export interface AirportCode {
  id: string
  code: string
  is_active: boolean
  is_eu: boolean
  created_at: string
  updated_at: string
}

export interface SectorRate {
  id: string
  origin: string
  destination: string
  baseRate: number
  currency: string
  effectiveDate: string
  expiryDate?: string
  isActive: boolean
  notes?: string
}

export interface PriceAssignmentData {
  flights: Flight[]
  airportCodes: AirportCode[]
  sectorRates: SectorRate[]
  totalFlights: number
  totalAirports: number
  totalRates: number
}

// Shared props interface
export interface PriceAssignmentProps {
  data: PriceAssignmentData | null
  onSave?: (data: PriceAssignmentData) => void
  onExecute?: () => void
}

// Tab types
export type PriceAssignmentTabType = "flights" | "airport-codes" | "sector-rates" | "preview"
export type PriceAssignmentViewType = "main" | "results"
