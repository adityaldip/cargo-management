"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface SectorRateV2 {
  id: string
  text_label: string | null
  origin_airport: string | null
  airbaltic_origin: string[] | null
  sector_rate: string | null
  airbaltic_destination: string[] | null
  final_destination: string | null
  customer_id: string | null
  customers: {
    id: string
    name: string
    code: string
  } | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  name: string
  code: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  is_active: boolean
}

interface SectorRateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<SectorRateV2>) => Promise<void>
  editingData?: SectorRateV2 | null
  isSaving: boolean
}

export function SectorRateModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingData, 
  isSaving 
}: SectorRateModalProps) {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    textLabel: "",
    originAirport: "",
    airbalticOrigin: [] as string[],
    sectorRate: "",
    airbalticDestination: [] as string[],
    finalDestination: "",
    customerId: "",
    isActive: false
  })
  
  const [airportCodes, setAirportCodes] = useState<Array<{id: string, code: string, is_active: boolean}>>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingAirports, setLoadingAirports] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAirportCodes()
      fetchCustomers()
    }
  }, [isOpen])

  // Populate form when editing
  useEffect(() => {
    if (editingData) {
      // Extract numeric value from sector_rate (remove € symbol)
      const sectorRateValue = editingData.sector_rate?.replace('€', '') || ""
      
      // Parse airbaltic_origin and airbaltic_destination from array or string
      const parseAirports = (airportData: string | string[] | null) => {
        if (!airportData) return []
        if (Array.isArray(airportData)) return airportData
        if (airportData === "ALL") return []
        return airportData.split(',').map(airport => airport.trim()).filter(Boolean)
      }
      
      setFormData({
        textLabel: editingData.text_label || "",
        originAirport: editingData.origin_airport || "",
        airbalticOrigin: parseAirports(editingData.airbaltic_origin),
        sectorRate: sectorRateValue,
        airbalticDestination: parseAirports(editingData.airbaltic_destination),
        finalDestination: editingData.final_destination || "",
        customerId: editingData.customer_id || "",
        isActive: editingData.is_active
      })
    } else {
      // Reset form for new entry
      setFormData({
        textLabel: "",
        originAirport: "",
        airbalticOrigin: [],
        sectorRate: "",
        airbalticDestination: [],
        finalDestination: "",
        customerId: "",
        isActive: false
      })
    }
  }, [editingData, isOpen])

  const fetchAirportCodes = async () => {
    try {
      setLoadingAirports(true)
      const { data, error } = await (supabase as any)
        .from('airport_code')
        .select('id, code, is_active')
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (error) throw error
      setAirportCodes(data || [])
    } catch (error) {
      console.error('Error fetching airport codes:', error)
      toast({
        title: "Error",
        description: "Failed to fetch airport codes",
        variant: "destructive",
      })
    } finally {
      setLoadingAirports(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('id, name, code, email, phone, address, city, state, postal_code, country, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      })
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMultiSelectChange = (field: 'airbalticOrigin' | 'airbalticDestination', value: string) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[]
      if (value === 'all') {
        // If "Select All" is clicked, toggle between all airports and empty
        return {
          ...prev,
          [field]: currentValues.length === airportCodes.length ? [] : airportCodes.map(airport => airport.code)
        }
      } else {
        // Toggle individual airport
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
        return {
          ...prev,
          [field]: newValues
        }
      }
    })
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.textLabel || formData.airbalticOrigin.length === 0 || formData.airbalticDestination.length === 0 || !formData.sectorRate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate sector rate format
    const sectorRateValue = parseFloat(formData.sectorRate)
    if (isNaN(sectorRateValue) || sectorRateValue < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid sector rate (positive number)",
        variant: "destructive",
      })
      return
    }

    try {
      const dataToSave = {
        text_label: formData.textLabel,
        origin_airport: formData.originAirport,
        airbaltic_origin: formData.airbalticOrigin.length === airportCodes.length ? ["ALL"] : formData.airbalticOrigin,
        sector_rate: `€${parseFloat(formData.sectorRate).toFixed(2)}`,
        airbaltic_destination: formData.airbalticDestination.length === airportCodes.length ? ["ALL"] : formData.airbalticDestination,
        final_destination: formData.finalDestination,
        customer_id: formData.customerId || null,
        is_active: formData.isActive
      }

      await onSave(dataToSave)
    } catch (error) {
      console.error('Error saving sector rate:', error)
      toast({
        title: "Error",
        description: "Failed to save sector rate",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    setFormData({
      textLabel: "",
      originAirport: "",
      airbalticOrigin: [],
      sectorRate: "",
      airbalticDestination: [],
      finalDestination: "",
      customerId: "",
      isActive: false
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingData ? "Edit Sector Rate" : "Add New Sector Rate"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Text Label */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="textLabel" className="text-right">
              Text Label
            </Label>
            <Input
              id="textLabel"
              value={formData.textLabel}
              onChange={(e) => handleInputChange("textLabel", e.target.value)}
              className="col-span-3"
              placeholder="e.g., NL Post (AMS → IST)"
            />
          </div>

          {/* Origin Airport */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="originAirport" className="text-right">
              Origin Airport
            </Label>
            <div className="col-span-3">
              <SearchableSelect
                options={[
                  { value: "no previous stop", label: "no previous stop" },
                  ...(loadingAirports 
                    ? [{ value: "", label: "Loading airports...", disabled: true }]
                    : airportCodes.map((airport) => ({
                        value: airport.code,
                        label: airport.code
                      }))
                  )
                ]}
                value={formData.originAirport}
                onValueChange={(value) => handleInputChange("originAirport", value)}
                placeholder="Select origin airport"
                searchPlaceholder="Search origin airport..."
                emptyMessage="No airport found."
              />
            </div>
          </div>

          {/* AirBaltic Origin */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="airbalticOrigin" className="text-right">
              AirBaltic Origin
            </Label>
            <div className="col-span-3">
              <MultiSelect
                options={[
                  { value: "all", label: "Select All Flights" },
                  ...(loadingAirports 
                    ? [{ value: "", label: "Loading airports...", disabled: true }]
                    : airportCodes.map((airport) => ({
                        value: airport.code,
                        label: airport.code
                      }))
                  )
                ]}
                value={formData.airbalticOrigin}
                onValueChange={(value) => handleInputChange("airbalticOrigin", value)}
                placeholder="Select AirBaltic origins"
                searchPlaceholder="Search AirBaltic origins..."
                emptyMessage="No airport found."
                maxDisplay={2}
              />
            </div>
          </div>

          {/* Sector Rate */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sectorRate" className="text-right">
              Sector Rate
            </Label>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <Input
                  id="sectorRate"
                  value={formData.sectorRate}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow only numbers and one decimal point
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      handleInputChange("sectorRate", value)
                    }
                  }}
                  className="pl-8"
                  placeholder="2.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter amount in euros (e.g., 2.00)</p>
            </div>
          </div>

          {/* AirBaltic Destination */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="airbalticDestination" className="text-right">
              AirBaltic Destination
            </Label>
            <div className="col-span-3">
              <MultiSelect
                options={[
                  { value: "all", label: "Select All Flights" },
                  ...(loadingAirports 
                    ? [{ value: "", label: "Loading airports...", disabled: true }]
                    : airportCodes.map((airport) => ({
                        value: airport.code,
                        label: airport.code
                      }))
                  )
                ]}
                value={formData.airbalticDestination}
                onValueChange={(value) => handleInputChange("airbalticDestination", value)}
                placeholder="Select AirBaltic destinations"
                searchPlaceholder="Search AirBaltic destinations..."
                emptyMessage="No airport found."
                maxDisplay={2}
              />
            </div>
          </div>

          {/* Final Destination */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="finalDestination" className="text-right">
              Final Destination
            </Label>
            <div className="col-span-3">
              <SearchableSelect
                options={[
                  { value: "no additional", label: "no additional" },
                  ...(loadingAirports 
                    ? [{ value: "", label: "Loading airports...", disabled: true }]
                    : airportCodes.map((airport) => ({
                        value: airport.code,
                        label: airport.code
                      }))
                  )
                ]}
                value={formData.finalDestination}
                onValueChange={(value) => handleInputChange("finalDestination", value)}
                placeholder="Select final destination"
                searchPlaceholder="Search final destination..."
                emptyMessage="No destination found."
              />
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer" className="text-right">
              Customer
            </Label>
            <div className="col-span-3">
              <SearchableSelect
                options={loadingCustomers 
                  ? [{ value: "", label: "Loading customers...", disabled: true }]
                  : customers.map((customer) => ({
                      value: customer.id,
                      label: `${customer.name} (${customer.code})`
                    }))
                }
                value={formData.customerId}
                onValueChange={(value) => handleInputChange("customerId", value)}
                placeholder="Select customer"
                searchPlaceholder="Search customer..."
                emptyMessage="No customer found."
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Status
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive" className="text-sm">
                {formData.isActive ? "Active" : "Inactive"}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {editingData ? "Updating..." : "Creating..."}
              </>
            ) : (
              editingData ? "Update" : "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
