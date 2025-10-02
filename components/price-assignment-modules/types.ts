// Price assignment types
export interface Flight {
  id: string
  flightNumber: string
  origin: string
  destination: string
  originAirportId: string
  destinationAirportId: string
  status: 'scheduled' | 'delayed' | 'cancelled' | 'completed'
  is_active: boolean
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
  origin_airport_id: string
  destination_airport_id: string
  sector_rate: number
  flight_num_preview?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
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
