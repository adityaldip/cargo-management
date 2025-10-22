"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { SweetAlert } from "@/components/ui/sweet-alert"
import { AddFlightUploadModal } from "../price-assignment-modules/AddFlightUploadModal"
import { EditFlightUploadModal } from "../price-assignment-modules/EditFlightUploadModal"
import { Edit, Trash2 } from "lucide-react"

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

interface UploadTableV2Props {
  data: UploadData[]
  onDataChange: (data: UploadData[]) => void
}

export function UploadTableV2({ data, onDataChange }: UploadTableV2Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [editRecord, setEditRecord] = useState<UploadData | null>(null)
  const [flights, setFlights] = useState<any[]>([])
  const { toast } = useToast()

  // Extract flight number from inbound/outbound string (e.g., "BT344, DUS → RIX" -> "BT344" or "BT344" -> "BT344")
  const extractFlightNumber = (flightString: string): string => {
    if (!flightString) return ""
    
    // Try to match format with comma first (e.g., "BT344, DUS → RIX")
    let match = flightString.match(/^([A-Z0-9]+),/)
    if (match) return match[1]
    
    // If no comma, try to match just the flight number (e.g., "BT344")
    match = flightString.match(/^([A-Z0-9]+)$/)
    if (match) return match[1]
    
    // If neither pattern matches, return empty string
    return ""
  }

  // Check if flight exists in flights table
  const isFlightValid = (flightString: string): boolean => {
    // If no flight string, consider valid (empty is okay)
    if (!flightString || flightString.trim() === "" || flightString === "-") return true
    
    // If flights data not loaded yet, consider valid (to avoid false positives during loading)
    if (!flights.length) return true
    
    const flightNumber = extractFlightNumber(flightString)
    
    // If can't extract flight number from the string, consider invalid
    if (!flightNumber) {
      console.log(`Invalid flight format: "${flightString}" - cannot extract flight number`)
      return false
    }
    
    const isValid = flights.some(flight => 
      flight.flight_number?.toLowerCase() === flightNumber.toLowerCase()
    )
    
    if (!isValid) {
      console.log(`Flight "${flightNumber}" not found in flights table. Available flights:`, flights.map(f => f.flight_number))
    }
    
    return isValid
  }


  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase()
  }, [])

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
      onDataChange(dbData || [])
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
    // Reload data from database after successful creation
    loadDataFromDatabase()
  }

  const handleEditSuccess = () => {
    // Reload data from database after successful update
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

    const row = data[deleteIndex]
    
    try {
      // If row has an ID, delete from database
      if (row.id) {
        const { error } = await supabase
          .from('preview_flights')
          .delete()
          .eq('id', row.id)

        if (error) throw error
      }

      // Remove from local state
      const newData = data.filter((_, i) => i !== deleteIndex)
      onDataChange(newData)

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

  const handleUpload = async () => {
    setIsUploading(true)
    try {
      // Filter out rows with empty required fields
      const validRows = data.filter(row => 
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

      // Save to database
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

      // Reload data from database
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

  if (isLoading) {
    return (
      <div className="p-1">
        <div className="flex justify-between items-center mb-1">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="text-xs text-gray-500 w-full flex justify-center items-center mb-1">
          <p className="w-full text-center font-bold text-black">Form upload file</p>
        </div>
        <div className="w-full border-b border-black mb-2"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-2">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-1">
          <div className="flex justify-between items-center mb-1">
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
            </div>
            <div className="w-full border-b border-black"></div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-1 min-w-[80px]">Origin</TableHead>
                    <TableHead className="text-xs py-1 min-w-[80px]">Destination</TableHead>
                    <TableHead className="text-xs py-1 min-w-[100px]">Inbound Flight</TableHead>
                    <TableHead className="text-xs py-1 min-w-[100px]">Outbound Flight</TableHead>
                    <TableHead className="text-xs py-1 min-w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
      </div>

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
    </>
  )
}
