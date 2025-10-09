"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface ConvertModalProps {
  isOpen: boolean
  onClose: () => void
  origin: string
  recordId?: string
  onDataSaved?: () => void
  originalFlightData?: {
    id?: string
    origin: string
    destination: string
    inbound: string
    outbound: string
    converted_origin?: string
  }
}

export function ConvertModal({ isOpen, onClose, origin, recordId, onDataSaved, originalFlightData }: ConvertModalProps) {
  const [formData, setFormData] = useState({
    origin: origin,
    beforeBTFrom: "",
    beforeBTTo: "",
    inbound: "",
    outbound: "",
    afterBTFrom: "",
    afterBTTo: "",
    destination: "",
    sectorRates: ""
  })
  const [selectedSectorRates, setSelectedSectorRates] = useState<string[]>([])

  const [airportCodes, setAirportCodes] = useState<any[]>([])
  const [flights, setFlights] = useState<any[]>([])
  const [sectorRates, setSectorRates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [openSelects, setOpenSelects] = useState({
    origin: false,
    beforeBTFrom: false,
    beforeBTTo: false,
    inbound: false,
    outbound: false,
    afterBTFrom: false,
    afterBTTo: false,
    destination: false,
    sectorRates: false
  })
  const [searchTerms, setSearchTerms] = useState({
    origin: "",
    beforeBTFrom: "",
    beforeBTTo: "",
    inbound: "",
    outbound: "",
    afterBTFrom: "",
    afterBTTo: "",
    destination: "",
    sectorRates: ""
  })

  // Extract airport code from origin/destination (3rd to 5th characters)
  const extractAirportCode = (code: string): string => {
    if (code.length >= 5) {
      return code.substring(2, 5).toUpperCase()
    }
    return code.toUpperCase()
  }

  // Extract origin from inbound flight string (e.g., "BT344, DUS → RIX" -> "DUS")
  const extractOriginFromInbound = (inboundString: string): string => {
    if (!inboundString) return ""
    const match = inboundString.match(/, ([A-Z]{3}) →/)
    return match ? match[1] : ""
  }

  // Extract destination from inbound flight string (e.g., "BT344, DUS → RIX" -> "RIX")
  const extractDestinationFromInbound = (inboundString: string): string => {
    if (!inboundString) return ""
    const match = inboundString.match(/→ ([A-Z]{3})/)
    return match ? match[1] : ""
  }

  // Extract destination from outbound flight string (e.g., "BT644, LGX → VNO" -> "VNO")
  const extractDestinationFromOutbound = (outboundString: string): string => {
    if (!outboundString) return ""
    const match = outboundString.match(/→ ([A-Z]{3})/)
    return match ? match[1] : ""
  }

  // Extract origin from outbound flight string (e.g., "BT644, LGX → VNO" -> "LGX")
  const extractOriginFromOutbound = (outboundString: string): string => {
    if (!outboundString) return ""
    const match = outboundString.match(/, ([A-Z]{3}) →/)
    return match ? match[1] : ""
  }

  // Extract flight number from flight string (e.g., "BT344, DXB → LAX" -> "BT344")
  const extractFlightNumber = (flightString: string): string => {
    if (!flightString) return ""
    const match = flightString.match(/^([A-Z0-9]+),/)
    return match ? match[1] : ""
  }

  // Check if Before BT should be disabled
  const isBeforeBTDisabled = () => {
    if (!formData.origin || !formData.inbound) return false
    const inboundOrigin = extractOriginFromInbound(formData.inbound)
    return formData.origin === inboundOrigin
  }

  // Check if After BT should be disabled
  const isAfterBTDisabled = () => {
    if (!formData.destination || !formData.outbound) return false
    const outboundDestination = extractDestinationFromOutbound(formData.outbound)
    return formData.destination === outboundDestination
  }

  // Get inbound destination for filtering outbound flights
  const getInboundDestination = () => {
    if (!formData.inbound) return null
    return extractDestinationFromInbound(formData.inbound)
  }

  // Get outbound origin for filtering inbound flights
  const getOutboundOrigin = () => {
    if (!formData.outbound) return null
    return extractOriginFromOutbound(formData.outbound)
  }

  // Extract route from connection string (e.g., "FRA -> DXB" -> "FRA → DXB")
  const extractRouteFromConnection = (connectionString: string): string | null => {
    if (!connectionString || connectionString === "-" || connectionString === "") return null
    
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

  // Extract route from flight string (e.g., "BT344, DXB → LAX" -> "DXB → LAX")
  const extractRouteFromFlight = (flightString: string): string | null => {
    if (!flightString || flightString === "-" || flightString === "") return null
    
    // Try to match format with comma and arrow (e.g., "BT344, DXB → LAX")
    const match = flightString.match(/, ([A-Z]{3}) → ([A-Z]{3})/)
    if (match) {
      return `${match[1]} → ${match[2]}`
    }
    
    return null
  }

  // Find matching sector rates for a route
  const findSectorRatesForRoute = (route: string) => {
    if (!route) return []
    
    const routeMatch = route.match(/([A-Z]{3}) → ([A-Z]{3})/)
    if (!routeMatch) return []
    
    const [, origin, destination] = routeMatch
    
    return sectorRates.filter(rate => 
      rate.origin === origin && rate.destination === destination
    )
  }

  // Handle sector rate selection/deselection
  const handleSectorRateToggle = (rateValue: string) => {
    setSelectedSectorRates(prev => {
      if (prev.includes(rateValue)) {
        // Remove if already selected
        const newSelection = prev.filter(rate => rate !== rateValue)
        setFormData(prevForm => ({
          ...prevForm,
          sectorRates: newSelection.join(", ")
        }))
        return newSelection
      } else {
        // Add if not selected
        const newSelection = [...prev, rateValue]
        setFormData(prevForm => ({
          ...prevForm,
          sectorRates: newSelection.join(", ")
        }))
        return newSelection
      }
    })
  }

  // Clear selected sector rates when available rates change
  const clearInvalidSectorRates = () => {
    const availableRates = getAvailableSectorRates()
    const availableRateValues = availableRates.map((rate: any) => 
      `${rate.origin} → ${rate.destination}, €${rate.sector_rate.toFixed(2)}`
    )
    
    const validSelections = selectedSectorRates.filter(rate => 
      availableRateValues.includes(rate)
    )
    
    if (validSelections.length !== selectedSectorRates.length) {
      setSelectedSectorRates(validSelections)
      setFormData(prev => ({
        ...prev,
        sectorRates: validSelections.join(", ")
      }))
    }
  }

  // Get all available sector rates from routes in before BT, inbound, outbound, after BT
  const getAvailableSectorRates = () => {
    const allRates: any[] = []
    
    // Extract routes from each column
    let beforeBTRoute = extractRouteFromConnection(`${formData.beforeBTFrom} → ${formData.beforeBTTo}`)
    
    // If beforeBTTo is empty, try to get destination from inbound or outbound
    if (formData.beforeBTFrom && !formData.beforeBTTo) {
      if (formData.inbound) {
        const inboundOrigin = extractOriginFromInbound(formData.inbound)
        if (inboundOrigin) {
          beforeBTRoute = `${formData.beforeBTFrom} → ${inboundOrigin}`
        }
      } else if (formData.outbound) {
        const outboundOrigin = extractOriginFromOutbound(formData.outbound)
        if (outboundOrigin) {
          beforeBTRoute = `${formData.beforeBTFrom} → ${outboundOrigin}`
        }
      }
    }
    
    const inboundRoute = extractRouteFromFlight(formData.inbound)
    const outboundRoute = extractRouteFromFlight(formData.outbound)
    
    // For after BT, use destination field if afterBTTo is empty
    let afterBTRoute = extractRouteFromConnection(`${formData.afterBTFrom} → ${formData.afterBTTo}`)
    if (formData.afterBTFrom && !formData.afterBTTo && formData.destination) {
      afterBTRoute = `${formData.afterBTFrom} → ${formData.destination}`
    } else if (formData.afterBTFrom && formData.afterBTTo) {
      // If both are filled, use the connection format
      afterBTRoute = `${formData.afterBTFrom} → ${formData.afterBTTo}`
    }
    
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
    
    // Remove duplicates and sort by rate (highest first)
    const uniqueRates = allRates.filter((rate, index, self) => 
      index === self.findIndex(r => r.id === rate.id)
    )
    
    const sortedRates = uniqueRates.sort((a, b) => b.sector_rate - a.sector_rate)
    
    return sortedRates
  }

  // Filter outbound flights based on inbound destination
  const getFilteredOutboundFlights = () => {
    const inboundDestination = getInboundDestination()
    if (!inboundDestination) return flights

    return flights.filter(flight => {
      const flightOrigin = extractAirportCode(flight.origin || '')
      return flightOrigin === inboundDestination
    })
  }

  // Filter inbound flights based on outbound origin
  const getFilteredInboundFlights = () => {
    const outboundOrigin = getOutboundOrigin()
    if (!outboundOrigin) return flights

    return flights.filter(flight => {
      const flightDestination = extractAirportCode(flight.destination || '')
      return flightDestination === outboundOrigin
    })
  }

  // Find matching flight option for a flight number
  const findMatchingFlightOption = (flightNumber: string) => {
    if (!flightNumber || !flights.length) return ""
    
    const flight = flights.find(flight => 
      flight.flight_number?.toLowerCase() === flightNumber.toLowerCase()
    )
    
    if (flight) {
      const flightOrigin = extractAirportCode(flight.origin || '')
      const flightDestination = extractAirportCode(flight.destination || '')
      return `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
    }
    
    return flightNumber // Return original if no match found
  }

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData()
      if (recordId && originalFlightData?.converted_origin) {
        // Edit mode - load existing converted data (record exists and has converted data)
        loadExistingConvertedData()
      } else if (originalFlightData) {
        // Convert mode - pre-populate from original flight data
        const origin = extractAirportCode(originalFlightData.origin)
        const destination = extractAirportCode(originalFlightData.destination)
        const inbound = findMatchingFlightOption(originalFlightData.inbound || "")
        const inboundOrigin = extractOriginFromInbound(inbound)
        const outbound = findMatchingFlightOption(originalFlightData.outbound || "")
        const outboundDestination = extractDestinationFromOutbound(outbound)
        
        setFormData(prev => ({
          ...prev,
          origin: origin,
          destination: destination,
          inbound: inbound,
          outbound: outbound,
          // Auto-set Before BT fields only if inbound exists
          beforeBTFrom: origin,
          beforeBTTo: inboundOrigin || "",
          // Auto-set After BT fields only if outbound exists
          afterBTFrom: outboundDestination || ""
        }))
      }
    } else {
      // Clear validation errors and selected rates when modal is closed
      setValidationErrors([])
      setSelectedSectorRates([])
    }
  }, [isOpen, recordId, originalFlightData])

  // Reset form data when originalFlightData changes
  useEffect(() => {
    if (originalFlightData && isOpen) {
      const origin = extractAirportCode(originalFlightData.origin)
      const destination = extractAirportCode(originalFlightData.destination)
      const inbound = findMatchingFlightOption(originalFlightData.inbound || "")
      const inboundOrigin = extractOriginFromInbound(inbound)
      const outbound = findMatchingFlightOption(originalFlightData.outbound || "")
      const outboundDestination = extractDestinationFromOutbound(outbound)
      
      setFormData(prev => ({
        ...prev,
        origin: origin,
        destination: destination,
        inbound: inbound,
        outbound: outbound,
        // Auto-set Before BT fields only if inbound exists
        beforeBTFrom: origin,
        beforeBTTo: inboundOrigin || "",
        // Auto-set After BT fields only if outbound exists
        afterBTFrom: outboundDestination || ""
      }))
    }
  }, [originalFlightData, isOpen, flights])

  // Clear validation errors when form data changes
  useEffect(() => {
    if (validationErrors.length > 0) {
      validateForm()
    }
  }, [formData])

  // Clear Before BT fields when they become disabled (only if inbound is selected and origin matches inbound origin)
  useEffect(() => {
    if (isBeforeBTDisabled()) {
      setFormData(prev => ({
        ...prev,
        beforeBTFrom: "",
        beforeBTTo: ""
      }))
      setOpenSelects(prev => ({
        ...prev,
        beforeBTFrom: false,
        beforeBTTo: false
      }))
    }
  }, [formData.origin, formData.inbound])

  // Clear After BT fields when they become disabled (only if outbound is selected and destination matches outbound destination)
  useEffect(() => {
    if (isAfterBTDisabled()) {
      setFormData(prev => ({
        ...prev,
        afterBTFrom: "",
        afterBTTo: ""
      }))
      setOpenSelects(prev => ({
        ...prev,
        afterBTFrom: false,
        afterBTTo: false
      }))
    }
  }, [formData.destination, formData.outbound])

  // Clear invalid sector rates when available rates change and re-insert valid ones
  useEffect(() => {
    if (selectedSectorRates.length > 0) {
      // Get current available rates
      const availableRates = getAvailableSectorRates()
      const availableRateValues = availableRates.map((rate: any) => 
        `${rate.origin} → ${rate.destination}, €${rate.sector_rate.toFixed(2)}`
      )
      
      // Filter to keep only valid selections
      const validSelections = selectedSectorRates.filter(rate => 
        availableRateValues.includes(rate)
      )
      
      // Update if there are changes
      if (validSelections.length !== selectedSectorRates.length) {
        setSelectedSectorRates(validSelections)
        setFormData(prev => ({
          ...prev,
          sectorRates: validSelections.join(", ")
        }))
      }
    }
  }, [formData.beforeBTFrom, formData.beforeBTTo, formData.inbound, formData.outbound, formData.afterBTFrom, formData.afterBTTo, formData.destination])

  // Handle loading existing sector rates when sector rates data is available
  useEffect(() => {
    if (sectorRates.length > 0 && selectedSectorRates.length > 0) {
      console.log('Sector rates loaded, checking existing selections:', selectedSectorRates)
      // The selected rates should already be set from loadExistingConvertedData
      // This effect ensures they're properly displayed when sector rates are loaded
    }
  }, [sectorRates, selectedSectorRates])

  // Load selected sector rates when modal opens and data is available
  useEffect(() => {
    if (isOpen && sectorRates.length > 0 && recordId && originalFlightData?.converted_origin) {
      // Re-load existing data when sector rates are available
      console.log('Re-loading existing data with sector rates available')
      loadExistingConvertedData()
    }
  }, [isOpen, sectorRates.length, recordId, originalFlightData?.converted_origin])



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setOpenSelects({
          origin: false,
          beforeBTFrom: false,
          beforeBTTo: false,
          inbound: false,
          outbound: false,
          afterBTFrom: false,
          afterBTTo: false,
          destination: false,
          sectorRates: false
        })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load airport codes
      const { data: airportData, error: airportError } = await supabase
        .from('airport_code')
        .select('*')
        .eq('is_active', true)

      if (airportError) {
        console.error('Error loading airport codes:', airportError)
        throw airportError
      }

      // Load flights
      const { data: flightData, error: flightError } = await supabase
        .from('flights')
        .select('*')
        .eq('is_active', true)

      if (flightError) {
        console.error('Error loading flights:', flightError)
        throw flightError
      }

      // Load sector rates
      const { data: sectorData, error: sectorError } = await supabase
        .from('sector_rates')
        .select('*')
        .eq('is_active', true)

      if (sectorError) {
        console.error('Error loading sector rates:', sectorError)
        throw sectorError
      }

      setAirportCodes(airportData || [])
      setFlights(flightData || [])
      setSectorRates(sectorData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      // You could add a toast notification or state to show error to user
      // For now, we'll just log the error
    } finally {
      setIsLoading(false)
    }
  }

  const loadExistingConvertedData = async () => {
    if (!recordId) return
    
    try {
      const { data, error } = await supabase
        .from('flight_uploads')
        .select('converted_origin, converted_destination, before_bt_from, before_bt_to, after_bt_from, after_bt_to, applied_rate, selected_sector_rate_ids, inbound, outbound')
        .eq('id', recordId)
        .single()

      if (error) {
        console.error('Error loading existing converted data:', error)
        return
      }

      if (data) {
        const convertedData = data as any
        // Convert flight numbers back to full format for display
        const inboundDisplay = convertedData.inbound ? findMatchingFlightOption(convertedData.inbound) : ""
        const outboundDisplay = convertedData.outbound ? findMatchingFlightOption(convertedData.outbound) : ""
        
        const sectorRatesValue = convertedData.applied_rate || ""
        const selectedRateIds = convertedData.selected_sector_rate_ids || []
        
        console.log('Loading existing data:', {
          applied_rate: sectorRatesValue,
          selected_sector_rate_ids: selectedRateIds
        })
        
        // Convert selected rate IDs to rate text format
        const selectedRateTexts: string[] = []
        if (selectedRateIds.length > 0 && sectorRates.length > 0) {
          selectedRateIds.forEach((rateId: string) => {
            const matchingRate = sectorRates.find(rate => rate.id === rateId)
            if (matchingRate) {
              const rateText = `${matchingRate.origin} → ${matchingRate.destination}, €${matchingRate.sector_rate.toFixed(2)}`
              selectedRateTexts.push(rateText)
            }
          })
        }
        
        // Fallback to applied_rate text if no IDs found
        const sectorRatesArray = selectedRateTexts.length > 0 ? selectedRateTexts : 
          (sectorRatesValue ? sectorRatesValue.split(", ").filter((rate: string) => rate.trim() !== "") : [])
        
        setFormData(prev => ({
          ...prev,
          origin: convertedData.converted_origin || prev.origin,
          destination: convertedData.converted_destination || prev.destination,
          beforeBTFrom: convertedData.before_bt_from || "",
          beforeBTTo: convertedData.before_bt_to || "",
          inbound: inboundDisplay,
          outbound: outboundDisplay,
          afterBTFrom: convertedData.after_bt_from || "",
          afterBTTo: convertedData.after_bt_to || "",
          sectorRates: selectedRateTexts.length > 0 ? selectedRateTexts.join(", ") : sectorRatesValue
        }))
        
        // Load selected sector rates from the database IDs or fallback to text
        console.log('Loading existing sector rates:', sectorRatesArray)
        setSelectedSectorRates(sectorRatesArray)
      }
    } catch (error) {
      console.error('Error loading existing converted data:', error)
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    
    // Origin and destination are required
    if (!formData.origin) {
      errors.push('Origin is required')
    }
    if (!formData.destination) {
      errors.push('Destination is required')
    }
    
    // Origin and destination cannot be the same
    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      errors.push('Origin and destination cannot be the same')
    }
    
    // Before BT from and to cannot be the same (only if both are filled)
    if (formData.beforeBTFrom && formData.beforeBTTo && formData.beforeBTFrom === formData.beforeBTTo) {
      errors.push('Before BT "from" and "to" cannot be the same')
    }
    
    // Inbound and outbound cannot be the same (only if both are filled)
    if (formData.inbound && formData.outbound && formData.inbound === formData.outbound) {
      errors.push('Inbound and outbound flights cannot be the same')
    }
    
    // After BT from and to cannot be the same (only if both are filled)
    if (formData.afterBTFrom && formData.afterBTTo && formData.afterBTFrom === formData.afterBTTo) {
      errors.push('After BT "from" and "to" cannot be the same')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleUpdate = async () => {
    if (!validateForm()) {
      return // Don't proceed if validation fails
    }
    
    if (!recordId) {
      console.error('No record ID provided for saving')
      return
    }
    
    setIsSaving(true)
    try {
      // Get selected sector rate IDs from the selected rates
      const selectedRateIds = selectedSectorRates.map(rateText => {
        // Extract rate ID from the rate text by finding matching sector rate
        const availableRates = getAvailableSectorRates()
        console.log('Available rates for ID mapping:', availableRates)
        console.log('Looking for rate text:', rateText)
        
        const matchingRate = availableRates.find(rate => {
          const rateValue = `${rate.origin} → ${rate.destination}, €${rate.sector_rate.toFixed(2)}`
          console.log('Comparing:', rateValue, 'with', rateText)
          return rateValue === rateText
        })
        
        console.log('Found matching rate:', matchingRate)
        return matchingRate?.id
      }).filter(id => id !== undefined)
      
      console.log('Selected rate IDs to save:', selectedRateIds)

      // Update the record in the database
      const updateData = {
        converted_origin: formData.origin,
        converted_destination: formData.destination,
        before_bt_from: formData.beforeBTFrom || null,
        before_bt_to: formData.beforeBTTo || null,
        inbound: formData.inbound ? extractFlightNumber(formData.inbound) : null,
        outbound: formData.outbound ? extractFlightNumber(formData.outbound) : null,
        after_bt_from: formData.afterBTFrom || null,
        after_bt_to: formData.afterBTTo || null,
        applied_rate: formData.sectorRates || null,
        selected_sector_rate_ids: selectedRateIds.length > 0 ? selectedRateIds : null,
        is_converted: true
      }
      
      console.log('Update data being sent to database:', updateData)
      
      const { error } = await (supabase as any)
        .from('flight_uploads')
        .update(updateData)
        .eq('id', recordId)
      
      if (error) {
        console.error('Error saving data:', error)
        throw error
      }
      
      console.log('Data saved successfully with selected sector rate IDs:', selectedRateIds)
      
      // Notify parent component that data was saved
      if (onDataSaved) {
        onDataSaved()
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving data:', error)
      // You could add a toast notification here
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm">
            {recordId && originalFlightData?.converted_origin ? 'Edit Converted Data' : 'Convert Raw Data Into Separate Routes'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2">
            <div className="text-xs text-red-600 font-medium mb-1">Please fix the following errors:</div>
            <ul className="text-xs text-red-600 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="space-y-2">
          {/* Origin */}
          <div className="relative dropdown-container">
            <label className="text-xs font-medium mb-1 block">Origin</label>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSelects.origin}
              className="w-full justify-between"
              onClick={() => setOpenSelects({
                origin: !openSelects.origin,
                beforeBTFrom: false,
                beforeBTTo: false,
                inbound: false,
                outbound: false,
                afterBTFrom: false,
                afterBTTo: false,
                destination: false,
                sectorRates: false
              })}
            >
              {formData.origin || "Select origin..."}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {openSelects.origin && (
              <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                <div className="p-2">
                  <Input
                    placeholder="Search origin..."
                    value={searchTerms.origin}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, origin: e.target.value }))}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {airportCodes
                      .filter(airport => 
                        airport.code !== formData.destination &&
                        airport.code.toLowerCase().includes(searchTerms.origin.toLowerCase())
                      )
                      .map((airport) => (
                        <div
                          key={airport.id}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                              setFormData(prev => {
                                const newData = { ...prev, origin: airport.code }
                                // If origin becomes same as destination, clear destination
                                if (airport.code === prev.destination) {
                                  newData.destination = ""
                                }
                                // Auto-set Before BT From to origin
                                newData.beforeBTFrom = airport.code
                                return newData
                              })
                            setOpenSelects(prev => ({ ...prev, origin: false }))
                            setSearchTerms(prev => ({ ...prev, origin: "" }))
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.origin === airport.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {airport.code}
                        </div>
                      ))}
                    {airportCodes.filter(airport => 
                      airport.code !== formData.destination &&
                      airport.code.toLowerCase().includes(searchTerms.origin.toLowerCase())
                    ).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No origin found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Before BT */}
          <div>
            <label className="text-xs font-medium mb-1 block">Before BT</label>
            <div className="flex items-center gap-1">
              <div className="relative dropdown-container flex-1">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSelects.beforeBTFrom}
                  className={`w-full justify-between ${isBeforeBTDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (isBeforeBTDisabled()) return
                    setOpenSelects({
                      origin: false,
                      beforeBTFrom: !openSelects.beforeBTFrom,
                      beforeBTTo: false,
                      inbound: false,
                      outbound: false,
                      afterBTFrom: false,
                      afterBTTo: false,
                      destination: false,
                      sectorRates: false
                    })
                  }}
                  disabled={isBeforeBTDisabled()}
                >
                  {formData.beforeBTFrom || "From"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {openSelects.beforeBTFrom && !isBeforeBTDisabled() && (
                  <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                    <div className="p-2">
                      <Input
                        placeholder="Search airport..."
                        value={searchTerms.beforeBTFrom}
                        onChange={(e) => setSearchTerms(prev => ({ ...prev, beforeBTFrom: e.target.value }))}
                        className="mb-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {airportCodes
                          .filter(airport => 
                            airport.code !== formData.beforeBTTo &&
                            airport.code.toLowerCase().includes(searchTerms.beforeBTFrom.toLowerCase())
                          )
                          .map((airport) => (
                            <div
                              key={airport.id}
                              className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => {
                                  const newData = { ...prev, beforeBTFrom: airport.code }
                                  // If from becomes same as to, clear to
                                  if (airport.code === prev.beforeBTTo) {
                                    newData.beforeBTTo = ""
                                  }
                                  return newData
                                })
                                setOpenSelects(prev => ({ ...prev, beforeBTFrom: false }))
                                setSearchTerms(prev => ({ ...prev, beforeBTFrom: "" }))
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.beforeBTFrom === airport.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {airport.code}
                            </div>
                          ))}
                        {airportCodes.filter(airport => 
                          airport.code !== formData.beforeBTTo &&
                          airport.code.toLowerCase().includes(searchTerms.beforeBTFrom.toLowerCase())
                        ).length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No airport found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">to</span>
              <div className="relative dropdown-container flex-1">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSelects.beforeBTTo}
                  className={`w-full justify-between ${isBeforeBTDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (isBeforeBTDisabled()) return
                    setOpenSelects({
                      origin: false,
                      beforeBTFrom: false,
                      beforeBTTo: !openSelects.beforeBTTo,
                      inbound: false,
                      outbound: false,
                      afterBTFrom: false,
                      afterBTTo: false,
                      destination: false,
                      sectorRates: false
                    })
                  }}
                  disabled={isBeforeBTDisabled()}
                >
                  {formData.beforeBTTo || "To"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {openSelects.beforeBTTo && !isBeforeBTDisabled() && (
                  <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                    <div className="p-2">
                      <Input
                        placeholder="Search airport..."
                        value={searchTerms.beforeBTTo}
                        onChange={(e) => setSearchTerms(prev => ({ ...prev, beforeBTTo: e.target.value }))}
                        className="mb-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {airportCodes
                          .filter(airport => 
                            airport.code !== formData.beforeBTFrom &&
                            airport.code.toLowerCase().includes(searchTerms.beforeBTTo.toLowerCase())
                          )
                          .map((airport) => (
                            <div
                              key={airport.id}
                              className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => {
                                  const newData = { ...prev, beforeBTTo: airport.code }
                                  // If to becomes same as from, clear from
                                  if (airport.code === prev.beforeBTFrom) {
                                    newData.beforeBTFrom = ""
                                  }
                                  return newData
                                })
                                setOpenSelects(prev => ({ ...prev, beforeBTTo: false }))
                                setSearchTerms(prev => ({ ...prev, beforeBTTo: "" }))
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.beforeBTTo === airport.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {airport.code}
                            </div>
                          ))}
                        {airportCodes.filter(airport => 
                          airport.code !== formData.beforeBTFrom &&
                          airport.code.toLowerCase().includes(searchTerms.beforeBTTo.toLowerCase())
                        ).length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No airport found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inbound */}
          <div className="relative dropdown-container">
            <label className="text-xs font-medium mb-1 block">Inbound</label>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSelects.inbound}
              className="w-full justify-between"
              onClick={() => setOpenSelects({
                origin: false,
                beforeBTFrom: false,
                beforeBTTo: false,
                inbound: !openSelects.inbound,
                outbound: false,
                afterBTFrom: false,
                afterBTTo: false,
                destination: false,
                sectorRates: false
              })}
            >
              {formData.inbound || "Select inbound flight"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {openSelects.inbound && (
              <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                <div className="p-2">
                  <Input
                    placeholder="Search inbound flight..."
                    value={searchTerms.inbound}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, inbound: e.target.value }))}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {getFilteredInboundFlights()
                      .filter(flight => {
                        const flightOrigin = extractAirportCode(flight.origin || '')
                        const flightDestination = extractAirportCode(flight.destination || '')
                        const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                        return flightValue !== formData.outbound &&
                               flightValue.toLowerCase().includes(searchTerms.inbound.toLowerCase())
                      })
                      .map((flight) => {
                        const flightOrigin = extractAirportCode(flight.origin || '')
                        const flightDestination = extractAirportCode(flight.destination || '')
                        const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                        return (
                          <div
                            key={flight.id}
                            className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData(prev => {
                                const newData = { ...prev, inbound: flightValue }
                                // If inbound becomes same as outbound, clear outbound
                                if (flightValue === prev.outbound) {
                                  newData.outbound = ""
                                }
                                // Auto-set Before BT To to inbound origin
                                const inboundOrigin = extractOriginFromInbound(flightValue)
                                if (inboundOrigin) {
                                  newData.beforeBTTo = inboundOrigin
                                }
                                return newData
                              })
                              setOpenSelects(prev => ({ ...prev, inbound: false }))
                              setSearchTerms(prev => ({ ...prev, inbound: "" }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.inbound === flightValue ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {flightValue}
                          </div>
                        )
                      })}
                    {getFilteredInboundFlights().filter(flight => {
                      const flightOrigin = extractAirportCode(flight.origin || '')
                      const flightDestination = extractAirportCode(flight.destination || '')
                      const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                      return flightValue !== formData.outbound &&
                             flightValue.toLowerCase().includes(searchTerms.inbound.toLowerCase())
                    }).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No inbound flight found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Outbound */}
          <div className="relative dropdown-container">
            <label className="text-xs font-medium mb-1 block">Outbound</label>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSelects.outbound}
              className="w-full justify-between"
              onClick={() => setOpenSelects({
                origin: false,
                beforeBTFrom: false,
                beforeBTTo: false,
                inbound: false,
                outbound: !openSelects.outbound,
                afterBTFrom: false,
                afterBTTo: false,
                destination: false,
                sectorRates: false
              })}
            >
              {formData.outbound || "Select outbound flight"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {openSelects.outbound && (
              <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                <div className="p-2">
                  <Input
                    placeholder="Search outbound flight..."
                    value={searchTerms.outbound}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, outbound: e.target.value }))}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {getFilteredOutboundFlights()
                      .filter(flight => {
                        const flightOrigin = extractAirportCode(flight.origin || '')
                        const flightDestination = extractAirportCode(flight.destination || '')
                        const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                        return flightValue !== formData.inbound &&
                               flightValue.toLowerCase().includes(searchTerms.outbound.toLowerCase())
                      })
                      .map((flight) => {
                        const flightOrigin = extractAirportCode(flight.origin || '')
                        const flightDestination = extractAirportCode(flight.destination || '')
                        const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                        return (
                          <div
                            key={flight.id}
                            className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData(prev => {
                                const newData = { ...prev, outbound: flightValue }
                                // If outbound becomes same as inbound, clear inbound
                                if (flightValue === prev.inbound) {
                                  newData.inbound = ""
                                }
                                // Auto-set After BT From to outbound destination
                                const outboundDestination = extractDestinationFromOutbound(flightValue)
                                if (outboundDestination) {
                                  newData.afterBTFrom = outboundDestination
                                }
                                return newData
                              })
                              setOpenSelects(prev => ({ ...prev, outbound: false }))
                              setSearchTerms(prev => ({ ...prev, outbound: "" }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.outbound === flightValue ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {flightValue}
                          </div>
                        )
                      })}
                    {getFilteredOutboundFlights().filter(flight => {
                      const flightOrigin = extractAirportCode(flight.origin || '')
                      const flightDestination = extractAirportCode(flight.destination || '')
                      const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                      return flightValue !== formData.inbound &&
                             flightValue.toLowerCase().includes(searchTerms.outbound.toLowerCase())
                    }).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No outbound flight found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* After BT */}
          <div>
            <label className="text-xs font-medium mb-1 block">After BT</label>
            <div className="flex items-center gap-1">
              <div className="relative dropdown-container flex-1">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSelects.afterBTFrom}
                  className={`w-full justify-between ${isAfterBTDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (isAfterBTDisabled()) return
                    setOpenSelects({
                      origin: false,
                      beforeBTFrom: false,
                      beforeBTTo: false,
                      inbound: false,
                      outbound: false,
                      afterBTFrom: !openSelects.afterBTFrom,
                      afterBTTo: false,
                      destination: false,
                      sectorRates: false
                    })
                  }}
                  disabled={isAfterBTDisabled()}
                >
                  {formData.afterBTFrom || "From"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {openSelects.afterBTFrom && !isAfterBTDisabled() && (
                  <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                    <div className="p-2">
                      <Input
                        placeholder="Search airport..."
                        value={searchTerms.afterBTFrom}
                        onChange={(e) => setSearchTerms(prev => ({ ...prev, afterBTFrom: e.target.value }))}
                        className="mb-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {airportCodes
                          .filter(airport => 
                            airport.code !== formData.afterBTTo &&
                            airport.code.toLowerCase().includes(searchTerms.afterBTFrom.toLowerCase())
                          )
                          .map((airport) => (
                            <div
                              key={airport.id}
                              className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => {
                                  const newData = { ...prev, afterBTFrom: airport.code }
                                  // If from becomes same as to, clear to
                                  if (airport.code === prev.afterBTTo) {
                                    newData.afterBTTo = ""
                                  }
                                  return newData
                                })
                                setOpenSelects(prev => ({ ...prev, afterBTFrom: false }))
                                setSearchTerms(prev => ({ ...prev, afterBTFrom: "" }))
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.afterBTFrom === airport.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {airport.code}
                            </div>
                          ))}
                        {airportCodes.filter(airport => 
                          airport.code !== formData.afterBTTo &&
                          airport.code.toLowerCase().includes(searchTerms.afterBTFrom.toLowerCase())
                        ).length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No airport found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">to</span>
              <div className="relative dropdown-container flex-1">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSelects.afterBTTo}
                  className={`w-full justify-between ${isAfterBTDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (isAfterBTDisabled()) return
                    setOpenSelects({
                      origin: false,
                      beforeBTFrom: false,
                      beforeBTTo: false,
                      inbound: false,
                      outbound: false,
                      afterBTFrom: false,
                      afterBTTo: !openSelects.afterBTTo,
                      destination: false,
                      sectorRates: false
                    })
                  }}
                  disabled={isAfterBTDisabled()}
                >
                  {formData.afterBTTo || "To"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {openSelects.afterBTTo && !isAfterBTDisabled() && (
                  <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                    <div className="p-2">
                      <Input
                        placeholder="Search airport..."
                        value={searchTerms.afterBTTo}
                        onChange={(e) => setSearchTerms(prev => ({ ...prev, afterBTTo: e.target.value }))}
                        className="mb-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {airportCodes
                          .filter(airport => 
                            airport.code !== formData.afterBTFrom &&
                            airport.code.toLowerCase().includes(searchTerms.afterBTTo.toLowerCase())
                          )
                          .map((airport) => (
                            <div
                              key={airport.id}
                              className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData(prev => {
                                  const newData = { ...prev, afterBTTo: airport.code }
                                  // If to becomes same as from, clear from
                                  if (airport.code === prev.afterBTFrom) {
                                    newData.afterBTFrom = ""
                                  }
                                  return newData
                                })
                                setOpenSelects(prev => ({ ...prev, afterBTTo: false }))
                                setSearchTerms(prev => ({ ...prev, afterBTTo: "" }))
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.afterBTTo === airport.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {airport.code}
                            </div>
                          ))}
                        {airportCodes.filter(airport => 
                          airport.code !== formData.afterBTFrom &&
                          airport.code.toLowerCase().includes(searchTerms.afterBTTo.toLowerCase())
                        ).length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No airport found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="relative dropdown-container">
            <label className="text-xs font-medium mb-1 block">Destination</label>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSelects.destination}
              className="w-full justify-between"
              onClick={() => setOpenSelects({
                origin: false,
                beforeBTFrom: false,
                beforeBTTo: false,
                inbound: false,
                outbound: false,
                afterBTFrom: false,
                afterBTTo: false,
                destination: !openSelects.destination,
                sectorRates: false
              })}
            >
              {formData.destination || "Select destination"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {openSelects.destination && (
              <div className="absolute bottom-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mb-1">
                <div className="p-2">
                  <Input
                    placeholder="Search destination..."
                    value={searchTerms.destination}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, destination: e.target.value }))}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {airportCodes
                      .filter(airport => 
                        airport.code !== formData.origin &&
                        airport.code.toLowerCase().includes(searchTerms.destination.toLowerCase())
                      )
                      .map((airport) => (
                        <div
                          key={airport.id}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData(prev => {
                                const newData = { ...prev, destination: airport.code }
                                // If destination becomes same as origin, clear origin
                                if (airport.code === prev.origin) {
                                  newData.origin = ""
                                }
                                // Auto-update After BT To to new destination
                                if (prev.afterBTFrom) {
                                  newData.afterBTTo = airport.code
                                }
                                return newData
                              })
                              setOpenSelects(prev => ({ ...prev, destination: false }))
                              setSearchTerms(prev => ({ ...prev, destination: "" }))
                            }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.destination === airport.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {airport.code}
                        </div>
                      ))}
                    {airportCodes.filter(airport => 
                      airport.code !== formData.origin &&
                      airport.code.toLowerCase().includes(searchTerms.destination.toLowerCase())
                    ).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No destination found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sector Rates */}
          <div className="relative dropdown-container">
            <label className="text-xs font-medium mb-1 block">Sector Rates</label>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSelects.sectorRates}
              className="w-full justify-between"
              onClick={() => setOpenSelects({
                origin: false,
                beforeBTFrom: false,
                beforeBTTo: false,
                inbound: false,
                outbound: false,
                afterBTFrom: false,
                afterBTTo: false,
                destination: false,
                sectorRates: !openSelects.sectorRates
              })}
            >
              {selectedSectorRates.length > 0 
                ? `${selectedSectorRates.length} rate${selectedSectorRates.length > 1 ? 's' : ''} selected`
                : "Select sector rates"
              }
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {openSelects.sectorRates && (
              <div className="absolute bottom-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mb-1">
                <div className="p-2">
                  <Input
                    placeholder="Search sector rates..."
                    value={searchTerms.sectorRates}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, sectorRates: e.target.value }))}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {getAvailableSectorRates()
                      .filter(rate => {
                        const rateValue = `${rate.origin} → ${rate.destination}, €${rate.sector_rate.toFixed(2)}`
                        return rateValue.toLowerCase().includes(searchTerms.sectorRates.toLowerCase())
                      })
                      .map((rate) => {
                        const rateValue = `${rate.origin} → ${rate.destination}, €${rate.sector_rate.toFixed(2)}`
                        const isSelected = selectedSectorRates.includes(rateValue)
                        return (
                          <div
                            key={rate.id}
                            className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSectorRateToggle(rateValue)
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSectorRateToggle(rateValue)}
                              className="mr-2"
                            />
                            <span className="text-sm">{rateValue}</span>
                          </div>
                        )
                      })}
                    {getAvailableSectorRates().filter(rate => {
                      const rateValue = `${rate.origin} → ${rate.destination}, €${rate.sector_rate.toFixed(2)}`
                      return rateValue.toLowerCase().includes(searchTerms.sectorRates.toLowerCase())
                    }).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {getAvailableSectorRates().length === 0 
                          ? "No sector rates found for selected routes" 
                          : "No sector rates found matching search"
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-1 pt-2">
          <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            size="sm"
            className="h-7 text-xs px-3 bg-yellow-500 hover:bg-yellow-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleUpdate}
            disabled={validationErrors.length > 0 || isSaving}
          >
            {isSaving ? 'Saving...' : (recordId && originalFlightData?.converted_origin ? 'Update Record' : 'Convert Record')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
