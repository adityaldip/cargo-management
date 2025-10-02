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
      setSectorRateForm({
        origin: selectedSectorRate.origin,
        destination: selectedSectorRate.destination,
        originAirportId: selectedSectorRate.origin_airport_id,
        destinationAirportId: selectedSectorRate.destination_airport_id,
        sectorRate: selectedSectorRate.sector_rate.toString()
      })
    }
  }, [selectedSectorRate, setSectorRateForm])

  const handleInputChange = (field: string, value: string) => {
    setSectorRateForm(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleAirportChange = (field: 'originAirportId' | 'destinationAirportId', airportId: string) => {
    const airport = airportCodes.find(a => a.id === airportId)
    if (airport) {
      setSectorRateForm(prev => {
        const newForm = {
          ...prev,
          [field]: airportId,
          [field === 'originAirportId' ? 'origin' : 'destination']: airport.code
        }
        
        
        return newForm
      })
    }
  }

  const getAvailableAirportCodes = (excludeField: 'originAirportId' | 'destinationAirportId') => {
    const excludeId = sectorRateForm[excludeField]
    return airportCodes.filter(airport => airport.id !== excludeId)
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
      onSave({
        origin: sectorRateForm.origin,
        destination: sectorRateForm.destination,
        originAirportId: sectorRateForm.originAirportId,
        destinationAirportId: sectorRateForm.destinationAirportId,
        sectorRate: Number(sectorRateForm.sectorRate)
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

          <div>
            <Label htmlFor="sectorRate">Sector Rate *</Label>
            <Input
              id="sectorRate"
              type="number"
              step="0.01"
              min="0"
              value={sectorRateForm.sectorRate}
              onChange={(e) => handleInputChange('sectorRate', e.target.value)}
              placeholder="Enter sector rate"
              className={formErrors.sectorRate ? "border-red-500" : ""}
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
