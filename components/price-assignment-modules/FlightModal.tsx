"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
}

export function FlightModal({
  isOpen,
  onClose,
  onSave,
  selectedFlight,
  flightForm,
  setFlightForm,
  isCreating,
  error
}: FlightModalProps) {
  const [airportCodes, setAirportCodes] = useState<AirportCode[]>([])
  const [loadingAirports, setLoadingAirports] = useState(false)
  const [internalForm, setInternalForm] = useState({
    flightNumber: "",
    origin: "",
    destination: "",
    originAirportId: "",
    destinationAirportId: "",
    status: "scheduled"
  })

  // Fetch airport codes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAirportCodes()
    }
  }, [isOpen])

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
              className="col-span-3"
              placeholder="e.g., AA123"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="origin" className="text-right">
              Origin
            </Label>
            <Select
              value={internalForm.originAirportId}
              onValueChange={(value) => {
                const selectedAirport = airportCodes.find(airport => airport.id === value)
                setInternalForm({ 
                  ...internalForm, 
                  originAirportId: value,
                  origin: selectedAirport?.code || ""
                })
              }}
              disabled={loadingAirports}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={loadingAirports ? "Loading airports..." : "Select origin airport"} />
              </SelectTrigger>
              <SelectContent>
                {airportCodes
                  .filter(airport => airport.id !== internalForm.destinationAirportId)
                  .map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.code} {airport.is_eu ? "(EU)" : "(Non-EU)"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
              Destination
            </Label>
            <Select
              value={internalForm.destinationAirportId}
              onValueChange={(value) => {
                const selectedAirport = airportCodes.find(airport => airport.id === value)
                setInternalForm({ 
                  ...internalForm, 
                  destinationAirportId: value,
                  destination: selectedAirport?.code || ""
                })
              }}
              disabled={loadingAirports}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={loadingAirports ? "Loading airports..." : "Select destination airport"} />
              </SelectTrigger>
              <SelectContent>
                {airportCodes
                  .filter(airport => airport.id !== internalForm.originAirportId)
                  .map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.code} {airport.is_eu ? "(EU)" : "(Non-EU)"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isCreating}
          >
            {isCreating ? 'Saving...' : (selectedFlight ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
