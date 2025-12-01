"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { AddFlightUploadModalV3 } from "./AddFlightUploadModalV3"
import { EditFlightUploadModalV3 } from "./EditFlightUploadModalV3"
import { Edit } from "lucide-react"
import { SweetAlert } from "@/components/ui/sweet-alert"

interface SectorRateV3 {
  id: string
  status: boolean
  label: string | null
  airbaltic_origin: string[] | null
  airbaltic_destination: string[] | null
  sector_rate: number | null
  transit_routes: string[] | null
  transit_prices: (number | string)[] | null
  selected_routes: string[] | null
  customer_id: string | null
  customers: {
    id: string
    name: string
    code: string
  } | null
  created_at: string
  updated_at: string
}

interface UploadData {
  id?: string
  origin: string
  destination: string
  inbound: string
  outbound: string
  sector_rate_id?: string
  customer_id?: string | null
  transit_route?: string | null
  created_at?: string
  updated_at?: string
}

interface SectorRateOption {
  sectorRateId: string
  transitRoute: string | null
  displayText: string
  sectorRate: SectorRateV3
}

interface GeneratedData {
  id: string
  origin: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  destination: string
  selectedSectorRate: SectorRateV3 | null
  created_at?: string
  updated_at?: string
}

export function PreviewV3() {
  const { toast } = useToast()
  const [uploadData, setUploadData] = useState<UploadData[]>([])
  const [sectorRates, setSectorRates] = useState<SectorRateV3[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(1)
  
  // Upload table states
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [editRecord, setEditRecord] = useState<UploadData | null>(null)
  const [flights, setFlights] = useState<any[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; code: string }>>([])

  // Load data from database
  useEffect(() => {
    fetchSectorRates()
    fetchCustomers()
    loadDataFromDatabase()
  }, [refreshTrigger])


  const fetchSectorRates = async () => {
    try {
      setLoading(true)
      
      // Get sector rates first
      const { data: sectorRatesData, error: sectorRatesError } = await (supabase as any)
        .from('sector_rates_v3')
        .select('*')
        .eq('status', true)
        .order('created_at', { ascending: false })

      if (sectorRatesError) {
        console.error('Error fetching sector rates:', sectorRatesError)
        throw new Error(sectorRatesError.message || 'Failed to fetch sector rates')
      }

      // Get all customers
      const { data: customersData, error: customersError } = await (supabase as any)
        .from('customers')
        .select('id, name, code')

      if (customersError) {
        console.error('Error fetching customers:', customersError)
        throw new Error(customersError.message || 'Failed to fetch customers')
      }

      // Merge the data manually
      const mergedData = sectorRatesData?.map((rate: any) => ({
        ...rate,
        customers: customersData?.find((customer: any) => customer.id === rate.customer_id) || null
      })) || []

      setSectorRates(mergedData)
    } catch (error: any) {
      console.error('Error fetching sector rates:', error)
      toast({
        title: "Error",
        description: error?.message || 'Failed to fetch sector rates. Please ensure the sector_rates_v3 table exists.',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await (supabase as any)
        .from('customers')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (customersError) {
        console.error('Error fetching customers:', customersError)
        throw new Error(customersError.message || 'Failed to fetch customers')
      }

      setCustomers(customersData || [])
    } catch (error: any) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: error?.message || 'Failed to fetch customers.',
        variant: "destructive"
      })
    }
  }

  // Extract airport code from origin/destination (3rd to 5th characters)
  // If code is like "USFRAT" (length >= 5), extract "FRA" from position 3-5
  // If code is like "PRG" (length < 5), use it directly
  const extractAirportCode = (code: string): string => {
    if (!code) return ""
    if (code.length >= 5) {
      return code.substring(2, 5).toUpperCase()
    }
    return code.toUpperCase()
  }

  // Extract flight number from inbound/outbound string
  const extractFlightNumber = (flightString: string): string => {
    if (!flightString) return ""
    
    let match = flightString.match(/^([A-Z0-9]+),/)
    if (match) return match[1]
    
    match = flightString.match(/^([A-Z0-9]+)$/)
    if (match) return match[1]
    
    return ""
  }

  // Extract origin and destination from inbound/outbound flight string
  // Handles formats like "BT344 (DUS → RIX)", "BT344, DUS → RIX", or gets from flights table
  const extractFlightRoute = (flightString: string): { origin: string | null; destination: string | null } => {
    if (!flightString || flightString.trim() === "" || flightString === "-") {
      return { origin: null, destination: null }
    }
    
    // Try to extract from format with parentheses: "AA123 (CDG → JFK)" or "AA123 (CDG -> JFK)"
    // More flexible regex to handle various spacing and both arrow formats
    const matchParenthesesArrow = flightString.match(/\(([A-Z]{3})\s*(?:→|->)\s*([A-Z]{3})\)/)
    if (matchParenthesesArrow) {
      return { origin: matchParenthesesArrow[1].trim(), destination: matchParenthesesArrow[2].trim() }
    }
    
    // Also try without parentheses in case format is different
    const matchNoParentheses = flightString.match(/([A-Z]{3})\s*(?:→|->)\s*([A-Z]{3})/)
    if (matchNoParentheses) {
      // Check if this is not part of flight number (should have space or comma before)
      const beforeMatch = flightString.substring(0, matchNoParentheses.index || 0)
      if (beforeMatch.match(/[,\s\(]/)) {
        return { origin: matchNoParentheses[1].trim(), destination: matchNoParentheses[2].trim() }
      }
    }
    
    // Try to extract from format with comma: "BT344, DUS → RIX"
    const matchArrow = flightString.match(/, ([A-Z]{3})\s*→\s*([A-Z]{3})/)
    if (matchArrow) {
      return { origin: matchArrow[1], destination: matchArrow[2] }
    }
    
    // Try format with "->" and comma
    const matchDash = flightString.match(/, ([A-Z]{3})\s*->\s*([A-Z]{3})/)
    if (matchDash) {
      return { origin: matchDash[1], destination: matchDash[2] }
    }
    
    // If no route in string, try to get from flights table
    const flightNumber = extractFlightNumber(flightString)
    if (flightNumber && flights.length > 0) {
      const flight = flights.find(f => 
        f.flight_number?.toLowerCase() === flightNumber.toLowerCase()
      )
      if (flight) {
        return { 
          origin: flight.origin || null, 
          destination: flight.destination || null 
        }
      }
    }
    
    return { origin: null, destination: null }
  }

  // Check if flight exists in flights table
  const isFlightValid = (flightString: string): boolean => {
    if (!flightString || flightString.trim() === "" || flightString === "-") return true
    if (!flights.length) return true
    
    const flightNumber = extractFlightNumber(flightString)
    if (!flightNumber) return false
    
    return flights.some(flight => 
      flight.flight_number?.toLowerCase() === flightNumber.toLowerCase()
    )
  }

  // Format flight display with origin and destination
  const formatFlightDisplay = (flightString: string): string => {
    if (!flightString || flightString.trim() === "" || flightString === "-") {
      return "-"
    }
    
    // Extract flight number
    const flightNumber = extractFlightNumber(flightString)
    
    // If already has route format, extract and reformat
    if (flightString.includes("→") || flightString.includes("->")) {
      const route = extractFlightRoute(flightString)
      if (route.origin && route.destination) {
        return `${flightNumber} (${route.origin} → ${route.destination})`
      }
      // If can't extract route, return original
      return flightString
    }
    
    // Try to get route from flights table
    const route = extractFlightRoute(flightString)
    if (route.origin && route.destination) {
      return `${flightNumber} (${route.origin} → ${route.destination})`
    }
    
    // If no route found, return original string
    return flightString
  }

  const loadDataFromDatabase = async () => {
    setIsLoading(true)
    try {
      // Load preview_flights_v3 data
      const { data: dbData, error } = await (supabase as any)
        .from('preview_flights_v3')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading preview_flights_v3:', error)
        throw new Error(error.message || 'Failed to load preview flights data')
      }

      // Load flights data for validation
      const { data: flightsData, error: flightsError } = await supabase
        .from('flights')
        .select('*')
        .eq('is_active', true)

      if (flightsError) {
        console.error('Error loading flights:', flightsError)
        throw new Error(flightsError.message || 'Failed to load flights data')
      }

      setFlights(flightsData || [])
      setUploadData(dbData || [])
    } catch (error: any) {
      console.error('Error loading data:', error)
      const errorMessage = error?.message || error?.toString() || 'Failed to load data from database. Please ensure the preview_flights_v3 table exists.'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSuccess = () => {
    loadDataFromDatabase()
  }

  const handleEditSuccess = () => {
    loadDataFromDatabase()
  }

  const handleEdit = (record: UploadData) => {
    setEditRecord(record)
    setShowEditModal(true)
  }

  const removeRow = (index: number) => {
    setDeleteIndex(index)
    setShowDeleteAlert(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteIndex === null) return

    const row = uploadData[deleteIndex]
    
    try {
      if (row.id) {
        const { error } = await (supabase as any)
          .from('preview_flights_v3')
          .delete()
          .eq('id', row.id)

        if (error) {
          console.error('Error deleting record:', error)
          throw new Error(error.message || 'Failed to delete the record')
        }
      }

      const newData = uploadData.filter((_, i) => i !== deleteIndex)
      setUploadData(newData)

      toast({
        title: "Deleted!",
        description: "The record has been deleted.",
      })
    } catch (error: any) {
      console.error('Error deleting record:', error)
      toast({
        title: "Error!",
        description: error?.message || "Failed to delete the record.",
        variant: "destructive"
      })
    } finally {
      setShowDeleteAlert(false)
      setDeleteIndex(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteAlert(false)
    setDeleteIndex(null)
  }

  // Calculate total price for a selected route
  const calculateTotalPrice = (rate: SectorRateV3, selectedRoute: string): number => {
    let total = rate.sector_rate || 0
    
    // If no transit_routes or transit_prices, return sector_rate only
    if (!rate.transit_routes || !rate.transit_prices || rate.transit_routes.length === 0 || rate.transit_prices.length === 0) {
      return total
    }
    
    // Parse the selected route to get transit points
    // Format: "AMS -> ATH -> BER" or "AMS -> ATH -> ARN -> BER"
    const routeParts = selectedRoute.split('->').map(part => part.trim())
    
    // Skip first (origin) and last (destination), get transit points in between
    const transitPoints = routeParts.slice(1, -1)
    
    // For each transit point, find its price
    transitPoints.forEach((transitPoint) => {
      const transitIndex = rate.transit_routes?.indexOf(transitPoint)
      if (transitIndex !== undefined && transitIndex >= 0 && transitIndex < (rate.transit_prices?.length || 0) && rate.transit_prices) {
        const price = rate.transit_prices[transitIndex]
        // Handle both string and number prices
        const priceValue = typeof price === 'string' ? parseFloat(price) : (price || 0)
        if (!isNaN(priceValue)) {
          total += priceValue
        }
      }
    })
    
    return total
  }

  // Format original route from airbaltic_origin and airbaltic_destination
  // Extract airport codes if needed (handle formats like "USFRAT" -> "FRA" or "PRG" -> "PRG")
  const formatOriginalRoute = (rate: SectorRateV3): string => {
    const origins = rate.airbaltic_origin && rate.airbaltic_origin.length > 0 
      ? rate.airbaltic_origin.map(code => extractAirportCode(code)).join(', ') 
      : 'N/A'
    const destinations = rate.airbaltic_destination && rate.airbaltic_destination.length > 0 
      ? rate.airbaltic_destination.map(code => extractAirportCode(code)).join(', ') 
      : 'N/A'
    return `${origins} -> ${destinations}`
  }

  // Check if a route contains any of the specified airport codes
  const routeContainsAirportCodes = (route: string, airportCodes: string[]): boolean => {
    if (!route || airportCodes.length === 0) return false
    
    // Normalize route: handle both "->" and "→", and normalize whitespace
    const normalizedRoute = route.replace(/\s*->\s*/g, ' -> ').replace(/\s*→\s*/g, ' → ')
    
    // Parse route format: "AMS -> ATH -> BER" or "AMS → ATH → BER"
    // Split by both "->" and "→" and handle spaces
    const routeParts = normalizedRoute.split(/\s*->\s*|\s*→\s*/).map(part => part.trim().toUpperCase()).filter(part => part.length > 0)
    const codesUpper = airportCodes.map(code => code.trim().toUpperCase()).filter(code => code.length > 0)
    
    // Check if any airport code is in the route
    const matches = routeParts.some(part => codesUpper.includes(part))
    
    return matches
  }

  // Check if sector rate matches filtering criteria
  const matchesFilterCriteria = (
    rate: SectorRateV3,
    customerId: string | null | undefined,
    inboundRoute: { origin: string | null; destination: string | null },
    outboundRoute: { origin: string | null; destination: string | null }
  ): boolean => {
    // Filter by customer if customer is selected
    if (customerId && rate.customer_id !== customerId) {
      return false
    }
    
    // Collect all airport codes from inbound and outbound flights
    const requiredAirportCodes: string[] = []
    if (inboundRoute.origin) requiredAirportCodes.push(inboundRoute.origin)
    if (inboundRoute.destination) requiredAirportCodes.push(inboundRoute.destination)
    if (outboundRoute.origin) requiredAirportCodes.push(outboundRoute.origin)
    if (outboundRoute.destination) requiredAirportCodes.push(outboundRoute.destination)
    
    // If no airport codes specified, return true (show all)
    if (requiredAirportCodes.length === 0) {
      return true
    }
    
    // Check if rate has routes that include any of the required airport codes
    const allRoutes: string[] = []
    
    // Generate all possible original routes from origins and destinations arrays
    // Extract airport codes if needed (handle formats like "USFRAT" -> "FRA" or "PRG" -> "PRG")
    if (rate.airbaltic_origin && rate.airbaltic_origin.length > 0 && 
        rate.airbaltic_destination && rate.airbaltic_destination.length > 0) {
      rate.airbaltic_origin.forEach(origin => {
        rate.airbaltic_destination!.forEach(dest => {
          const extractedOrigin = extractAirportCode(origin)
          const extractedDest = extractAirportCode(dest)
          allRoutes.push(`${extractedOrigin} -> ${extractedDest}`)
        })
      })
    }
    
    // Add selected routes (transit routes) - these already have full route format
    if (rate.selected_routes && rate.selected_routes.length > 0) {
      allRoutes.push(...rate.selected_routes)
    }
    
    // Also check individual origin and destination arrays for airport codes
    // Extract airport codes if needed (handle formats like "USFRAT" -> "FRA" or "PRG" -> "PRG")
    // This handles cases where airport codes are in the arrays but not in a specific route
    const allAirportCodesInRate: string[] = []
    if (rate.airbaltic_origin && rate.airbaltic_origin.length > 0) {
      allAirportCodesInRate.push(...rate.airbaltic_origin.map(code => extractAirportCode(code).toUpperCase()))
    }
    if (rate.airbaltic_destination && rate.airbaltic_destination.length > 0) {
      allAirportCodesInRate.push(...rate.airbaltic_destination.map(code => extractAirportCode(code).toUpperCase()))
    }
    
    // Check if any required airport code is in the rate's airport codes
    const requiredCodesUpper = requiredAirportCodes.map(code => code.toUpperCase())
    const hasMatchingAirportCode = requiredCodesUpper.some(code => 
      allAirportCodesInRate.includes(code)
    )
    
    if (hasMatchingAirportCode) {
      return true
    }
    
    // Check if any route contains any of the required airport codes
    for (const route of allRoutes) {
      if (routeContainsAirportCodes(route, requiredAirportCodes)) {
        return true
      }
    }
    
    // No route matches the required airport codes
    return false
  }

  // Check if original route matches airport codes
  const originalRouteMatches = (
    rate: SectorRateV3,
    requiredAirportCodes: string[]
  ): boolean => {
    if (requiredAirportCodes.length === 0) return true
    
    // Generate all possible original routes from origins and destinations arrays
    // Extract airport codes if needed (handle formats like "USFRAT" -> "FRA" or "PRG" -> "PRG")
    const allOriginalRoutes: string[] = []
    if (rate.airbaltic_origin && rate.airbaltic_origin.length > 0 && 
        rate.airbaltic_destination && rate.airbaltic_destination.length > 0) {
      rate.airbaltic_origin.forEach(origin => {
        rate.airbaltic_destination!.forEach(dest => {
          const extractedOrigin = extractAirportCode(origin)
          const extractedDest = extractAirportCode(dest)
          allOriginalRoutes.push(`${extractedOrigin} -> ${extractedDest}`)
        })
      })
    }
    
    // Check if any original route contains any of the required airport codes
    for (const route of allOriginalRoutes) {
      if (routeContainsAirportCodes(route, requiredAirportCodes)) {
        return true
      }
    }
    
    return false
  }

  // Generate sector rate options with transit routes, filtered by customer and flight routes
  // Handles all cases:
  // 1. Inbound has value, outbound empty -> filter by inbound airport codes
  // 2. Inbound empty, outbound has value -> filter by outbound airport codes
  // 3. Both have values -> filter by both inbound and outbound airport codes
  // 4. Both empty -> show all routes (no filtering by airport codes)
  const generateSectorRateOptions = (row: UploadData): SectorRateOption[] => {
    const options: SectorRateOption[] = []
    
    // Get origin and destination from inbound and outbound flights
    const inboundRoute = extractFlightRoute(row.inbound || "")
    const outboundRoute = extractFlightRoute(row.outbound || "")
    
    // Check if inbound and outbound are empty or invalid
    const hasInbound = row.inbound && row.inbound.trim() !== "" && row.inbound !== "-" && 
                       (inboundRoute.origin || inboundRoute.destination)
    const hasOutbound = row.outbound && row.outbound.trim() !== "" && row.outbound !== "-" && 
                        (outboundRoute.origin || outboundRoute.destination)
    
    // If both inbound and outbound are empty, don't show any options
    if (!hasInbound && !hasOutbound) {
      return options
    }
    
    // Collect all airport codes from inbound and outbound flights, and from row origin/destination
    // Extract airport codes from row.origin and row.destination (handle formats like "USFRAT" -> "FRA" or "PRG" -> "PRG")
    // Only include valid airport codes (not null/empty)
    const requiredAirportCodes: string[] = []
    
    // Add origin and destination from row (extract airport code if needed)
    if (row.origin && row.origin.trim() && row.origin.trim() !== "-") {
      const extractedOrigin = extractAirportCode(row.origin.trim())
      if (extractedOrigin) {
        requiredAirportCodes.push(extractedOrigin)
      }
    }
    if (row.destination && row.destination.trim() && row.destination.trim() !== "-") {
      const extractedDestination = extractAirportCode(row.destination.trim())
      if (extractedDestination) {
        requiredAirportCodes.push(extractedDestination)
      }
    }
    
    // Add airport codes from inbound and outbound flights
    if (inboundRoute.origin && inboundRoute.origin.trim()) {
      requiredAirportCodes.push(inboundRoute.origin.trim())
    }
    if (inboundRoute.destination && inboundRoute.destination.trim()) {
      requiredAirportCodes.push(inboundRoute.destination.trim())
    }
    if (outboundRoute.origin && outboundRoute.origin.trim()) {
      requiredAirportCodes.push(outboundRoute.origin.trim())
    }
    if (outboundRoute.destination && outboundRoute.destination.trim()) {
      requiredAirportCodes.push(outboundRoute.destination.trim())
    }
    
    // Filter sector rates based on customer
    // Show rates that have no customer assigned (customer_id is null) OR rates that match the selected customer
    const customerFilteredRates = sectorRates.filter(rate => {
      if (row.customer_id) {
        // If customer is selected, show rates with no customer OR rates for that customer
        return rate.customer_id === null || rate.customer_id === row.customer_id
      }
      // If no customer selected, show all rates (though this shouldn't happen as sector rate is disabled)
      return true
    })
    
    customerFilteredRates.forEach((rate) => {
      // Only filter by airport codes if we have at least one airport code
      // If no airport codes (both inbound and outbound empty), show all routes (no filtering)
      const hasAirportCodes = requiredAirportCodes.length > 0
      
      // Check if original route matches (only show if matches or no filtering needed)
      const originalMatches = !hasAirportCodes || originalRouteMatches(rate, requiredAirportCodes)
      
      if (originalMatches) {
        // Add original rate option (without transit) only if it matches
        const basePrice = rate.sector_rate || 0
        const originalRoute = formatOriginalRoute(rate)
        // Format: Price, Route di baris pertama, (Customer) di baris baru
        const priceText = basePrice > 0 ? `€${basePrice.toFixed(2)}` : 'No Rate'
        const customerText = rate.customers?.name || 'no customer'
        // Format: "€2.00, AMS → BRU → ARN\n(Customer Name)" atau "€2.00, AMS → BRU → ARN\n(no customer)"
        // Menggunakan single newline untuk spacing yang lebih compact, selalu menampilkan customer line
        const originalDisplayText = `${priceText}, ${originalRoute}\n(${customerText})`
        options.push({
          sectorRateId: rate.id,
          transitRoute: null,
          displayText: originalDisplayText,
          sectorRate: rate
        })
      }
      
      // Process selected_routes array from database
      // Format: ["AMS -> BER -> FRA", "AMS -> BER -> CPH -> FRA", ...]
      if (rate.selected_routes && Array.isArray(rate.selected_routes) && rate.selected_routes.length > 0) {
        rate.selected_routes.forEach((route: string) => {
          // Ensure route is a string
          const routeString = typeof route === 'string' ? route : String(route)
          
          // Only add transit route if:
          // 1. No airport codes to filter by (both inbound and outbound empty) -> show all, OR
          // 2. Route contains any of the required airport codes (from inbound, outbound, or both)
          if (!hasAirportCodes || routeContainsAirportCodes(routeString, requiredAirportCodes)) {
            const totalPrice = calculateTotalPrice(rate, routeString)
            // Format: Price, Route di baris pertama, (Customer) di baris baru
            const priceText = `€${totalPrice.toFixed(2)}`
            const customerText = rate.customers?.name || 'no customer'
            // Format: "€2.00, AMS → BRU → ARN\n(Customer Name)" atau "€2.00, AMS → BRU → ARN\n(no customer)"
            // Menggunakan single newline untuk spacing yang lebih compact, selalu menampilkan customer line
            const displayText = `${priceText}, ${routeString}\n(${customerText})`
            options.push({
              sectorRateId: rate.id,
              transitRoute: routeString,
              displayText,
              sectorRate: rate
            })
          }
        })
      }
    })
    
    return options
  }

  const handleSectorRateChange = async (rowId: string, value: string) => {
    try {
      // Parse value: format is "sector_rate_id|transit_route" or just "sector_rate_id"
      const [sectorRateId, transitRoute] = value.split('|')
      
      const { error } = await (supabase as any)
        .from('preview_flights_v3')
        .update({ 
          sector_rate_id: sectorRateId,
          transit_route: transitRoute || null
        })
        .eq('id', rowId)

      if (error) {
        console.error('Error updating sector rate:', error)
        throw new Error(error.message || 'Failed to update sector rate')
      }

      // Update local state
      const newData = uploadData.map((item) => 
        item.id === rowId ? { 
          ...item, 
          sector_rate_id: sectorRateId,
          transit_route: transitRoute || null
        } : item
      )
      setUploadData(newData)

      toast({
        title: "Updated!",
        description: "Sector rate has been updated.",
      })
    } catch (error: any) {
      console.error('Error updating sector rate:', error)
      toast({
        title: "Error!",
        description: error?.message || "Failed to update sector rate.",
        variant: "destructive"
      })
    }
  }

  const handleCustomerChange = async (rowId: string, customerId: string) => {
    try {
      // Clear sector rate when customer changes
      const { error } = await (supabase as any)
        .from('preview_flights_v3')
        .update({ 
          customer_id: customerId || null,
          sector_rate_id: null,
          transit_route: null
        })
        .eq('id', rowId)

      if (error) {
        console.error('Error updating customer:', error)
        throw new Error(error.message || 'Failed to update customer')
      }

      // Update local state - clear sector rate when customer changes
      const newData = uploadData.map((item) => 
        item.id === rowId ? { 
          ...item, 
          customer_id: customerId || null,
          sector_rate_id: undefined,
          transit_route: undefined
        } : item
      )
      setUploadData(newData)

      toast({
        title: "Updated!",
        description: "Customer has been updated. Please select sector rate again.",
      })
    } catch (error: any) {
      console.error('Error updating customer:', error)
      toast({
        title: "Error!",
        description: error?.message || "Failed to update customer.",
        variant: "destructive"
      })
    }
  }


  const handleUpload = async () => {
    setIsUploading(true)
    try {
      const validRows = uploadData.filter(row => 
        row.origin.trim() !== "" && row.destination.trim() !== ""
      )

      if (validRows.length === 0) {
        toast({
          title: "No Valid Data",
          description: "Please enter at least origin and destination for one row.",
          variant: "destructive"
        })
        return
      }

      // Save to preview_flights_v3
      const { error } = await (supabase as any)
        .from('preview_flights_v3')
        .upsert(validRows.map(row => ({
          ...(row.id && { id: row.id }),
          origin: row.origin,
          destination: row.destination,
          inbound: row.inbound || null,
          outbound: row.outbound || null,
          sector_rate_id: row.sector_rate_id || null,
          customer_id: row.customer_id || null,
          transit_route: row.transit_route || null
        })), {
          onConflict: 'id'
        })

      if (error) {
        console.error('Error saving data:', error)
        throw new Error(error.message || 'Failed to save data to database')
      }

      await loadDataFromDatabase()

      toast({
        title: "Data Saved",
        description: `${validRows.length} record(s) saved successfully.`,
      })
    } catch (error: any) {
      console.error('Error saving data:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to save data to database. Please ensure the preview_flights_v3 table exists.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="p-1">
            {/* Upload Section */}
            <div className="flex justify-between items-center mb-1 w-[48%]">
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                + Add Record
              </Button>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 w-full flex justify-center items-center">
                <p className="w-full text-center font-bold text-black">Form upload file</p>
                <p className="w-full text-center font-bold text-black">System Generated</p>
                </div>
                <div className="flex justify-between items-center w-full">
                  <div className="w-[48%] border-b border-black"></div>
                  <div className="w-[50%] border-b border-black"></div>
                </div>
                
                {isLoading ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1 min-w-[80px]">Origin</TableHead>
                          <TableHead className="text-xs py-1 min-w-[80px]">Destination</TableHead>
                          <TableHead className="text-xs py-1 min-w-[100px]">Inbound Flight</TableHead>
                          <TableHead className="text-xs py-1 min-w-[100px]">Outbound Flight</TableHead>
                          <TableHead className="text-xs py-1 min-w-[60px]">Actions</TableHead>
                          <TableHead className="border-0 w-8"></TableHead>
                          <TableHead className="text-xs py-1 min-w-[40px] max-w-[45px]">Customer</TableHead>
                          <TableHead className="text-xs py-1 min-w-[40px] max-w-[45px]">Sector Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(3)].map((_, i) => (
                          <TableRow key={i} className="h-8">
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 h-8">
                              <div className="flex gap-0.5">
                                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                            </TableCell>
                            <TableCell className="w-8 border-0"></TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1 w-[80px]">Origin</TableHead>
                          <TableHead className="text-xs py-1 w-[80px]">Destination</TableHead>
                          <TableHead className="text-xs py-1 w-[100px]">Inbound Flight</TableHead>
                          <TableHead className="text-xs py-1 w-[100px]">Outbound Flight</TableHead>
                          <TableHead className="text-xs py-1 w-[60px]">Actions</TableHead>
                          <TableHead className="border-0 w-8"></TableHead>
                          <TableHead className="text-xs py-1 w-[225px]">Customer</TableHead>
                          <TableHead className="text-xs py-1 w-[225px]">Sector Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadData.map((row, index) => (
                          <TableRow key={row.id || index} className="h-8">
                            <TableCell className="py-1 text-xs h-8">
                              {row.origin}
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              {row.destination}
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <span className={!isFlightValid(row.inbound) ? "text-red-500" : ""}>
                                {formatFlightDisplay(row.inbound || "")}
                              </span>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <span className={!isFlightValid(row.outbound) ? "text-red-500" : ""}>
                                {formatFlightDisplay(row.outbound || "")}
                              </span>
                            </TableCell>
                            <TableCell className="py-1 h-8">
                              <div className="flex gap-0.5">
                                <Button
                                  onClick={() => handleEdit(row)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => removeRow(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="w-8 border-0"></TableCell>
                            <TableCell className="py-1 text-xs h-8 w-[225px]">
                              <SearchableSelect
                                options={customers.map((customer) => ({
                                  value: customer.id,
                                  label: `${customer.name} (${customer.code})`
                                }))}
                                value={row.customer_id || ""}
                                onValueChange={(value) => {
                                  if (row.id) {
                                    handleCustomerChange(row.id, value)
                                  } else {
                                    // For new records without ID, update local state only
                                    // Clear sector rate when customer changes
                                    const newData = uploadData.map((item, i) => 
                                      i === index ? { 
                                        ...item, 
                                        customer_id: value || null,
                                        sector_rate_id: undefined,
                                        transit_route: undefined
                                      } : item
                                    )
                                    setUploadData(newData)
                                  }
                                }}
                                placeholder="Select customer..."
                                searchPlaceholder="Search customer..."
                                emptyMessage="No customer found."
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8 w-[225px]">
                              <SearchableSelect
                                options={generateSectorRateOptions(row).map((option, optIndex) => ({
                                  value: option.transitRoute 
                                    ? `${option.sectorRateId}|${option.transitRoute}`
                                    : option.sectorRateId,
                                  label: option.displayText
                                }))}
                                value={row.sector_rate_id && row.transit_route 
                                  ? `${row.sector_rate_id}|${row.transit_route}`
                                  : row.sector_rate_id || ""}
                                onValueChange={(value) => {
                                  // Parse value: format is "sector_rate_id|transit_route" or just "sector_rate_id"
                                  const [sectorRateId, transitRoute] = value.split('|')
                                  
                                  if (row.id) {
                                    handleSectorRateChange(row.id, value)
                                  } else {
                                    // For new records without ID, update local state only
                                    const newData = uploadData.map((item, i) => 
                                      i === index ? { 
                                        ...item, 
                                        sector_rate_id: sectorRateId,
                                        transit_route: transitRoute || null
                                      } : item
                                    )
                                    setUploadData(newData)
                                  }
                                }}
                                placeholder={
                                  !row.customer_id 
                                    ? "Select customer first..." 
                                    : (!row.inbound || row.inbound.trim() === "" || row.inbound === "-") && 
                                      (!row.outbound || row.outbound.trim() === "" || row.outbound === "-")
                                    ? "Add inbound/outbound first..."
                                    : "Select rate..."
                                }
                                searchPlaceholder="Search rate..."
                                emptyMessage="No rate found."
                                className="min-h-[2.5rem] text-xs"
                                disabled={
                                  !row.customer_id || 
                                  ((!row.inbound || row.inbound.trim() === "" || row.inbound === "-") && 
                                   (!row.outbound || row.outbound.trim() === "" || row.outbound === "-"))
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Flight Upload Modal */}
      <AddFlightUploadModalV3
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Flight Upload Modal */}
      <EditFlightUploadModalV3
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        record={editRecord}
      />

      {/* Sweet Alert for delete confirmation */}
      <SweetAlert
        isVisible={showDeleteAlert}
        title="Are you sure?"
        text="You won't be able to revert this!"
        type="warning"
        showCancelButton={true}
        confirmButtonText="Yes, delete it!"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
