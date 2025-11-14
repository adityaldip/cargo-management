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
import { Trash2, Plus } from "lucide-react"

interface SectorRateV3 {
  id: string
  status: boolean
  label: string | null
  airbaltic_origin: string[] | null
  airbaltic_destination: string[] | null
  sector_rate: number | null
  transit_routes: string[] | null
  transit_prices: number[] | null
  customer_id: string | null
  customers: {
    id: string
    name: string
    code: string
  } | null
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
  onSave: (data: Partial<SectorRateV3>) => Promise<void>
  editingData?: SectorRateV3 | null
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
    label: "",
    airbalticOrigin: "",
    airbalticDestination: "",
    sectorRate: "",
    transitRoutes: [] as string[],
    transitPrices: [] as string[],
    customerId: "",
    status: true
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
      // Convert numeric sector_rate to string for input
      let sectorRateValue = editingData.sector_rate?.toString() || ""
      
      // Remove trailing .00 if it exists to show clean input
      if (sectorRateValue.endsWith('.00')) {
        sectorRateValue = sectorRateValue.replace('.00', '')
      }
      
      // Parse single airport from array
      const parseSingleAirport = (airportData: string[] | null) => {
        if (!airportData || !Array.isArray(airportData) || airportData.length === 0) return ""
        return airportData[0] // Take first airport
      }

      // Parse airport arrays for transit routes
      const parseAirports = (airportData: string[] | null) => {
        if (!airportData) return []
        if (Array.isArray(airportData)) return airportData
        return []
      }

      // Parse transit prices to strings for input
      const parseTransitPrices = (prices: number[] | null) => {
        if (!prices) return []
        return prices.map(p => p.toString())
      }
      
      setFormData({
        label: editingData.label || "",
        airbalticOrigin: parseSingleAirport(editingData.airbaltic_origin),
        airbalticDestination: parseSingleAirport(editingData.airbaltic_destination),
        sectorRate: sectorRateValue,
        transitRoutes: parseAirports(editingData.transit_routes),
        transitPrices: parseTransitPrices(editingData.transit_prices),
        customerId: editingData.customer_id || "",
        status: editingData.status
      })
    } else {
      // Reset form for new entry
      setFormData({
        label: "",
        airbalticOrigin: "",
        airbalticDestination: "",
        sectorRate: "",
        transitRoutes: [],
        transitPrices: [],
        customerId: "",
        status: true
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

  const handleSectorRateChange = (value: string) => {
    // Allow empty string, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange("sectorRate", value)
    }
  }

  const handleMultiSelectChange = (field: 'transitRoutes', value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSingleSelectChange = (field: 'airbalticOrigin' | 'airbalticDestination', value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Check if origin and destination are the same
      if (field === 'airbalticOrigin' && value && value === prev.airbalticDestination) {
        toast({
          title: "Validation Error",
          description: "AirBaltic Origin and Destination cannot be the same",
          variant: "destructive",
        })
        return prev // Don't update if they're the same
      }
      
      if (field === 'airbalticDestination' && value && value === prev.airbalticOrigin) {
        toast({
          title: "Validation Error", 
          description: "AirBaltic Origin and Destination cannot be the same",
          variant: "destructive",
        })
        return prev // Don't update if they're the same
      }
      
      return newData
    })
  }

  const handleTransitPriceChange = (index: number, value: string) => {
    // Allow empty string, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => {
        const newPrices = [...prev.transitPrices]
        newPrices[index] = value
        return {
          ...prev,
          transitPrices: newPrices
        }
      })
    }
  }

  const handleAddTransitRoute = () => {
    setFormData(prev => ({
      ...prev,
      transitRoutes: [...prev.transitRoutes, ""],
      transitPrices: [...prev.transitPrices, ""]
    }))
  }

  const handleRemoveTransitRoute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      transitRoutes: prev.transitRoutes.filter((_, i) => i !== index),
      transitPrices: prev.transitPrices.filter((_, i) => i !== index)
    }))
  }


  const handleSave = async () => {
    // Validate required fields
    if (!formData.label || !formData.airbalticOrigin || !formData.airbalticDestination || !formData.sectorRate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate that AirBaltic Origin and Destination are different
    if (formData.airbalticOrigin === formData.airbalticDestination) {
      toast({
        title: "Validation Error",
        description: "AirBaltic Origin and Destination cannot be the same",
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

    // Validate transit prices if transit routes exist
    if (formData.transitRoutes.length > 0) {
      const invalidPrices = formData.transitPrices.some((price, index) => {
        if (formData.transitRoutes[index]) {
          const priceValue = parseFloat(price)
          return isNaN(priceValue) || priceValue < 0
        }
        return false
      })
      
      if (invalidPrices) {
        toast({
          title: "Validation Error",
          description: "Please enter valid transit prices for all transit routes",
          variant: "destructive",
        })
        return
      }
    }

    try {
      // Convert transit prices to numbers
      const transitPricesNumeric = formData.transitPrices
        .map((price, index) => {
          if (!formData.transitRoutes[index]) return null
          const priceValue = parseFloat(price)
          return isNaN(priceValue) ? null : priceValue
        })
        .filter((p): p is number => p !== null)

      const dataToSave = {
        label: formData.label,
        airbaltic_origin: formData.airbalticOrigin ? [formData.airbalticOrigin] : null,
        airbaltic_destination: formData.airbalticDestination ? [formData.airbalticDestination] : null,
        sector_rate: sectorRateValue,
        transit_routes: formData.transitRoutes.length === 0 ? null : formData.transitRoutes,
        transit_prices: transitPricesNumeric.length === 0 ? null : transitPricesNumeric,
        customer_id: formData.customerId || null,
        status: formData.status
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
      label: "",
      airbalticOrigin: "",
      airbalticDestination: "",
      sectorRate: "",
      transitRoutes: [],
      transitPrices: [],
      customerId: "",
      status: true
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
          {/* Label */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Label
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
              className="col-span-3"
              placeholder="e.g., NL Post (AMS → IST)"
            />
          </div>

          {/* AirBaltic Origin */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="airbalticOrigin" className="text-right">
              AirBaltic Origin
            </Label>
            <div className="col-span-3">
              <SearchableSelect
                options={loadingAirports 
                  ? [{ value: "", label: "Loading airports...", disabled: true }]
                  : airportCodes
                      .filter((airport) => airport.code !== formData.airbalticDestination)
                      .map((airport) => ({
                        value: airport.code,
                        label: airport.code
                      }))
                }
                value={formData.airbalticOrigin}
                onValueChange={(value) => handleSingleSelectChange("airbalticOrigin", value)}
                placeholder="Select AirBaltic origin"
                searchPlaceholder="Search AirBaltic origin..."
                emptyMessage="No airport found."
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
                  onChange={(e) => handleSectorRateChange(e.target.value)}
                  className="pl-8"
                  placeholder="25.55"
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
              <SearchableSelect
                options={loadingAirports 
                  ? [{ value: "", label: "Loading airports...", disabled: true }]
                  : airportCodes
                      .filter((airport) => airport.code !== formData.airbalticOrigin)
                      .map((airport) => ({
                        value: airport.code,
                        label: airport.code
                      }))
                }
                value={formData.airbalticDestination}
                onValueChange={(value) => handleSingleSelectChange("airbalticDestination", value)}
                placeholder="Select AirBaltic destination"
                searchPlaceholder="Search AirBaltic destination..."
                emptyMessage="No airport found."
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
                      label: customer.name
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

          {/* Transit Routes and Prices */}
          {formData.airbalticOrigin && formData.airbalticDestination && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Transit Routes
              </Label>
              <div className="col-span-3 space-y-2">
                {formData.transitRoutes.map((route, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <SearchableSelect
                        options={loadingAirports 
                          ? [{ value: "", label: "Loading airports...", disabled: true }]
                          : airportCodes
                              .filter((airport) => {
                                // Exclude airports already selected in origin
                                if (formData.airbalticOrigin === airport.code) return false
                                // Exclude airports already selected in destination
                                if (formData.airbalticDestination === airport.code) return false
                                // Exclude airports already selected in other transit routes
                                if (formData.transitRoutes.some((r, i) => i !== index && r === airport.code)) return false
                                return true
                              })
                              .map((airport) => ({
                                value: airport.code,
                                label: airport.code
                              }))
                        }
                        value={route}
                        onValueChange={(value) => {
                          const newRoutes = [...formData.transitRoutes]
                          newRoutes[index] = value
                          handleMultiSelectChange("transitRoutes", newRoutes)
                        }}
                        placeholder="Select transit route"
                        searchPlaceholder="Search airport..."
                        emptyMessage="No airport found."
                      />
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">€</span>
                        <Input
                          value={formData.transitPrices[index] || ""}
                          onChange={(e) => handleTransitPriceChange(index, e.target.value)}
                          className="pl-6"
                          placeholder="0.00"
                          type="text"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTransitRoute(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTransitRoute}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transit Route
                </Button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => handleInputChange("status", checked)}
              />
              <Label htmlFor="status" className="text-sm">
                {formData.status ? "Active" : "Inactive"}
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

