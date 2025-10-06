"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlightUploadData {
  id?: string
  origin: string
  destination: string
  inbound: string
  outbound: string
  created_at?: string
  updated_at?: string
}

interface GeneratedData {
  origin: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  destination: string
  appliedRate: string
  availableSectorRates: any[]
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
  const [openRateSelects, setOpenRateSelects] = useState<Record<string, boolean>>({})
  const [selectedRates, setSelectedRates] = useState<Record<string, any>>({})
  const { toast } = useToast()

  const processingSteps = [
    "Validating flight data...",
    "Checking airport codes...",
    "Calculating sector rates...",
    "Applying rate multipliers...",
    "Generating final prices...",
    "Completing assignment..."
  ]

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
    if (!route || route === "n/a") return []
    
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

  // Get all available routes and their matching sector rates
  const getAvailableSectorRates = (beforeBT: string, inbound: string, outbound: string, afterBT: string) => {
    const allSectorRates: any[] = []
    
    // Extract routes from each column
    const routes = []
    
    // 1. before BT - extract route (e.g., "FRA -> DUS")
    if (beforeBT && beforeBT !== "n/a") {
      const beforeRoute = beforeBT.match(/([A-Z]{3})\s*->\s*([A-Z]{3})/)
      if (beforeRoute) {
        routes.push(`${beforeRoute[1]} -> ${beforeRoute[2]}`)
      }
    }
    
    // 2. inbound - extract route from flight info (e.g., "BT234, DUS → RIX" -> "DUS -> RIX")
    if (inbound && inbound !== "n/a") {
      const inboundRoute = inbound.match(/([A-Z]{3})\s*→\s*([A-Z]{3})/)
      if (inboundRoute) {
        routes.push(`${inboundRoute[1]} -> ${inboundRoute[2]}`)
      }
    }
    
    // 3. outbound - extract route from flight info (e.g., "BT633, RIX → LGW" -> "RIX -> LGW")
    if (outbound && outbound !== "n/a") {
      const outboundRoute = outbound.match(/([A-Z]{3})\s*→\s*([A-Z]{3})/)
      if (outboundRoute) {
        routes.push(`${outboundRoute[1]} -> ${outboundRoute[2]}`)
      }
    }
    
    // 4. after BT - extract route (e.g., "ROM -> LGW")
    if (afterBT && afterBT !== "n/a") {
      const afterRoute = afterBT.match(/([A-Z]{3})\s*->\s*([A-Z]{3})/)
      if (afterRoute) {
        routes.push(`${afterRoute[1]} -> ${afterRoute[2]}`)
      }
    }
    
    // Find matching sector rates for each route
    routes.forEach(route => {
      const matchingRates = findMatchingSectorRates(route)
      allSectorRates.push(...matchingRates)
    })
    
    return allSectorRates
  }

  // Load flight data from database
  const loadFlightData = async () => {
    setIsLoading(true)
    try {
      // Load flight uploads
      const { data: uploadData, error: uploadError } = await supabase
        .from('flight_uploads')
        .select('*')
        .order('created_at', { ascending: false })

      if (uploadError) throw uploadError

      // Load flights data
      const { data: flightsDbData, error: flightsError } = await supabase
        .from('flights')
        .select('*')
        .eq('is_active', true)

      if (flightsError) throw flightsError

      // Load sector rates data
      const { data: sectorRatesDbData, error: sectorRatesError } = await supabase
        .from('sector_rates')
        .select('*')
        .eq('is_active', true)

      if (sectorRatesError) {
        console.error('Error loading sector rates:', sectorRatesError)
        throw sectorRatesError
      }

      setFlightData(uploadData || [])
      setFlightsData(flightsDbData || [])
      setSectorRatesData(sectorRatesDbData || [])
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
    if (refreshTrigger && refreshTrigger > 0) {
      loadFlightData()
    }
  }, [refreshTrigger])

  // Generate data from flight uploads
  const generateData = () => {
    const generated = flightData.map(flight => {
      const originCode = extractAirportCode(flight.origin)
      const destinationCode = extractAirportCode(flight.destination)
      
      // Build beforeBT - start with origin
      let beforeBT = originCode
      
      // Check inbound flight route - if origin doesn't match inbound flight's origin, add connection
      if (flight.inbound) {
        const inboundRoute = getFlightRoute(flight.inbound)
        if (inboundRoute) {
          if (inboundRoute.origin !== originCode) {
            beforeBT = `${originCode} -> ${inboundRoute.origin}`
          }
        } else {
          // Flight not found in flights table
          beforeBT = "n/a"
        }
      } else {
        // No inbound flight
        beforeBT = "n/a"
      }
      
      // Build afterBT - start with destination
      let afterBT = destinationCode
      
      // Check outbound flight route - if destination doesn't match outbound flight's destination, add connection
      if (flight.outbound) {
        const outboundRoute = getFlightRoute(flight.outbound)
        if (outboundRoute) {
          if (outboundRoute.destination !== destinationCode) {
            afterBT = `${destinationCode} -> ${outboundRoute.destination}`
          }
        } else {
          // Flight not found in flights table
          afterBT = "n/a"
        }
      } else {
        // No outbound flight
        afterBT = "n/a"
      }

      // Get available sector rates for all routes from the 4 columns
      const availableSectorRates = getAvailableSectorRates(
        beforeBT, 
        flight.inbound ? formatFlight(flight.inbound) : "n/a",
        flight.outbound ? formatFlight(flight.outbound) : "n/a", 
        afterBT
      )


      return {
        origin: originCode,
        beforeBT: beforeBT,
        inbound: flight.inbound ? formatFlight(flight.inbound) : "n/a",
        outbound: flight.outbound ? formatFlight(flight.outbound) : "n/a",
        afterBT: afterBT,
        destination: destinationCode,
        appliedRate: availableSectorRates.length > 0 
          ? availableSectorRates.map(rate => `${rate.origin} → ${rate.destination}, €${rate.sector_rate}`).join(' | ')
          : "n/a",
        availableSectorRates: availableSectorRates
      }
    })

    setGeneratedData(generated)
  }

  // Auto-generate data when flight data changes
  useEffect(() => {
    if (flightData.length > 0) {
      generateData()
    }
  }, [flightData, flightsData, sectorRatesData])

  // Auto-select first rate when data is generated
  useEffect(() => {
    if (generatedData.length > 0) {
      const newSelections: Record<string, any> = {}
      generatedData.forEach((record, index) => {
        const recordId = `record-${index}`
        if (record.availableSectorRates.length > 0 && !selectedRates[recordId]) {
          newSelections[recordId] = record.availableSectorRates[0]
        }
      })
      if (Object.keys(newSelections).length > 0) {
        setSelectedRates(prev => ({ ...prev, ...newSelections }))
      }
    }
  }, [generatedData])

  // Handle rate selection
  const handleRateSelection = (recordIndex: number, rate: any) => {
    const recordId = `record-${recordIndex}`
    setSelectedRates(prev => ({
      ...prev,
      [recordId]: rate
    }))
    setOpenRateSelects(prev => ({
      ...prev,
      [recordId]: false
    }))
  }

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
                  disabled={isProcessing || flightData.length === 0}
                >
                  {isProcessing ? "Processing..." : "Generate"}
                </Button>
              </div>
            </TooltipTrigger>
            {(isProcessing || flightData.length === 0) && (
              <TooltipContent>
                <p>This is disabled</p>
              </TooltipContent>
            )}
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
                  <TableHead className="text-xs py-1 min-w-[120px]">Applied Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="py-1 text-xs">{row.origin}</TableCell>
                  <TableCell className="py-1">
                    {row.beforeBT !== "n/a" ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1 py-0.5">
                        {row.beforeBT}
                      </Badge>
                    ) : ( 
                      <span className="text-xs">n/a</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1">
                    {row.inbound !== "n/a" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-1 py-0.5">
                        {row.inbound}
                      </Badge>
                    ) : (
                      <span className="text-xs">n/a</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1">
                    {row.outbound !== "n/a" ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-1 py-0.5">
                        {row.outbound}
                      </Badge>
                    ) : (
                      <span className="text-xs">n/a</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1">
                    {row.afterBT !== "n/a" ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-1 py-0.5">
                        {row.afterBT}
                      </Badge>
                    ) : (
                      <span className="text-xs">n/a</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-xs">{row.destination}</TableCell>
                  <TableCell className="py-1">
                    {row.availableSectorRates.length > 0 ? (
                      <Popover 
                        open={openRateSelects[`record-${index}`]} 
                        onOpenChange={(open) => setOpenRateSelects(prev => ({ ...prev, [`record-${index}`]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRateSelects[`record-${index}`]}
                            className="h-6 text-xs border-gray-200 justify-between font-normal w-full"
                          >
                            <span className="truncate">
                              {(() => {
                                const selectedRate = selectedRates[`record-${index}`]
                                if (selectedRate) {
                                  return `${selectedRate.origin} → ${selectedRate.destination}, €${selectedRate.sector_rate}`
                                }
                                // Fallback to first available rate
                                const firstRate = row.availableSectorRates[0]
                                if (firstRate) {
                                  return `${firstRate.origin} → ${firstRate.destination}, €${firstRate.sector_rate}`
                                }
                                return "No rates available"
                              })()}
                            </span>
                            <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-0" side="bottom" align="start">
                          <Command>
                            <CommandInput placeholder="Search sector rates..." className="h-6 text-xs" />
                            <CommandEmpty>No rates found.</CommandEmpty>
                            <CommandGroup className="max-h-48 overflow-auto">
                              {row.availableSectorRates.map((rate, rateIndex) => (
                                <CommandItem
                                  key={`${rate.origin}-${rate.destination}-${rateIndex}`}
                                  value={`${rate.origin} ${rate.destination} ${rate.sector_rate}`}
                                  onSelect={() => handleRateSelection(index, rate)}
                                  className="text-xs py-1"
                                >
                                  <Check
                                    className={cn(
                                      "mr-1 h-3 w-3",
                                      selectedRates[`record-${index}`]?.id === rate.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center justify-between min-w-0 flex-1 gap-1">
                                    <span className="font-medium text-xs truncate flex-1 min-w-0">
                                      {rate.origin} → {rate.destination}
                                    </span>
                                    <span className="text-gray-500 text-xs flex-shrink-0">
                                      €{rate.sector_rate}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs px-1 py-0.5">
                          n/a
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
    </div>
  )
}
