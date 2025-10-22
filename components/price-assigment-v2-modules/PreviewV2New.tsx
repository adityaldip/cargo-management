"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { AddFlightUploadModal } from "../price-assignment-modules/AddFlightUploadModal"
import { EditFlightUploadModal } from "../price-assignment-modules/EditFlightUploadModal"
import { Edit } from "lucide-react"
import { SweetAlert } from "@/components/ui/sweet-alert"

interface SectorRateV2 {
  id: string
  text_label: string | null
  origin_airport: string[] | null
  airbaltic_origin: string[] | null
  sector_rate: string | null
  airbaltic_destination: string[] | null
  final_destination: string[] | null
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

interface UploadData {
  id?: string
  origin: string
  destination: string
  inbound: string
  outbound: string
  sector_rate_id?: string
  created_at?: string
  updated_at?: string
}

interface GeneratedData {
  id: string
  origin: string
  beforeBT: string
  inbound: string
  outbound: string
  afterBT: string
  destination: string
  selectedSectorRate: SectorRateV2 | null
  created_at?: string
  updated_at?: string
}

export function PreviewV2New() {
  const { toast } = useToast()
  const [uploadData, setUploadData] = useState<UploadData[]>([])
  const [sectorRates, setSectorRates] = useState<SectorRateV2[]>([])
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

  // Load data from database
  useEffect(() => {
    fetchSectorRates()
    loadDataFromDatabase()
  }, [refreshTrigger])


  const fetchSectorRates = async () => {
    try {
      setLoading(true)
      
      // Get sector rates first
      const { data: sectorRatesData, error: sectorRatesError } = await (supabase as any)
        .from('sector_rates_v2')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (sectorRatesError) throw sectorRatesError

      // Get all customers
      const { data: customersData, error: customersError } = await (supabase as any)
        .from('customers')
        .select('id, name, code')

      if (customersError) throw customersError

      // Merge the data manually
      const mergedData = sectorRatesData?.map((rate: any) => ({
        ...rate,
        customers: customersData?.find((customer: any) => customer.id === rate.customer_id) || null
      })) || []

      setSectorRates(mergedData)
    } catch (error) {
      console.error('Error fetching sector rates:', error)
    } finally {
      setLoading(false)
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
      // Load preview flights data
      const { data: dbData, error } = await supabase
        .from('preview_flights')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load flights data for validation
      const { data: flightsData, error: flightsError } = await supabase
        .from('flights')
        .select('*')
        .eq('is_active', true)

      if (flightsError) throw flightsError

      setFlights(flightsData || [])
      setUploadData(dbData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load data from database.",
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
        const { error } = await supabase
          .from('preview_flights')
          .delete()
          .eq('id', row.id)

        if (error) throw error
      }

      const newData = uploadData.filter((_, i) => i !== deleteIndex)
      setUploadData(newData)

      toast({
        title: "Deleted!",
        description: "The record has been deleted.",
      })
    } catch (error) {
      console.error('Error deleting record:', error)
      toast({
        title: "Error!",
        description: "Failed to delete the record.",
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

  const handleSectorRateChange = async (rowId: string, sectorRateId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('preview_flights')
        .update({ sector_rate_id: sectorRateId })
        .eq('id', rowId)

      if (error) throw error

      // Update local state
      const newData = uploadData.map((item) => 
        item.id === rowId ? { ...item, sector_rate_id: sectorRateId } : item
      )
      setUploadData(newData)

      toast({
        title: "Updated!",
        description: "Sector rate has been updated.",
      })
    } catch (error) {
      console.error('Error updating sector rate:', error)
      toast({
        title: "Error!",
        description: "Failed to update sector rate.",
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

      const { error } = await (supabase as any)
        .from('preview_flights')
        .upsert(validRows.map(row => ({
          ...(row.id && { id: row.id }),
          origin: row.origin,
          destination: row.destination,
          inbound: row.inbound || null,
          outbound: row.outbound || null,
          sector_rate_id: row.sector_rate_id || null
        })), {
          onConflict: 'id'
        })

      if (error) throw error

      await loadDataFromDatabase()

      toast({
        title: "Data Saved",
        description: `${validRows.length} record(s) saved successfully.`,
      })
    } catch (error) {
      console.error('Error saving data:', error)
      toast({
        title: "Error",
        description: "Failed to save data to database.",
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
                        <TableHead className="text-xs py-1 w-[50%]">Sector Rate</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
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
                        <TableHead className="text-xs py-1 w-[50%]">Sector Rate</TableHead>
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
                          <TableCell className="py-1 text-xs h-8">
                            <Select 
                              value={row.sector_rate_id || ""} 
                              onValueChange={(value) => {
                                if (row.id) {
                                  handleSectorRateChange(row.id, value)
                                } else {
                                  // For new records without ID, update local state only
                                  const newData = uploadData.map((item, i) => 
                                    i === index ? { ...item, sector_rate_id: value } : item
                                  )
                                  setUploadData(newData)
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs px-2 py-1">
                                <SelectValue placeholder="Select rate..." />
                              </SelectTrigger>
                              <SelectContent>
                                {sectorRates.map((rate) => (
                                  <SelectItem key={rate.id} value={rate.id}>
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium text-sm text-left">
                                        {rate.sector_rate || 'No Rate'} - {rate.text_label || 'No Label'}
                                      </span>
                                      <span className="text-xs text-gray-500 text-left">
                                        Customer: {rate.customers?.name || 'No Customer'}
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
      <AddFlightUploadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Flight Upload Modal */}
      <EditFlightUploadModal
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
