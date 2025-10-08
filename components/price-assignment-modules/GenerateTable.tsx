"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConvertModal } from "./ConvertModal"

interface FlightUploadData {
  id?: string
  origin: string
  destination: string
  inbound: string
  outbound: string
  converted_origin?: string
  converted_destination?: string
  before_bt_from?: string
  before_bt_to?: string
  after_bt_from?: string
  after_bt_to?: string
  applied_rate?: string
  selected_sector_rate_ids?: string[]
  sector_rate_id?: string
  sector_rate?: {
    id: string
    origin: string
    destination: string
    sector_rate: number
  }
  is_converted?: boolean
  created_at?: string
  updated_at?: string
}

interface GeneratedData {
  id?: string
  origin: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  destination: string
  sectorRates: string
  availableSectorRates: any[]
  totalRouteAndSum?: {
    route: string
    totalSum: number
    rates: any[]
  }
  isConverted?: boolean
  selectedSectorRateIds?: string[]
  selectedSectorRate?: {
    id: string
    origin: string
    destination: string
    sector_rate: number
  }
  convertedData?: {
    converted_origin?: string
    converted_destination?: string
    before_bt_from?: string
    before_bt_to?: string
    after_bt_from?: string
    after_bt_to?: string
    applied_rate?: string
    selected_sector_rate_ids?: string[]
    sector_rate_id?: string
    inbound?: string
    outbound?: string
  }
}

interface GenerateTableProps {
  data: GeneratedData[]
  refreshTrigger?: number
}

export function GenerateTable({ data, refreshTrigger }: GenerateTableProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [flightData, setFlightData] = useState<FlightUploadData[]>([])
  const [flightsData, setFlightsData] = useState<any[]>([])
  const [sectorRatesData, setSectorRatesData] = useState<any[]>([])
  const [generatedData, setGeneratedData] = useState<GeneratedData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState("")
  const [selectedFlightData, setSelectedFlightData] = useState<any>(null)
  const [selectedRates, setSelectedRates] = useState<{[key: string]: string[]}>({})
  const { toast } = useToast()

  const processingSteps = [
    "Validating flight data...",
    "Checking airport codes...",
    "Calculating sector rates...",
    "Applying rate multipliers...",
    "Generating final prices...",
    "Completing assignment..."
  ]

  // Handle rate selection
  const handleRateSelection = async (rowId: string, rateId: string, checked: boolean) => {
    // Show loading toast
    toast({
      title: "Updating...",
      description: checked ? "Adding rate selection..." : "Removing rate selection...",
    })

    // Update local state first for immediate UI feedback
    setSelectedRates(prev => {
      const currentSelected = prev[rowId] || []
      if (checked) {
        return {
          ...prev,
          [rowId]: [...currentSelected, rateId]
        }
      } else {
        return {
          ...prev,
          [rowId]: currentSelected.filter(id => id !== rateId)
        }
      }
    })

    // Update database
    try {
      const currentSelected = selectedRates[rowId] || []
      let newSelectedIds: string[]
      
      if (checked) {
        // Add rate ID to array if not already present
        newSelectedIds = [...currentSelected, rateId]
      } else {
        // Remove rate ID from array
        newSelectedIds = currentSelected.filter(id => id !== rateId)
      }

      const { error } = await (supabase as any)
        .from('flight_uploads')
        .update({ selected_sector_rate_ids: newSelectedIds })
        .eq('id', rowId)

      if (error) {
        console.error('Error updating selected rates:', error)
        toast({
          title: "Error",
          description: "Failed to update rate selection in database.",
          variant: "destructive"
        })
        // Revert local state on error
        setSelectedRates(prev => ({
          ...prev,
          [rowId]: currentSelected
        }))
      } else {
        // Show success toast
        toast({
          title: "Success",
          description: checked ? "Rate selection added successfully!" : "Rate selection removed successfully!",
        })
      }
    } catch (error) {
      console.error('Error updating selected rates:', error)
      toast({
        title: "Error", 
        description: "Failed to update rate selection in database.",
        variant: "destructive"
      })
      // Revert local state on error
      setSelectedRates(prev => ({
        ...prev,
        [rowId]: selectedRates[rowId] || []
      }))
    }
  }

  // Calculate total for selected rates
  const calculateSelectedTotal = (rowId: string, rates: any[], rowData?: any) => {
    // Use local state for immediate UI updates
    const selectedRateIds = selectedRates[rowId] || []
    
    const selectedRatesList = rates.filter(rate => selectedRateIds.includes(rate.id))
    const total = selectedRatesList.reduce((sum, rate) => sum + rate.sector_rate, 0)
    return Math.round(total * 100) / 100
  }

  // Extract airport code from origin/destination (3rd to 5th letters)
  const extractAirportCode = (code: string): string => {
    if (code.length >= 5) {
      return code.substring(2, 5).toUpperCase()
    }
    return code.toUpperCase()
  }

  // Find flight in flights table by flight number
  const findFlight = (flightNumber: string) => {
    return flightsData.find(flight => 
      flight.flight_number?.toLowerCase() === flightNumber.toLowerCase()
    )
  }

  // Format flight with ORG → DEST if found in flights table
  const formatFlight = (flightNumber: string) => {
    const flight = findFlight(flightNumber)
    if (flight) {
      const flightOrigin = extractAirportCode(flight.origin || '')
      const flightDestination = extractAirportCode(flight.destination || '')
      return `${flightNumber}, ${flightOrigin} → ${flightDestination}`
    }
    return flightNumber
  }

  // Get flight origin and destination from flights table
  const getFlightRoute = (flightNumber: string) => {
    const flight = findFlight(flightNumber)
    if (flight) {
      return {
        origin: extractAirportCode(flight.origin || ''),
        destination: extractAirportCode(flight.destination || '')
      }
    }
    return null
  }

  // Find matching sector rates for a route
  const findMatchingSectorRates = (route: string) => {
    if (!route || route === "-") return []
    
    // Extract origin and destination from route (e.g., "FRA -> DUS" or "FRA → DUS")
    const routeMatch = route.match(/([A-Z]{3})\s*->\s*([A-Z]{3})/)
    if (!routeMatch) {
      return []
    }
    
    const [, origin, destination] = routeMatch
    
    const matchingRates = sectorRatesData.filter(rate => 
      rate.origin === origin && rate.destination === destination
    )
    
    return matchingRates
  }

  // Extract route from flight string (e.g., "BT344, DXB → LAX" -> "DXB → LAX")
  const extractRouteFromFlight = (flightString: string): string | null => {
    if (!flightString || flightString === "-") return null
    
    // Try to match format with comma and arrow (e.g., "BT344, DXB → LAX")
    const match = flightString.match(/, ([A-Z]{3}) → ([A-Z]{3})/)
    if (match) {
      return `${match[1]} → ${match[2]}`
    }
    
    return null
  }

  // Extract route from connection string (e.g., "FRA -> DXB" -> "FRA → DXB")
  const extractRouteFromConnection = (connectionString: string): string | null => {
    if (!connectionString || connectionString === "-" || connectionString === "-") return null
    
    // Check for both formats: "FRA -> DXB" and "FRA → DXB"
    const matchArrow = connectionString.match(/([A-Z]{3}) → ([A-Z]{3})/)
    const matchDash = connectionString.match(/([A-Z]{3}) -> ([A-Z]{3})/)
    
    if (matchArrow) {
      return connectionString
    } else if (matchDash) {
      // Convert "->" to "→" for consistency
      return `${matchDash[1]} → ${matchDash[2]}`
    }
    
    return null
  }

  // Find matching sector rates for a route
  const findSectorRatesForRoute = (route: string) => {
    if (!route) return []
    
    const routeMatch = route.match(/([A-Z]{3}) → ([A-Z]{3})/)
    if (!routeMatch) return []
    
    const [, origin, destination] = routeMatch
    
    return sectorRatesData.filter(rate => 
      rate.origin === origin && rate.destination === destination
    )
  }

  // Calculate total route and sum of rates
  const calculateTotalRouteAndSum = (beforeBT: string, inbound: string, outbound: string, afterBT: string, origin: string, destination: string) => {
    const allRates: any[] = []
    
    // Extract routes from each column
    const beforeBTRoute = extractRouteFromConnection(beforeBT)
    const inboundRoute = extractRouteFromFlight(inbound)
    const outboundRoute = extractRouteFromFlight(outbound)
    const afterBTRoute = extractRouteFromConnection(afterBT)
    
    // Find sector rates for each route
    if (beforeBTRoute) {
      const rates = findSectorRatesForRoute(beforeBTRoute)
      allRates.push(...rates)
    }
    if (inboundRoute) {
      const rates = findSectorRatesForRoute(inboundRoute)
      allRates.push(...rates)
    }
    if (outboundRoute) {
      const rates = findSectorRatesForRoute(outboundRoute)
      allRates.push(...rates)
    }
    if (afterBTRoute) {
      const rates = findSectorRatesForRoute(afterBTRoute)
      allRates.push(...rates)
    }
    
    // Remove duplicates and calculate sum
    const uniqueRates = allRates.filter((rate, index, self) => 
      index === self.findIndex(r => r.id === rate.id)
    )
    
    // Round each rate to 2 decimal places to avoid floating point precision issues
    const roundedRates = uniqueRates.map(rate => ({
      ...rate,
      sector_rate: Math.round(rate.sector_rate * 100) / 100
    }))
    
    const totalSum = roundedRates.reduce((sum, rate) => sum + rate.sector_rate, 0)
    
    return {
      route: `${origin} → ${destination}`,
      totalSum: Math.round(totalSum * 100) / 100,
      rates: roundedRates
    }
  }

  // Get all available sector rates from routes in before BT, inbound, outbound, after BT
  const getAvailableSectorRates = (beforeBT: string, inbound: string, outbound: string, afterBT: string) => {
    const allRates: any[] = []
    
    // Extract routes from each column
    const beforeBTRoute = extractRouteFromConnection(beforeBT)
    const inboundRoute = extractRouteFromFlight(inbound)
    const outboundRoute = extractRouteFromFlight(outbound)
    const afterBTRoute = extractRouteFromConnection(afterBT)
    
    console.log('Extracted routes:', { beforeBTRoute, inboundRoute, outboundRoute, afterBTRoute })
    
    // Find sector rates for each route
    if (beforeBTRoute) {
      const rates = findSectorRatesForRoute(beforeBTRoute)
      console.log(`Before BT route "${beforeBTRoute}" found ${rates.length} rates:`, rates)
      allRates.push(...rates)
    }
    if (inboundRoute) {
      const rates = findSectorRatesForRoute(inboundRoute)
      console.log(`Inbound route "${inboundRoute}" found ${rates.length} rates:`, rates)
      allRates.push(...rates)
    }
    if (outboundRoute) {
      const rates = findSectorRatesForRoute(outboundRoute)
      console.log(`Outbound route "${outboundRoute}" found ${rates.length} rates:`, rates)
      allRates.push(...rates)
    }
    if (afterBTRoute) {
      const rates = findSectorRatesForRoute(afterBTRoute)
      console.log(`After BT route "${afterBTRoute}" found ${rates.length} rates:`, rates)
      allRates.push(...rates)
    }
    
    // Remove duplicates and sort by rate (highest first)
    const uniqueRates = allRates.filter((rate, index, self) => 
      index === self.findIndex(r => r.id === rate.id)
    )
    
    // Round each rate to 2 decimal places to avoid floating point precision issues
    const roundedRates = uniqueRates.map(rate => ({
      ...rate,
      sector_rate: Math.round(rate.sector_rate * 100) / 100
    }))
    
    const sortedRates = roundedRates.sort((a, b) => b.sector_rate - a.sector_rate)
    console.log('Final filtered rates:', sortedRates)
    
    return sortedRates
  }

  // Load flight data from database
  const loadFlightData = async () => {
    setIsLoading(true)
    try {
      // Load flight uploads with sector rate information
      const { data: uploadData, error: uploadError } = await supabase
        .from('flight_uploads')
        .select(`
          *,
          sector_rate:sector_rates(
            id,
            origin,
            destination,
            sector_rate
          )
        `)
        .order('created_at', { ascending: false })

      if (uploadError) throw uploadError

      // Load flights data
      const { data: flightsDbData, error: flightsError } = await supabase
        .from('flights')
        .select('*')
        .eq('is_active', true)

      if (flightsError) throw flightsError

      // Load all active sector rates
      const { data: sectorRatesDbData, error: sectorRatesError } = await supabase
        .from('sector_rates')
        .select('*')
        .eq('is_active', true)
        .order('origin', { ascending: true })

      if (sectorRatesError) {
        console.error('Error loading sector rates:', sectorRatesError)
        throw sectorRatesError
      }

      setFlightData(uploadData || [])
      setFlightsData(flightsDbData || [])
      setSectorRatesData(sectorRatesDbData || [])
      
      // If no upload data, clear generated data immediately
      if (!uploadData || uploadData.length === 0) {
        setGeneratedData([])
      }
    } catch (error) {
      console.error('Error loading flight data:', error)
      toast({
        title: "Error",
        description: "Failed to load flight data from database.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadFlightData()
  }, [])

  // Reload data when refreshTrigger changes (from UploadTable operations)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadFlightData()
    }
  }, [refreshTrigger])

  // Generate data from flight uploads
  const generateData = () => {
    const generated = flightData.map(flight => {
      const originCode = extractAirportCode(flight.origin)
      const destinationCode = extractAirportCode(flight.destination)
      
      // Build beforeBT - show origin → inbound origin when inbound flight exists
      // If inbound is empty, get origin from outbound flight
      let beforeBT = "-"
      
      if (flight.inbound) {
        const inboundRoute = getFlightRoute(flight.inbound)
        if (inboundRoute) {
          // Only show connection if origin is different from inbound origin
          if (originCode !== inboundRoute.origin) {
            beforeBT = `${originCode} → ${inboundRoute.origin}`
          } else {
            // Same origin, no connection needed
            beforeBT = "-"
            console.log(`Same origin detected: ${originCode} === ${inboundRoute.origin}, setting beforeBT to "-"`)
          }
        } else {
          // Flight not found in flights table
          beforeBT = "-"
        }
      } else if (flight.outbound) {
        // When inbound is empty, get origin from outbound flight
        const outboundRoute = getFlightRoute(flight.outbound)
        if (outboundRoute) {
          // Only show connection if origin is different from outbound origin
          if (originCode !== outboundRoute.origin) {
            beforeBT = `${originCode} → ${outboundRoute.origin}`
          } else {
            // Same origin, no connection needed
            beforeBT = "-"
            console.log(`Same origin detected: ${originCode} === ${outboundRoute.origin}, setting beforeBT to "-"`)
          }
        } else {
          // Flight not found in flights table
          beforeBT = "-"
        }
      }
      
      // Build afterBT - show outbound destination → destination when outbound flight exists
      let afterBT = "-"
      
      if (flight.outbound) {
        const outboundRoute = getFlightRoute(flight.outbound)
        if (outboundRoute) {
          // Only show connection if destination is different from outbound destination
          if (destinationCode !== outboundRoute.destination) {
            afterBT = `${outboundRoute.destination} → ${destinationCode}`
          } else {
            // Same destination, no connection needed
            afterBT = "-"
            console.log(`Same destination detected: ${destinationCode} === ${outboundRoute.destination}, setting afterBT to "-"`)
          }
        } else {
          // Flight not found in flights table
          afterBT = "-"
        }
      }

      // Calculate total route and sum of rates
      const totalRouteAndSum = calculateTotalRouteAndSum(
        beforeBT, 
        flight.inbound ? formatFlight(flight.inbound) : "-",
        flight.outbound ? formatFlight(flight.outbound) : "-", 
        afterBT,
        originCode,
        destinationCode
      )

      // Get available sector rates for all routes from the 4 columns
      const availableSectorRates = getAvailableSectorRates(
        beforeBT, 
        flight.inbound ? formatFlight(flight.inbound) : "-",
        flight.outbound ? formatFlight(flight.outbound) : "-", 
        afterBT
      )


      // Calculate selected rates total from database
      const selectedRateIds = flight.selected_sector_rate_ids || []
      const selectedRatesList = availableSectorRates.filter(rate => selectedRateIds.includes(rate.id))
      const selectedTotal = selectedRatesList.reduce((sum, rate) => sum + rate.sector_rate, 0)
      const selectedTotalRounded = Math.round(selectedTotal * 100) / 100

      return {
        id: flight.id,
        origin: originCode,
        beforeBT: beforeBT,
        inbound: flight.is_converted ? "-" : (flight.inbound ? formatFlight(flight.inbound) : "-"),
        outbound: flight.is_converted ? "-" : (flight.outbound ? formatFlight(flight.outbound) : "-"),
        afterBT: afterBT,
        destination: flight.is_converted ? "-" : destinationCode,
        sectorRates: selectedRateIds.length > 0 
          ? `${totalRouteAndSum.route}, €${selectedTotalRounded.toFixed(2)}`
          : `${totalRouteAndSum.route}, €${totalRouteAndSum.totalSum.toFixed(2)}`,
        availableSectorRates: availableSectorRates,
        totalRouteAndSum: totalRouteAndSum,
        isConverted: flight.is_converted || false,
        convertedData: flight.is_converted ? {
          converted_origin: flight.converted_origin,
          converted_destination: flight.converted_destination,
          before_bt_from: flight.before_bt_from,
          before_bt_to: flight.before_bt_to,
          after_bt_from: flight.after_bt_from,
          after_bt_to: flight.after_bt_to,
          applied_rate: flight.applied_rate,
          selected_sector_rate_ids: flight.selected_sector_rate_ids,
          sector_rate_id: flight.sector_rate_id,
          inbound: flight.inbound,
          outbound: flight.outbound
        } : undefined,
        selectedSectorRateIds: flight.selected_sector_rate_ids || [],
        selectedSectorRate: flight.sector_rate_id ? {
          id: flight.sector_rate_id,
          origin: flight.sector_rate?.origin || '',
          destination: flight.sector_rate?.destination || '',
          sector_rate: flight.sector_rate?.sector_rate || 0
        } : undefined
      }
    })

    setGeneratedData(generated)
  }

  // Auto-generate data when flight data changes
  useEffect(() => {
    if (flightData.length > 0) {
      generateData()
    } else {
      // Clear generated data when no flight data exists
      setGeneratedData([])
    }
  }, [flightData, flightsData, sectorRatesData])

  // Initialize selectedRates with existing Supabase data
  useEffect(() => {
    if (flightData.length > 0) {
      const initialSelectedRates: {[key: string]: string[]} = {}
      
      flightData.forEach(flight => {
        if (flight.id && flight.selected_sector_rate_ids && flight.selected_sector_rate_ids.length > 0) {
          initialSelectedRates[flight.id] = flight.selected_sector_rate_ids
        }
      })
      
      setSelectedRates(initialSelectedRates)
    }
  }, [flightData])

  const handleProcessAssignment = async () => {
    setIsProcessing(true)
    setProcessingStep(0)

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProcessingStep(i + 1)
    }

    // Regenerate data
    generateData()
    
    setIsProcessing(false)
    toast({
      title: "Processing Complete",
      description: "Price assignment has been regenerated successfully.",
    })
  }

  if (isLoading) {
    return (
      <div className="p-1">
        <div className="flex justify-end items-center mb-1">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="text-xs text-gray-500 w-full flex justify-center items-center mb-1">
          <p className="w-full text-center font-bold text-black">System Generated</p>
        </div>
        <div className="w-full border-b border-black mb-2"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-2">
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-1">
      <div className="flex justify-end items-center mb-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3"
                  onClick={handleProcessAssignment}
                  disabled={true}
                >
                  Generate
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is disabled</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Processing Status */}
      {isProcessing && (
        <div className="mb-2">
          <Progress value={(processingStep / processingSteps.length) * 100} className="w-full" />
          <p className="text-xs text-gray-600 mt-1">
            {processingSteps[processingStep - 1] || "Starting..."}
          </p>
        </div>
      )}
      <div className="text-xs text-gray-500 w-full flex justify-center items-center">
        <p className="w-full text-center font-bold text-black">System Generated</p>
      </div>
      <div className="w-full border-b border-black"></div>
      <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs py-1 min-w-[60px]">Origin</TableHead>
                  <TableHead className="text-xs py-1 min-w-[80px]">before BT</TableHead>
                  <TableHead className="text-xs py-1 min-w-[100px]">inbound</TableHead>
                  <TableHead className="text-xs py-1 min-w-[100px]">outbound</TableHead>
                  <TableHead className="text-xs py-1 min-w-[80px]">after BT</TableHead>
                  <TableHead className="text-xs py-1 min-w-[60px]">Destination</TableHead>
                  <TableHead className="text-xs py-1 min-w-[120px]">Sector Rates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedData.map((row, index) => (
                <TableRow 
                  key={index}
                  className="cursor-pointer hover:bg-gray-50 h-8"
                  onClick={() => {
                    setSelectedOrigin(row.origin)
                    // Find the original flight data from flightData
                    const originalFlight = flightData.find(flight => flight.id === row.id)
                    setSelectedFlightData(originalFlight)
                    setShowConvertModal(true)
                  }}
                >
                  <TableCell className="py-1 h-8">
                    {row.convertedData?.converted_origin ? (
                      <span className="text-xs">
                        {row.convertedData.converted_origin}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-5 text-xs px-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent row click
                            setSelectedOrigin(row.origin)
                            // Find the original flight data from flightData
                            const originalFlight = flightData.find(flight => flight.id === row.id)
                            setSelectedFlightData(originalFlight)
                            setShowConvertModal(true)
                          }}
                        >
                          Convert
                        </Button>
                        <span className="text-xs">
                          {row.origin}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-1 h-8">
                    <span className="text-xs">
                      {row.isConverted && row.convertedData?.before_bt_from && row.convertedData?.before_bt_to
                        ? `${row.convertedData.before_bt_from} → ${row.convertedData.before_bt_to}`
                        : row.beforeBT}
                    </span>
                  </TableCell>
                  <TableCell className="py-1 h-8">
                    <span className="text-xs">
                      {row.isConverted && row.convertedData?.inbound
                        ? (() => {
                            // For converted data, try to get flight route from flights table
                            const flightRoute = getFlightRoute(row.convertedData.inbound)
                            if (flightRoute) {
                              return `${row.convertedData.inbound}, ${flightRoute.origin} → ${flightRoute.destination}`
                            }
                            return row.convertedData.inbound
                          })()
                        : (() => {
                            // Find the original flight data
                            const originalFlight = flightData.find(flight => flight.id === row.id)
                            if (originalFlight?.inbound) {
                              // Try to get flight route from flights table
                              const flightRoute = getFlightRoute(originalFlight.inbound)
                              if (flightRoute) {
                                return `${originalFlight.inbound}, ${flightRoute.origin} → ${flightRoute.destination}`
                              }
                              return originalFlight.inbound
                            }
                            return "-"
                          })()}
                    </span>
                  </TableCell>
                  <TableCell className="py-1 h-8">
                    <span className="text-xs">
                      {row.isConverted && row.convertedData?.outbound
                        ? (() => {
                            // For converted data, try to get flight route from flights table
                            const flightRoute = getFlightRoute(row.convertedData.outbound)
                            if (flightRoute) {
                              return `${row.convertedData.outbound}, ${flightRoute.origin} → ${flightRoute.destination}`
                            }
                            return row.convertedData.outbound
                          })()
                        : (() => {
                            // Find the original flight data
                            const originalFlight = flightData.find(flight => flight.id === row.id)
                            if (originalFlight?.outbound) {
                              // Try to get flight route from flights table
                              const flightRoute = getFlightRoute(originalFlight.outbound)
                              if (flightRoute) {
                                return `${originalFlight.outbound}, ${flightRoute.origin} → ${flightRoute.destination}`
                              }
                              return originalFlight.outbound
                            }
                            return "-"
                          })()}
                    </span>
                  </TableCell>
                  <TableCell className="py-1 h-8">
                    <span className="text-xs">
                      {row.isConverted && row.convertedData?.after_bt_from && row.convertedData?.after_bt_to
                        ? `${row.convertedData.after_bt_from} → ${row.convertedData.after_bt_to}`
                        : row.afterBT}
                    </span>
                  </TableCell>
                  <TableCell className="py-1 h-8">
                    <span className="text-xs">
                      {row.isConverted && row.convertedData?.converted_destination
                        ? row.convertedData.converted_destination
                        : row.destination}
                    </span>
                  </TableCell>
                  <TableCell className="py-1 h-8">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div 
                          className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs">
                            {(() => {
                              // Calculate current total based on local state
                              const currentTotal = calculateSelectedTotal(row.id || '', row.totalRouteAndSum?.rates || [], row)
                              return `${row.totalRouteAndSum?.route || 'Route'}, €${currentTotal.toFixed(2)}`
                            })()}
                          </span>
                          <ChevronDown className="h-3 w-3 text-gray-500" />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="center" side="bottom" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          {row.totalRouteAndSum?.rates && row.totalRouteAndSum.rates.length > 0 ? (
                            <div className="space-y-1">
                              {row.totalRouteAndSum.rates.map((rate: any, rateIndex: number) => (
                                <div key={rateIndex} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`rate-${row.id}-${rate.id}`}
                                      checked={row.id ? (
                                        selectedRates[row.id]?.includes(rate.id) || false
                                      ) : false}
                                      onCheckedChange={(checked) => 
                                        row.id && handleRateSelection(row.id, rate.id, checked as boolean)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-xs">
                                      {rate.origin} → {rate.destination}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium">
                                    €{rate.sector_rate.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              <div className="border-t pt-1 mt-2 p-2">
                                <div className="flex justify-between items-center font-semibold">
                                  <span className="text-sm">Selected Total:</span>
                                  <span className="text-sm text-blue-600">
                                    €{row.id ? calculateSelectedTotal(row.id, row.totalRouteAndSum.rates, row).toFixed(2) : '0.00'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                  <span>All Rates Total:</span>
                                  <span>€{row.totalRouteAndSum.totalSum.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              No sector rates found for this route
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>

        {/* Convert Modal */}
        <ConvertModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          origin={selectedOrigin}
          recordId={selectedFlightData?.id}
          originalFlightData={selectedFlightData}
          onDataSaved={() => {
            loadFlightData() // Refresh data when saved
            setShowConvertModal(false)
          }}
        />
    </div>
  )
}
