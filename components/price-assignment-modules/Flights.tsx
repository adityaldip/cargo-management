"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorBanner } from "@/components/ui/status-banner"
import { 
  Plane, 
  Plus,
  RefreshCw,
  Edit,
  Trash2
} from "lucide-react"
import { Flight } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { SweetAlert } from "@/components/ui/sweet-alert"
import { useFlightData } from "./hooks"
import { FlightModal } from "./FlightModal"
import { FlightTable } from "./FlightTable"

export function Flights() {
  const { toast } = useToast()
  const {
    flights,
    loading,
    error,
    setError,
    toggleFlight,
    deleteFlight,
    createFlight,
    updateFlight,
    refetch
  } = useFlightData()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [flightSearchTerm, setFlightSearchTerm] = useState("")
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [isFlightEditorOpen, setIsFlightEditorOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState<Set<string>>(new Set())
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [flightToDelete, setFlightToDelete] = useState<Flight | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // New flight form state
  const [newFlightForm, setNewFlightForm] = useState({
    flightNumber: "",
    origin: "",
    destination: "",
    originAirportId: "",
    destinationAirportId: "",
    status: "scheduled"
  })

  // Remove the filteredFlights logic as it's now handled in FlightTable

  const handleToggleFlight = async (flightId: string) => {
    // Prevent multiple toggles on the same flight
    if (togglingStatus.has(flightId)) {
      return
    }

    try {
      // Add to toggling set
      setTogglingStatus(prev => new Set(prev).add(flightId))
      setError(null)
      
      const flight = flights.find(f => f.id === flightId)
      await toggleFlight(flightId)
      
      toast({
        title: "Status Updated",
        description: `Flight ${flight?.flightNumber} is now ${flight?.is_active ? 'inactive' : 'active'}`,
      })
    } catch (err) {
      const errorMsg = `Failed to toggle flight: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      // Remove from toggling set
      setTogglingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(flightId)
        return newSet
      })
    }
  }

  const handleEditFlight = (flight: Flight) => {
    setSelectedFlight(flight)
    setIsFlightEditorOpen(true)
  }

  const handleDeleteFlight = (flight: Flight) => {
    setFlightToDelete(flight)
    setShowDeleteAlert(true)
  }

  const confirmDeleteFlight = async () => {
    if (!flightToDelete) return

    setIsDeleting(true)
    try {
      await deleteFlight(flightToDelete.id)
      
      toast({
        title: "Flight Deleted",
        description: `Flight ${flightToDelete.flightNumber} has been deleted`,
      })
    } catch (err) {
      const errorMsg = `Failed to delete flight: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
      setFlightToDelete(null)
    }
  }

  const handleSaveFlight = async (flightData: any) => {
    if (!flightData.flightNumber.trim() || !flightData.originAirportId || !flightData.destinationAirportId) {
      setError('Please fill in all required fields')
      return
    }

    // Check for duplicate flight number before creating
    if (!selectedFlight) {
      const existingFlight = flights.find(flight => 
        flight.flightNumber.toLowerCase() === flightData.flightNumber.trim().toLowerCase()
      )
      if (existingFlight) {
        setError(`Flight number "${flightData.flightNumber}" already exists. Please choose a different flight number.`)
        toast({
          title: "Duplicate Flight Number",
          description: `Flight "${flightData.flightNumber}" already exists. Please use a different flight number.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsCreating(true)
    setError(null)

    try {
      const isEditing = selectedFlight !== null
      
      if (isEditing) {
        // Update existing flight
        const result = await updateFlight(selectedFlight.id, {
          flight_number: flightData.flightNumber.trim(),
          origin: flightData.origin.trim(),
          destination: flightData.destination.trim(),
          origin_airport_id: flightData.originAirportId,
          destination_airport_id: flightData.destinationAirportId,
          status: flightData.status
        })
        
        if (result?.success) {
          handleCloseModal()
          toast({
            title: "Flight Updated",
            description: `Flight ${flightData.flightNumber} has been updated successfully`,
          })
        } else {
          const errorMessage = result?.error || 'Failed to update flight'
          setError(errorMessage)
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } else {
        // Create new flight
        const result = await createFlight({
          flight_number: flightData.flightNumber.trim(),
          origin: flightData.origin.trim(),
          destination: flightData.destination.trim(),
          origin_airport_id: flightData.originAirportId,
          destination_airport_id: flightData.destinationAirportId,
          status: flightData.status
        })
        
        if (result?.success) {
          handleCloseModal()
          toast({
            title: "Flight Created",
            description: `Flight ${flightData.flightNumber} has been created successfully`,
          })
        } else {
          const errorMessage = result?.error || 'Failed to create flight'
          setError(errorMessage)
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error('Error saving flight:', err)
      let errorMessage = 'Failed to save flight'
      
      // Handle specific database errors
      if (err instanceof Error) {
        if (err.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = `Flight number "${flightData.flightNumber}" already exists. Please choose a different flight number.`
        } else if (err.message.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid airport selection. Please check your origin and destination airports.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateNewFlight = () => {
    setSelectedFlight(null)
    setNewFlightForm({
      flightNumber: "",
      origin: "",
      destination: "",
      originAirportId: "",
      destinationAirportId: "",
      status: "scheduled"
    })
    setIsFlightEditorOpen(true)
  }

  const handleCloseModal = () => {
    setNewFlightForm({
      flightNumber: "",
      origin: "",
      destination: "",
      originAirportId: "",
      destinationAirportId: "",
      status: "scheduled"
    })
    setSelectedFlight(null)
    setIsFlightEditorOpen(false)
    setError(null)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  if (loading) {
  return (
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Error Display */}
      {error && (
        <ErrorBanner
          message={error}
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {/* Flight Management */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent>
          <div className="flex items-center justify-between pb-2">
            <CardTitle className="text-black flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNewFlight}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="h-8 w-auto min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Flights Table */}
          <FlightTable
            flights={flights}
            loading={loading}
            flightSearchTerm={flightSearchTerm}
            setFlightSearchTerm={setFlightSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            togglingStatus={togglingStatus}
            onToggleFlight={handleToggleFlight}
            onEditFlight={handleEditFlight}
            onDeleteFlight={handleDeleteFlight}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </CardContent>
      </Card>

      {/* Flight Modal */}
      <FlightModal
        isOpen={isFlightEditorOpen}
        onClose={handleCloseModal}
        onSave={handleSaveFlight}
        selectedFlight={selectedFlight}
        flightForm={newFlightForm}
        setFlightForm={setNewFlightForm}
        isCreating={isCreating}
        error={error}
        existingFlights={flights}
      />

      {/* Sweet Alert for Delete Confirmation */}
      <SweetAlert
        isVisible={showDeleteAlert}
        title="Delete Flight"
        text={`Are you sure you want to delete flight "${flightToDelete?.flightNumber}"? This action cannot be undone.`}
        type="warning"
        showCancelButton={true}
        confirmButtonText="Yes, Delete!"
        cancelButtonText="Cancel"
        onConfirm={confirmDeleteFlight}
        onCancel={() => {
          setShowDeleteAlert(false)
          setFlightToDelete(null)
        }}
        onClose={() => {
          setShowDeleteAlert(false)
          setFlightToDelete(null)
        }}
        disabled={isDeleting}
      />
    </div>
  )
}
