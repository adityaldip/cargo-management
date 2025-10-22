"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ErrorBanner } from "@/components/ui/status-banner"
import { SectorRate, AirportCode } from "./types"

interface SectorRateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sectorRateData: any) => void
  selectedSectorRate: SectorRate | null
  sectorRateForm: {
    origin: string
    destination: string
    originAirportId: string
    destinationAirportId: string
    sectorRate: string
    customer: string
    originOE: string
    destinationOE: string
  }
  setSectorRateForm: (form: any) => void
  isCreating: boolean
  error: string | null
  airportCodes: AirportCode[]
}

export function SectorRateModal({
  isOpen,
  onClose,
  onSave,
  selectedSectorRate,
  sectorRateForm,
  setSectorRateForm,
  isCreating,
  error,
  airportCodes
}: SectorRateModalProps) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectedSectorRate) {
      // Extract numeric value from sector_rate
      let sectorRateValue = selectedSectorRate.sector_rate?.toString() || ""
      
      // Remove trailing .00 if it exists to show clean input
      if (sectorRateValue.endsWith('.00')) {
        sectorRateValue = sectorRateValue.replace('.00', '')
      }
      
      setSectorRateForm({
        origin: selectedSectorRate.origin,
        destination: selectedSectorRate.destination,
        originAirportId: selectedSectorRate.origin_airport_id,
        destinationAirportId: selectedSectorRate.destination_airport_id,
        sectorRate: sectorRateValue,
        customer: selectedSectorRate.customer || '',
        originOE: selectedSectorRate.origin_oe || '',
        destinationOE: selectedSectorRate.destination_oe || ''
      })
    }
  }, [selectedSectorRate, setSectorRateForm])

  const handleInputChange = (field: string, value: string) => {
    setSectorRateForm((prev: any) => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleSectorRateChange = (value: string) => {
    // Allow empty string, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange("sectorRate", value)
    }
  }

  const handleAirportChange = (field: 'originAirportId' | 'destinationAirportId', airportId: string) => {
    const airport = airportCodes.find(a => a.id === airportId)
    if (airport) {
      setSectorRateForm((prev: any) => {
        const newForm = {
          ...prev,
          [field]: airportId,
          [field === 'originAirportId' ? 'origin' : 'destination']: airport.code
        }
        
        
        return newForm
      })
    }
  }

  const handleOEChange = (field: 'originOE' | 'destinationOE', airportCode: string) => {
    setSectorRateForm((prev: any) => ({
      ...prev,
      [field]: airportCode
    }))
  }

  const getAvailableAirportCodes = (excludeField: 'originAirportId' | 'destinationAirportId') => {
    const excludeId = sectorRateForm[excludeField]
    return airportCodes.filter(airport => airport.id !== excludeId)
  }

  const getAvailableOECodes = (excludeField: 'originOE' | 'destinationOE') => {
    const excludeCode = sectorRateForm[excludeField]
    return activeAirportCodes.filter(airport => airport.code !== excludeCode)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!sectorRateForm.originAirportId) {
      errors.originAirportId = "Origin airport is required"
    }
    
    if (!sectorRateForm.destinationAirportId) {
      errors.destinationAirportId = "Destination airport is required"
    }
    
    if (sectorRateForm.originAirportId === sectorRateForm.destinationAirportId) {
      errors.destinationAirportId = "Destination must be different from origin"
    }
    
    if (!sectorRateForm.sectorRate || isNaN(Number(sectorRateForm.sectorRate)) || Number(sectorRateForm.sectorRate) <= 0) {
      errors.sectorRate = "Valid sector rate is required"
    }
    
    // flight_num_preview is now optional

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      // Format sector rate properly - only add .00 if no decimal point exists
      let formattedRate = sectorRateForm.sectorRate
      if (formattedRate && !formattedRate.includes('.')) {
        formattedRate = `${formattedRate}.00`
      } else if (formattedRate && formattedRate.endsWith('.')) {
        formattedRate = `${formattedRate}00`
      } else if (formattedRate && formattedRate.includes('.') && formattedRate.split('.')[1].length === 1) {
        formattedRate = `${formattedRate}0`
      }

      onSave({
        origin: sectorRateForm.origin,
        destination: sectorRateForm.destination,
        originAirportId: sectorRateForm.originAirportId,
        destinationAirportId: sectorRateForm.destinationAirportId,
        sectorRate: parseFloat(formattedRate),
        customer: sectorRateForm.customer,
        originOE: sectorRateForm.originOE,
        destinationOE: sectorRateForm.destinationOE
      })
    }
  }

  const activeAirportCodes = airportCodes.filter(airport => airport.is_active)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedSectorRate ? "Edit Sector Rate" : "Add New Sector Rate"}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <ErrorBanner
            message={error}
            className="mb-4"
          />
        )}

        <div className="space-y-4">
          {/* Customer Field */}
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              type="text"
              value={sectorRateForm.customer}
              onChange={(e) => handleInputChange('customer', e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          {/* Origin and Destination Airports */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originAirportId">Origin Airport *</Label>
              <Select
                value={sectorRateForm.originAirportId}
                onValueChange={(value) => handleAirportChange('originAirportId', value)}
              >
                <SelectTrigger className={formErrors.originAirportId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select origin airport" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableAirportCodes('destinationAirportId').map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{airport.code}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {airport.is_eu ? 'EU' : 'Non-EU'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.originAirportId && (
                <p className="text-sm text-red-500 mt-1">{formErrors.originAirportId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="destinationAirportId">Destination Airport *</Label>
              <Select
                value={sectorRateForm.destinationAirportId}
                onValueChange={(value) => handleAirportChange('destinationAirportId', value)}
              >
                <SelectTrigger className={formErrors.destinationAirportId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select destination airport" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableAirportCodes('originAirportId').map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{airport.code}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {airport.is_eu ? 'EU' : 'Non-EU'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.destinationAirportId && (
                <p className="text-sm text-red-500 mt-1">{formErrors.destinationAirportId}</p>
              )}
            </div>
          </div>

          {/* Origin and Destination OE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originOE">Origin OE</Label>
              <Select
                value={sectorRateForm.originOE}
                onValueChange={(value) => handleOEChange('originOE', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select origin OE" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOECodes('destinationOE').map((airport) => (
                    <SelectItem key={airport.code} value={airport.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{airport.code}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {airport.is_eu ? 'EU' : 'Non-EU'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destinationOE">Destination OE</Label>
              <Select
                value={sectorRateForm.destinationOE}
                onValueChange={(value) => handleOEChange('destinationOE', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination OE" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOECodes('originOE').map((airport) => (
                    <SelectItem key={airport.code} value={airport.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{airport.code}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {airport.is_eu ? 'EU' : 'Non-EU'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sector Rate */}
          <div>
            <Label htmlFor="sectorRate">Sector Rate *</Label>
            <Input
              id="sectorRate"
              type="text"
              value={sectorRateForm.sectorRate}
              onChange={(e) => handleSectorRateChange(e.target.value)}
              placeholder="25.55"
              className={formErrors.sectorRate ? "border-red-500" : ""}
              inputMode="decimal"
            />
            {formErrors.sectorRate && (
              <p className="text-sm text-red-500 mt-1">{formErrors.sectorRate}</p>
            )}
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating}>
            {isCreating ? "Saving..." : (selectedSectorRate ? "Update" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
