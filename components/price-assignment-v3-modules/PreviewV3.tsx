"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { AddFlightUploadModalV3 } from "./AddFlightUploadModalV3"
import { EditFlightUploadModalV3 } from "./EditFlightUploadModalV3"
import { Edit } from "lucide-react"
import { SweetAlert } from "@/components/ui/sweet-alert"

interface SectorRateV3 {
  id: string
  status: boolean
  label: string | null
  airbaltic_origin: string[] | null
  airbaltic_destination: string[] | null
  sector_rate: number | null
  transit_routes: string[] | null
  transit_prices: (number | string)[] | null
  selected_routes: string[] | null
  customer_id: string | null
  customers: {
    id: string
    name: string
    code: string
  } | null
  created_at: string
  updated_at: string
}

interface UploadData {
  id?: string
  origin: string
  destination: string
  inbound: string
  outbound: string
  sector_rate_id?: string
  customer_id?: string | null
  transit_route?: string | null
  created_at?: string
  updated_at?: string
}

interface SectorRateOption {
  sectorRateId: string
  transitRoute: string | null
  displayText: string
  sectorRate: SectorRateV3
}

interface GeneratedData {
  id: string
  origin: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  destination: string
  selectedSectorRate: SectorRateV3 | null
  created_at?: string
  updated_at?: string
}

export function PreviewV3() {
  const { toast } = useToast()
  const [uploadData, setUploadData] = useState<UploadData[]>([])
  const [sectorRates, setSectorRates] = useState<SectorRateV3[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(1)
  
  // Upload table states
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [editRecord, setEditRecord] = useState<UploadData | null>(null)
  const [flights, setFlights] = useState<any[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; code: string }>>([])

  // Load data from database
  useEffect(() => {
    fetchSectorRates()
    fetchCustomers()
    loadDataFromDatabase()
  }, [refreshTrigger])


  const fetchSectorRates = async () => {
    try {
      setLoading(true)
      
      // Get sector rates first
      const { data: sectorRatesData, error: sectorRatesError } = await (supabase as any)
        .from('sector_rates_v3')
        .select('*')
        .eq('status', true)
        .order('created_at', { ascending: false })

      if (sectorRatesError) {
        console.error('Error fetching sector rates:', sectorRatesError)
        throw new Error(sectorRatesError.message || 'Failed to fetch sector rates')
      }

      // Get all customers
      const { data: customersData, error: customersError } = await (supabase as any)
        .from('customers')
        .select('id, name, code')

      if (customersError) {
        console.error('Error fetching customers:', customersError)
        throw new Error(customersError.message || 'Failed to fetch customers')
      }

      // Merge the data manually
      const mergedData = sectorRatesData?.map((rate: any) => ({
        ...rate,
        customers: customersData?.find((customer: any) => customer.id === rate.customer_id) || null
      })) || []

      setSectorRates(mergedData)
    } catch (error: any) {
      console.error('Error fetching sector rates:', error)
      toast({
        title: "Error",
        description: error?.message || 'Failed to fetch sector rates. Please ensure the sector_rates_v3 table exists.',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await (supabase as any)
        .from('customers')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (customersError) {
        console.error('Error fetching customers:', customersError)
        throw new Error(customersError.message || 'Failed to fetch customers')
      }

      setCustomers(customersData || [])
    } catch (error: any) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: error?.message || 'Failed to fetch customers.',
        variant: "destructive"
      })
    }
  }

  // Extract flight number from inbound/outbound string
  const extractFlightNumber = (flightString: string): string => {
    if (!flightString) return ""
    
    let match = flightString.match(/^([A-Z0-9]+),/)
    if (match) return match[1]
    
    match = flightString.match(/^([A-Z0-9]+)$/)
    if (match) return match[1]
    
    return ""
  }

  // Check if flight exists in flights table
  const isFlightValid = (flightString: string): boolean => {
    if (!flightString || flightString.trim() === "" || flightString === "-") return true
    if (!flights.length) return true
    
    const flightNumber = extractFlightNumber(flightString)
    if (!flightNumber) return false
    
    return flights.some(flight => 
      flight.flight_number?.toLowerCase() === flightNumber.toLowerCase()
    )
  }

  const loadDataFromDatabase = async () => {
    setIsLoading(true)
    try {
      // Load preview_flights_v3 data
      const { data: dbData, error } = await (supabase as any)
        .from('preview_flights_v3')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading preview_flights_v3:', error)
        throw new Error(error.message || 'Failed to load preview flights data')
      }

      // Load flights data for validation
      const { data: flightsData, error: flightsError } = await supabase
        .from('flights')
        .select('*')
        .eq('is_active', true)

      if (flightsError) {
        console.error('Error loading flights:', flightsError)
        throw new Error(flightsError.message || 'Failed to load flights data')
      }

      setFlights(flightsData || [])
      setUploadData(dbData || [])
    } catch (error: any) {
      console.error('Error loading data:', error)
      const errorMessage = error?.message || error?.toString() || 'Failed to load data from database. Please ensure the preview_flights_v3 table exists.'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSuccess = () => {
    loadDataFromDatabase()
  }

  const handleEditSuccess = () => {
    loadDataFromDatabase()
  }

  const handleEdit = (record: UploadData) => {
    setEditRecord(record)
    setShowEditModal(true)
  }

  const removeRow = (index: number) => {
    setDeleteIndex(index)
    setShowDeleteAlert(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteIndex === null) return

    const row = uploadData[deleteIndex]
    
    try {
      if (row.id) {
        const { error } = await (supabase as any)
          .from('preview_flights_v3')
          .delete()
          .eq('id', row.id)

        if (error) {
          console.error('Error deleting record:', error)
          throw new Error(error.message || 'Failed to delete the record')
        }
      }

      const newData = uploadData.filter((_, i) => i !== deleteIndex)
      setUploadData(newData)

      toast({
        title: "Deleted!",
        description: "The record has been deleted.",
      })
    } catch (error: any) {
      console.error('Error deleting record:', error)
      toast({
        title: "Error!",
        description: error?.message || "Failed to delete the record.",
        variant: "destructive"
      })
    } finally {
      setShowDeleteAlert(false)
      setDeleteIndex(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteAlert(false)
    setDeleteIndex(null)
  }

  // Calculate total price for a selected route
  const calculateTotalPrice = (rate: SectorRateV3, selectedRoute: string): number => {
    let total = rate.sector_rate || 0
    
    // If no transit_routes or transit_prices, return sector_rate only
    if (!rate.transit_routes || !rate.transit_prices || rate.transit_routes.length === 0 || rate.transit_prices.length === 0) {
      return total
    }
    
    // Parse the selected route to get transit points
    // Format: "AMS -> ATH -> BER" or "AMS -> ATH -> ARN -> BER"
    const routeParts = selectedRoute.split('->').map(part => part.trim())
    
    // Skip first (origin) and last (destination), get transit points in between
    const transitPoints = routeParts.slice(1, -1)
    
    // For each transit point, find its price
    transitPoints.forEach((transitPoint) => {
      const transitIndex = rate.transit_routes?.indexOf(transitPoint)
      if (transitIndex !== undefined && transitIndex >= 0 && transitIndex < (rate.transit_prices?.length || 0) && rate.transit_prices) {
        const price = rate.transit_prices[transitIndex]
        // Handle both string and number prices
        const priceValue = typeof price === 'string' ? parseFloat(price) : (price || 0)
        if (!isNaN(priceValue)) {
          total += priceValue
        }
      }
    })
    
    return total
  }

  // Generate sector rate options with transit routes
  const generateSectorRateOptions = (): SectorRateOption[] => {
    const options: SectorRateOption[] = []
    
    sectorRates.forEach((rate) => {
      if (rate.selected_routes && rate.selected_routes.length > 0) {
        // If has selected_routes, create one option per route
        rate.selected_routes.forEach((route: string) => {
          const totalPrice = calculateTotalPrice(rate, route)
          const displayText = `€${totalPrice.toFixed(2)} - ${rate.label || 'No Label'} - ${route} - ${rate.customers?.name || 'No Customer'}`
          options.push({
            sectorRateId: rate.id,
            transitRoute: route,
            displayText,
            sectorRate: rate
          })
        })
      } else {
        // If no selected_routes, create one option without transit route
        const basePrice = rate.sector_rate || 0
        const displayText = `${basePrice > 0 ? `€${basePrice.toFixed(2)}` : 'No Rate'} - ${rate.label || 'No Label'} - ${rate.customers?.name || 'No Customer'}`
        options.push({
          sectorRateId: rate.id,
          transitRoute: null,
          displayText,
          sectorRate: rate
        })
      }
    })
    
    return options
  }

  const handleSectorRateChange = async (rowId: string, value: string) => {
    try {
      // Parse value: format is "sector_rate_id|transit_route" or just "sector_rate_id"
      const [sectorRateId, transitRoute] = value.split('|')
      
      const { error } = await (supabase as any)
        .from('preview_flights_v3')
        .update({ 
          sector_rate_id: sectorRateId,
          transit_route: transitRoute || null
        })
        .eq('id', rowId)

      if (error) {
        console.error('Error updating sector rate:', error)
        throw new Error(error.message || 'Failed to update sector rate')
      }

      // Update local state
      const newData = uploadData.map((item) => 
        item.id === rowId ? { 
          ...item, 
          sector_rate_id: sectorRateId,
          transit_route: transitRoute || null
        } : item
      )
      setUploadData(newData)

      toast({
        title: "Updated!",
        description: "Sector rate has been updated.",
      })
    } catch (error: any) {
      console.error('Error updating sector rate:', error)
      toast({
        title: "Error!",
        description: error?.message || "Failed to update sector rate.",
        variant: "destructive"
      })
    }
  }

  const handleCustomerChange = async (rowId: string, customerId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('preview_flights_v3')
        .update({ customer_id: customerId || null })
        .eq('id', rowId)

      if (error) {
        console.error('Error updating customer:', error)
        throw new Error(error.message || 'Failed to update customer')
      }

      // Update local state
      const newData = uploadData.map((item) => 
        item.id === rowId ? { ...item, customer_id: customerId || null } : item
      )
      setUploadData(newData)

      toast({
        title: "Updated!",
        description: "Customer has been updated.",
      })
    } catch (error: any) {
      console.error('Error updating customer:', error)
      toast({
        title: "Error!",
        description: error?.message || "Failed to update customer.",
        variant: "destructive"
      })
    }
  }


  const handleUpload = async () => {
    setIsUploading(true)
    try {
      const validRows = uploadData.filter(row => 
        row.origin.trim() !== "" && row.destination.trim() !== ""
      )

      if (validRows.length === 0) {
        toast({
          title: "No Valid Data",
          description: "Please enter at least origin and destination for one row.",
          variant: "destructive"
        })
        return
      }

      // Save to preview_flights_v3
      const { error } = await (supabase as any)
        .from('preview_flights_v3')
        .upsert(validRows.map(row => ({
          ...(row.id && { id: row.id }),
          origin: row.origin,
          destination: row.destination,
          inbound: row.inbound || null,
          outbound: row.outbound || null,
          sector_rate_id: row.sector_rate_id || null,
          customer_id: row.customer_id || null,
          transit_route: row.transit_route || null
        })), {
          onConflict: 'id'
        })

      if (error) {
        console.error('Error saving data:', error)
        throw new Error(error.message || 'Failed to save data to database')
      }

      await loadDataFromDatabase()

      toast({
        title: "Data Saved",
        description: `${validRows.length} record(s) saved successfully.`,
      })
    } catch (error: any) {
      console.error('Error saving data:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to save data to database. Please ensure the preview_flights_v3 table exists.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="p-1">
            {/* Upload Section */}
            <div className="flex justify-between items-center mb-1 w-[48%]">
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                + Add Record
              </Button>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 w-full flex justify-center items-center">
                <p className="w-full text-center font-bold text-black">Form upload file</p>
                <p className="w-full text-center font-bold text-black">System Generated</p>
                </div>
                <div className="flex justify-between items-center w-full">
                  <div className="w-[48%] border-b border-black"></div>
                  <div className="w-[50%] border-b border-black"></div>
                </div>
                
                {isLoading ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1 min-w-[80px]">Origin</TableHead>
                          <TableHead className="text-xs py-1 min-w-[80px]">Destination</TableHead>
                          <TableHead className="text-xs py-1 min-w-[100px]">Inbound Flight</TableHead>
                          <TableHead className="text-xs py-1 min-w-[100px]">Outbound Flight</TableHead>
                          <TableHead className="text-xs py-1 min-w-[60px]">Actions</TableHead>
                          <TableHead className="border-0 w-8"></TableHead>
                          <TableHead className="text-xs py-1 min-w-[40px] max-w-[45px]">Sector Rate</TableHead>
                          <TableHead className="text-xs py-1 min-w-[40px] max-w-[45px]">Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(3)].map((_, i) => (
                          <TableRow key={i} className="h-8">
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 h-8">
                              <div className="flex gap-0.5">
                                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                            </TableCell>
                            <TableCell className="w-8 border-0"></TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-1 w-[80px]">Origin</TableHead>
                          <TableHead className="text-xs py-1 w-[80px]">Destination</TableHead>
                          <TableHead className="text-xs py-1 w-[100px]">Inbound Flight</TableHead>
                          <TableHead className="text-xs py-1 w-[100px]">Outbound Flight</TableHead>
                          <TableHead className="text-xs py-1 w-[60px]">Actions</TableHead>
                          <TableHead className="border-0 w-8"></TableHead>
                          <TableHead className="text-xs py-1 w-[225px]">Sector Rate</TableHead>
                          <TableHead className="text-xs py-1 w-[225px]">Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadData.map((row, index) => (
                          <TableRow key={row.id || index} className="h-8">
                            <TableCell className="py-1 text-xs h-8">
                              {row.origin}
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              {row.destination}
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <span className={!isFlightValid(row.inbound) ? "text-red-500" : ""}>
                                {row.inbound || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8">
                              <span className={!isFlightValid(row.outbound) ? "text-red-500" : ""}>
                                {row.outbound || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="py-1 h-8">
                              <div className="flex gap-0.5">
                                <Button
                                  onClick={() => handleEdit(row)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => removeRow(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="w-8 border-0"></TableCell>
                            <TableCell className="py-1 text-xs h-8 w-[225px]">
                              <Select 
                                value={row.sector_rate_id && row.transit_route 
                                  ? `${row.sector_rate_id}|${row.transit_route}`
                                  : row.sector_rate_id || ""} 
                                onValueChange={(value) => {
                                  // Parse value: format is "sector_rate_id|transit_route" or just "sector_rate_id"
                                  const [sectorRateId, transitRoute] = value.split('|')
                                  
                                  if (row.id) {
                                    handleSectorRateChange(row.id, value)
                                  } else {
                                    // For new records without ID, update local state only
                                    const newData = uploadData.map((item, i) => 
                                      i === index ? { 
                                        ...item, 
                                        sector_rate_id: sectorRateId,
                                        transit_route: transitRoute || null
                                      } : item
                                    )
                                    setUploadData(newData)
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs px-2 py-1 w-full max-w-full truncate">
                                  <SelectValue placeholder="Select rate..." className="truncate" />
                                </SelectTrigger>
                                <SelectContent>
                                  {generateSectorRateOptions().map((option, optIndex) => {
                                    const value = option.transitRoute 
                                      ? `${option.sectorRateId}|${option.transitRoute}`
                                      : option.sectorRateId
                                    return (
                                      <SelectItem key={`${option.sectorRateId}-${optIndex}`} value={value}>
                                        <div className="flex flex-col text-left">
                                          <span className="font-medium text-sm text-left truncate">
                                            {option.displayText}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-1 text-xs h-8 w-[225px]">
                              <Select 
                                value={row.customer_id || ""} 
                                onValueChange={(value) => {
                                  if (row.id) {
                                    handleCustomerChange(row.id, value)
                                  } else {
                                    // For new records without ID, update local state only
                                    const newData = uploadData.map((item, i) => 
                                      i === index ? { ...item, customer_id: value || null } : item
                                    )
                                    setUploadData(newData)
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs px-2 py-1 w-full max-w-full truncate">
                                  <SelectValue placeholder="Select customer..." className="truncate" />
                                </SelectTrigger>
                                <SelectContent>
                                  {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium text-sm text-left">
                                          {customer.name} ({customer.code})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Flight Upload Modal */}
      <AddFlightUploadModalV3
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Flight Upload Modal */}
      <EditFlightUploadModalV3
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        record={editRecord}
      />

      {/* Sweet Alert for delete confirmation */}
      <SweetAlert
        isVisible={showDeleteAlert}
        title="Are you sure?"
        text="You won't be able to revert this!"
        type="warning"
        showCancelButton={true}
        confirmButtonText="Yes, delete it!"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
