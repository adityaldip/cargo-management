"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ErrorBanner } from "@/components/ui/status-banner"
import { AirportCode } from "./types"

interface AirportCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (airportData: any) => void
  selectedAirport: AirportCode | null
  airportForm: {
    code: string
    isEU: boolean
  }
  setAirportForm: (form: any) => void
  isCreating: boolean
  error: string | null
}

export function AirportCodeModal({
  isOpen,
  onClose,
  onSave,
  selectedAirport,
  airportForm,
  setAirportForm,
  isCreating,
  error
}: AirportCodeModalProps) {
  const handleSave = () => {
    if (!airportForm.code.trim()) {
      return
    }
    onSave(airportForm)
  }

  const handleClose = () => {
    setAirportForm({
      code: "",
      isEU: false
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedAirport ? "Edit Airport Code" : "Add New Airport Code"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <ErrorBanner 
            message={error}
            className="mb-4"
            onClose={() => {}}
          />
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Airport Code *</Label>
            <Input
              id="code"
              value={airportForm.code}
              onChange={(e) => setAirportForm({ ...airportForm, code: e.target.value })}
              placeholder="e.g., JFK"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isEU"
              checked={airportForm.isEU}
              onCheckedChange={(checked) => setAirportForm({ ...airportForm, isEU: checked })}
            />
            <Label htmlFor="isEU">EU Airport</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating || !airportForm.code.trim()}>
            {isCreating ? "Saving..." : selectedAirport ? "Update" : "Add Airport"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
