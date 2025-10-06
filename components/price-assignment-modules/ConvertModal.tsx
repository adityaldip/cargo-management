"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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

  const [airportCodes, setAirportCodes] = useState<any[]>([])
  const [flights, setFlights] = useState<any[]>([])
  const [sectorRates, setSectorRates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Extract airport code from origin/destination (3rd to 5th characters)
  const extractAirportCode = (code: string): string => {
    if (code.length >= 5) {
      return code.substring(2, 5).toUpperCase()
    }
    return code.toUpperCase()
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
        setFormData(prev => ({
          ...prev,
          origin: extractAirportCode(originalFlightData.origin),
          destination: extractAirportCode(originalFlightData.destination),
          inbound: findMatchingFlightOption(originalFlightData.inbound || ""),
          outbound: findMatchingFlightOption(originalFlightData.outbound || "")
        }))
      }
    } else {
      // Clear validation errors when modal is closed
      setValidationErrors([])
    }
  }, [isOpen, recordId, originalFlightData])

  // Reset form data when originalFlightData changes
  useEffect(() => {
    if (originalFlightData && isOpen) {
      setFormData(prev => ({
        ...prev,
        origin: extractAirportCode(originalFlightData.origin),
        destination: extractAirportCode(originalFlightData.destination),
        inbound: findMatchingFlightOption(originalFlightData.inbound || ""),
        outbound: findMatchingFlightOption(originalFlightData.outbound || "")
      }))
    }
  }, [originalFlightData, isOpen, flights])

  // Clear validation errors when form data changes
  useEffect(() => {
    if (validationErrors.length > 0) {
      validateForm()
    }
  }, [formData])

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
        .select('converted_origin, converted_destination, before_bt_from, before_bt_to, after_bt_from, after_bt_to, applied_rate, inbound, outbound')
        .eq('id', recordId)
        .single()

      if (error) {
        console.error('Error loading existing converted data:', error)
        return
      }

      if (data) {
        const convertedData = data as any
        setFormData(prev => ({
          ...prev,
          origin: convertedData.converted_origin || prev.origin,
          destination: convertedData.converted_destination || prev.destination,
          beforeBTFrom: convertedData.before_bt_from || "",
          beforeBTTo: convertedData.before_bt_to || "",
          inbound: convertedData.inbound || "",
          outbound: convertedData.outbound || "",
          afterBTFrom: convertedData.after_bt_from || "",
          afterBTTo: convertedData.after_bt_to || "",
          sectorRates: convertedData.applied_rate || ""
        }))
      }
    } catch (error) {
      console.error('Error loading existing converted data:', error)
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    
    // Origin and destination cannot be the same
    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      errors.push('Origin and destination cannot be the same')
    }
    
    // Before BT from and to cannot be the same
    if (formData.beforeBTFrom && formData.beforeBTTo && formData.beforeBTFrom === formData.beforeBTTo) {
      errors.push('Before BT "from" and "to" cannot be the same')
    }
    
    // Inbound and outbound cannot be the same
    if (formData.inbound && formData.outbound && formData.inbound === formData.outbound) {
      errors.push('Inbound and outbound flights cannot be the same')
    }
    
    // After BT from and to cannot be the same
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
      // Update the record in the database
      const updateData = {
        converted_origin: formData.origin,
        converted_destination: formData.destination,
        before_bt_from: formData.beforeBTFrom,
        before_bt_to: formData.beforeBTTo,
        inbound: formData.inbound,
        outbound: formData.outbound,
        after_bt_from: formData.afterBTFrom,
        after_bt_to: formData.afterBTTo,
          applied_rate: formData.sectorRates,
        is_converted: true
      }
      
      const { error } = await (supabase as any)
        .from('flight_uploads')
        .update(updateData)
        .eq('id', recordId)
      
      if (error) {
        console.error('Error saving data:', error)
        throw error
      }
      
      console.log('Data saved successfully')
      
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
          <div>
            <label className="text-xs font-medium mb-1 block">Origin</label>
            <Select value={formData.origin} onValueChange={(value) => {
              setFormData(prev => {
                const newData = { ...prev, origin: value }
                // If origin becomes same as destination, clear destination
                if (value === prev.destination) {
                  newData.destination = ""
                }
                return newData
              })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {airportCodes
                  .filter(airport => airport.code !== formData.destination)
                  .map((airport) => (
                    <SelectItem key={airport.id} value={airport.code}>
                      {airport.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Before BT */}
          <div>
            <label className="text-xs font-medium mb-1 block">Before BT</label>
            <div className="flex items-center gap-1">
              <Select value={formData.beforeBTFrom} onValueChange={(value) => {
                setFormData(prev => {
                  const newData = { ...prev, beforeBTFrom: value }
                  // If from becomes same as to, clear to
                  if (value === prev.beforeBTTo) {
                    newData.beforeBTTo = ""
                  }
                  return newData
                })
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {airportCodes
                    .filter(airport => airport.code !== formData.beforeBTTo)
                    .map((airport) => (
                      <SelectItem key={airport.id} value={airport.code}>
                        {airport.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">to</span>
              <Select value={formData.beforeBTTo} onValueChange={(value) => {
                setFormData(prev => {
                  const newData = { ...prev, beforeBTTo: value }
                  // If to becomes same as from, clear from
                  if (value === prev.beforeBTFrom) {
                    newData.beforeBTFrom = ""
                  }
                  return newData
                })
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {airportCodes
                    .filter(airport => airport.code !== formData.beforeBTFrom)
                    .map((airport) => (
                      <SelectItem key={airport.id} value={airport.code}>
                        {airport.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inbound */}
          <div>
            <label className="text-xs font-medium mb-1 block">Inbound</label>
            <Select value={formData.inbound} onValueChange={(value) => {
              setFormData(prev => {
                const newData = { ...prev, inbound: value }
                // If inbound becomes same as outbound, clear outbound
                if (value === prev.outbound) {
                  newData.outbound = ""
                }
                return newData
              })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select inbound flight" />
              </SelectTrigger>
              <SelectContent>
                {flights
                  .filter(flight => {
                    const flightOrigin = extractAirportCode(flight.origin || '')
                    const flightDestination = extractAirportCode(flight.destination || '')
                    const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                    return flightValue !== formData.outbound
                  })
                  .map((flight) => {
                    const flightOrigin = extractAirportCode(flight.origin || '')
                    const flightDestination = extractAirportCode(flight.destination || '')
                    const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                    return (
                      <SelectItem key={flight.id} value={flightValue}>
                        {flightValue}
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Outbound */}
          <div>
            <label className="text-xs font-medium mb-1 block">Outbound</label>
            <Select value={formData.outbound} onValueChange={(value) => {
              setFormData(prev => {
                const newData = { ...prev, outbound: value }
                // If outbound becomes same as inbound, clear inbound
                if (value === prev.inbound) {
                  newData.inbound = ""
                }
                return newData
              })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select outbound flight" />
              </SelectTrigger>
              <SelectContent>
                {flights
                  .filter(flight => {
                    const flightOrigin = extractAirportCode(flight.origin || '')
                    const flightDestination = extractAirportCode(flight.destination || '')
                    const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                    return flightValue !== formData.inbound
                  })
                  .map((flight) => {
                    const flightOrigin = extractAirportCode(flight.origin || '')
                    const flightDestination = extractAirportCode(flight.destination || '')
                    const flightValue = `${flight.flight_number}, ${flightOrigin} → ${flightDestination}`
                    return (
                      <SelectItem key={flight.id} value={flightValue}>
                        {flightValue}
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* After BT */}
          <div>
            <label className="text-xs font-medium mb-1 block">After BT</label>
            <div className="flex items-center gap-1">
              <Select value={formData.afterBTFrom} onValueChange={(value) => {
                setFormData(prev => {
                  const newData = { ...prev, afterBTFrom: value }
                  // If from becomes same as to, clear to
                  if (value === prev.afterBTTo) {
                    newData.afterBTTo = ""
                  }
                  return newData
                })
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {airportCodes
                    .filter(airport => airport.code !== formData.afterBTTo)
                    .map((airport) => (
                      <SelectItem key={airport.id} value={airport.code}>
                        {airport.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">to</span>
              <Select value={formData.afterBTTo} onValueChange={(value) => {
                setFormData(prev => {
                  const newData = { ...prev, afterBTTo: value }
                  // If to becomes same as from, clear from
                  if (value === prev.afterBTFrom) {
                    newData.afterBTFrom = ""
                  }
                  return newData
                })
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {airportCodes
                    .filter(airport => airport.code !== formData.afterBTFrom)
                    .map((airport) => (
                      <SelectItem key={airport.id} value={airport.code}>
                        {airport.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-medium mb-1 block">Destination</label>
            <Select value={formData.destination} onValueChange={(value) => {
              setFormData(prev => {
                const newData = { ...prev, destination: value }
                // If destination becomes same as origin, clear origin
                if (value === prev.origin) {
                  newData.origin = ""
                }
                return newData
              })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {airportCodes
                  .filter(airport => airport.code !== formData.origin)
                  .map((airport) => (
                    <SelectItem key={airport.id} value={airport.code}>
                      {airport.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sector Rates */}
          <div>
            <label className="text-xs font-medium mb-1 block">Sector Rates</label>
            <Select value={formData.sectorRates} onValueChange={(value) => setFormData(prev => ({ ...prev, sectorRates: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select sector rates" />
              </SelectTrigger>
              <SelectContent>
                {sectorRates.map((rate) => (
                  <SelectItem key={rate.id} value={`${rate.origin} → ${rate.destination}, €${rate.sector_rate}`}>
                    {rate.origin} → {rate.destination}, €{rate.sector_rate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
