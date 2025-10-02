"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { X } from "lucide-react"

interface EditFlightUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  record: {
    id?: string
    origin: string
    destination: string
    inbound: string
    outbound: string
  } | null
}

interface FlightUploadForm {
  origin: string
  destination: string
  inbound: string
  outbound: string
}

export function EditFlightUploadModal({ isOpen, onClose, onSuccess, record }: EditFlightUploadModalProps) {
  const [formData, setFormData] = useState<FlightUploadForm>({
    origin: "",
    destination: "",
    inbound: "",
    outbound: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Populate form when record changes
  useEffect(() => {
    if (record) {
      setFormData({
        origin: record.origin || "",
        destination: record.destination || "",
        inbound: record.inbound || "",
        outbound: record.outbound || ""
      })
    }
  }, [record])

  const handleInputChange = (field: keyof FlightUploadForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!record?.id) {
      toast({
        title: "Error",
        description: "No record ID found for editing.",
        variant: "destructive"
      })
      return
    }
    
    // Validate required fields
    if (!formData.origin.trim() || !formData.destination.trim()) {
      toast({
        title: "Validation Error",
        description: "Origin and Destination are required fields.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('flight_uploads')
        .update({
          origin: formData.origin.trim(),
          destination: formData.destination.trim(),
          inbound: formData.inbound.trim() || null,
          outbound: formData.outbound.trim() || null
        })
        .eq('id', record.id)

      if (error) throw error

      toast({
        title: "Success!",
        description: "Flight upload record has been updated successfully.",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating flight upload:', error)
      toast({
        title: "Error",
        description: "Failed to update flight upload record.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen || !record) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Edit Flight Upload</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-sm font-medium">
                Origin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                placeholder="Enter origin"
                required
                disabled={isSubmitting}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium">
                Destination <span className="text-red-500">*</span>
              </Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="Enter destination"
                required
                disabled={isSubmitting}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inbound" className="text-sm font-medium">
                Inbound Flight
              </Label>
              <Input
                id="inbound"
                value={formData.inbound}
                onChange={(e) => handleInputChange('inbound', e.target.value)}
                placeholder="Enter inbound flight"
                disabled={isSubmitting}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outbound" className="text-sm font-medium">
                Outbound Flight
              </Label>
              <Input
                id="outbound"
                value={formData.outbound}
                onChange={(e) => handleInputChange('outbound', e.target.value)}
                placeholder="Enter outbound flight"
                disabled={isSubmitting}
                className="h-9"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Record"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
