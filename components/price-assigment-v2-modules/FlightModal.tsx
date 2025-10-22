"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ErrorBanner } from "@/components/ui/status-banner"
import { Flight, AirportCode } from "./types"

interface FlightModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (flightData: any) => void
  selectedFlight: Flight | null
  flightForm: {
    flightNumber: string
    origin: string
    destination: string
    originAirportId: string
    destinationAirportId: string
    status: string
  }
  setFlightForm: (form: any) => void
  isCreating: boolean
  error: string | null
  existingFlights?: Flight[]
}

export function FlightModal({
  isOpen,
  onClose,
  onSave,
  selectedFlight,
  flightForm,
  setFlightForm,
  isCreating,
  error,
  existingFlights = []
}: FlightModalProps) {
  const [airportCodes, setAirportCodes] = useState<AirportCode[]>([])
  const [loadingAirports, setLoadingAirports] = useState(false)
  const [isDuplicateFlight, setIsDuplicateFlight] = useState(false)
  const [openSelects, setOpenSelects] = useState({
    origin: false,
    destination: false
  })
  const [searchTerms, setSearchTerms] = useState({
    origin: "",
    destination: ""
  })
  const [internalForm, setInternalForm] = useState({
    flightNumber: "",
    origin: "",
    destination: "",
    originAirportId: "",
    destinationAirportId: "",
    status: "scheduled"
  })

  // Check for duplicate flight number
  const checkDuplicateFlight = (flightNumber: string) => {
    if (!flightNumber.trim() || selectedFlight) return false
    
    const duplicate = existingFlights.find(flight => 
      flight.flightNumber.toLowerCase() === flightNumber.trim().toLowerCase()
    )
    return !!duplicate
  }

  // Fetch airport codes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAirportCodes()
    }
  }, [isOpen])

  // Check for duplicates when flight number changes
  useEffect(() => {
    const isDuplicate = checkDuplicateFlight(internalForm.flightNumber)
    setIsDuplicateFlight(isDuplicate)
  }, [internalForm.flightNumber, selectedFlight, existingFlights])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setOpenSelects({
          origin: false,
          destination: false
        })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update internal form when selectedFlight changes (for editing)
  useEffect(() => {
    console.log('FlightModal useEffect triggered:', {
      selectedFlight: selectedFlight?.id,
      isOpen,
      airportCodesLength: airportCodes.length,
      selectedFlightData: selectedFlight
    })
    
    if (selectedFlight && isOpen && airportCodes.length > 0) {
      console.log('Setting form with selected flight data:', {
        flightNumber: selectedFlight.flightNumber,
        originAirportId: selectedFlight.originAirportId,
        destinationAirportId: selectedFlight.destinationAirportId
      })
      
      // Find airport IDs by matching origin/destination codes if IDs are missing
      let originAirportId = selectedFlight.originAirportId
      let destinationAirportId = selectedFlight.destinationAirportId
      
      if (!originAirportId && selectedFlight.origin) {
        const originAirport = airportCodes.find(airport => airport.code === selectedFlight.origin)
        originAirportId = originAirport?.id || ""
      }
      
      if (!destinationAirportId && selectedFlight.destination) {
        const destinationAirport = airportCodes.find(airport => airport.code === selectedFlight.destination)
        destinationAirportId = destinationAirport?.id || ""
      }
      
      console.log('Resolved airport IDs:', { originAirportId, destinationAirportId })
      
      setInternalForm({
        flightNumber: selectedFlight.flightNumber,
        origin: selectedFlight.origin,
        destination: selectedFlight.destination,
        originAirportId: originAirportId || "",
        destinationAirportId: destinationAirportId || "",
        status: selectedFlight.status
      })
    } else if (!selectedFlight && isOpen) {
      console.log('Resetting form for new flight')
      // Reset form for new flight
      setInternalForm({
        flightNumber: "",
        origin: "",
        destination: "",
        originAirportId: "",
        destinationAirportId: "",
        status: "scheduled"
      })
    }
  }, [selectedFlight, isOpen, airportCodes])

  const fetchAirportCodes = async () => {
    console.log('Fetching airport codes...')
    setLoadingAirports(true)
    try {
      const response = await fetch('/api/airport-codes')
      const data = await response.json()
      console.log('Airport codes response:', data)
      if (data.data) {
        const activeAirports = data.data.filter((airport: AirportCode) => airport.is_active)
        console.log('Setting airport codes:', activeAirports.length, 'airports')
        setAirportCodes(activeAirports)
      }
    } catch (error) {
      console.error('Error fetching airport codes:', error)
    } finally {
      setLoadingAirports(false)
    }
  }

  const handleSave = () => {
    if (!internalForm.flightNumber.trim() || !internalForm.originAirportId || !internalForm.destinationAirportId) {
      return
    }
    
    // Prevent saving if there's a duplicate flight number
    if (isDuplicateFlight) {
      return
    }
    
    onSave(internalForm)
  }

  const handleClose = () => {
    setInternalForm({
      flightNumber: "",
      origin: "",
      destination: "",
      originAirportId: "",
      destinationAirportId: "",
      status: "scheduled"
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedFlight ? 'Update Flight' : 'Add New Flight'}
          </DialogTitle>
          <DialogDescription>
            {selectedFlight ? 'Update the flight details below.' : 'Fill in the flight details to create a new flight.'}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <ErrorBanner
            message={error}
            className="mb-4"
          />
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="flightNumber" className="text-right">
              Flight Number
            </Label>
            <Input
              id="flightNumber"
              value={internalForm.flightNumber}
              onChange={(e) => setInternalForm({ ...internalForm, flightNumber: e.target.value })}
              className={`col-span-3 ${isDuplicateFlight ? 'border-red-500' : ''}`}
              placeholder="e.g., AA123"
            />
            {isDuplicateFlight && (
              <p className="col-span-4 text-sm text-red-500 mt-1">
                ⚠️ This flight number already exists. Please choose a different one.
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="origin" className="text-right">
              Origin
            </Label>
            <div className="relative dropdown-container col-span-3">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSelects.origin}
                className="w-full justify-between"
                onClick={() => setOpenSelects({
                  origin: !openSelects.origin,
                  destination: false
                })}
                disabled={loadingAirports}
              >
                {internalForm.originAirportId
                  ? airportCodes.find((airport) => airport.id === internalForm.originAirportId)?.code
                  : loadingAirports ? "Loading airports..." : "Select origin airport"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {openSelects.origin && (
                <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                  <div className="p-2">
                    <Input
                      placeholder="Search origin airport..."
                      value={searchTerms.origin}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, origin: e.target.value }))}
                      className="mb-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {airportCodes
                        .filter(airport => 
                          airport.id !== internalForm.destinationAirportId &&
                          airport.code.toLowerCase().includes(searchTerms.origin.toLowerCase())
                        )
                        .map((airport) => (
                          <div
                            key={airport.id}
                            className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setInternalForm({ 
                                ...internalForm, 
                                originAirportId: airport.id,
                                origin: airport.code
                              })
                              setOpenSelects(prev => ({ ...prev, origin: false }))
                              setSearchTerms(prev => ({ ...prev, origin: "" }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                internalForm.originAirportId === airport.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center justify-between w-full">
                              <span>{airport.code}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {airport.is_eu ? 'EU' : 'Non-EU'}
                              </span>
                            </div>
                          </div>
                        ))}
                      {airportCodes.filter(airport => 
                        airport.id !== internalForm.destinationAirportId &&
                        airport.code.toLowerCase().includes(searchTerms.origin.toLowerCase())
                      ).length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No origin found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
              Destination
            </Label>
            <div className="relative dropdown-container col-span-3">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSelects.destination}
                className="w-full justify-between"
                onClick={() => setOpenSelects({
                  origin: false,
                  destination: !openSelects.destination
                })}
                disabled={loadingAirports}
              >
                {internalForm.destinationAirportId
                  ? airportCodes.find((airport) => airport.id === internalForm.destinationAirportId)?.code
                  : loadingAirports ? "Loading airports..." : "Select destination airport"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {openSelects.destination && (
                <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
                  <div className="p-2">
                    <Input
                      placeholder="Search destination airport..."
                      value={searchTerms.destination}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, destination: e.target.value }))}
                      className="mb-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {airportCodes
                        .filter(airport => 
                          airport.id !== internalForm.originAirportId &&
                          airport.code.toLowerCase().includes(searchTerms.destination.toLowerCase())
                        )
                        .map((airport) => (
                          <div
                            key={airport.id}
                            className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setInternalForm({ 
                                ...internalForm, 
                                destinationAirportId: airport.id,
                                destination: airport.code
                              })
                              setOpenSelects(prev => ({ ...prev, destination: false }))
                              setSearchTerms(prev => ({ ...prev, destination: "" }))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                internalForm.destinationAirportId === airport.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center justify-between w-full">
                              <span>{airport.code}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {airport.is_eu ? 'EU' : 'Non-EU'}
                              </span>
                            </div>
                          </div>
                        ))}
                      {airportCodes.filter(airport => 
                        airport.id !== internalForm.originAirportId &&
                        airport.code.toLowerCase().includes(searchTerms.destination.toLowerCase())
                      ).length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-gray-500">No destination found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isCreating || isDuplicateFlight}
          >
            {isCreating ? 'Saving...' : (selectedFlight ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
