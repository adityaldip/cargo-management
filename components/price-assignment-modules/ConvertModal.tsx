"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface ConvertModalProps {
  isOpen: boolean
  onClose: () => void
  origin: string
}

export function ConvertModal({ isOpen, onClose, origin }: ConvertModalProps) {
  const [formData, setFormData] = useState({
    origin: origin,
    beforeBTFrom: "FRA",
    beforeBTTo: "DUS",
    inbound: "BT 344, FRA → DUS",
    outbound: "BT435, DUS → MAD",
    afterBTFrom: "FRA",
    afterBTTo: "DUS",
    destination: "DUS",
    appliedRate: "DUS → LGW, €3.00"
  })

  const handleUpdate = () => {
    console.log('Update Record clicked with data:', formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm">Convert raw data into separate routes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2">
          {/* Origin */}
          <div>
            <label className="text-xs font-medium mb-1 block">Origin</label>
            <Select value={formData.origin} onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRA">FRA</SelectItem>
                <SelectItem value="DUS">DUS</SelectItem>
                <SelectItem value="MAD">MAD</SelectItem>
                <SelectItem value="LGW">LGW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Before BT */}
          <div>
            <label className="text-xs font-medium mb-1 block">Before BT</label>
            <div className="flex items-center gap-1">
              <Select value={formData.beforeBTFrom} onValueChange={(value) => setFormData(prev => ({ ...prev, beforeBTFrom: value }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRA">FRA</SelectItem>
                  <SelectItem value="DUS">DUS</SelectItem>
                  <SelectItem value="MAD">MAD</SelectItem>
                  <SelectItem value="LGW">LGW</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">to</span>
              <Select value={formData.beforeBTTo} onValueChange={(value) => setFormData(prev => ({ ...prev, beforeBTTo: value }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRA">FRA</SelectItem>
                  <SelectItem value="DUS">DUS</SelectItem>
                  <SelectItem value="MAD">MAD</SelectItem>
                  <SelectItem value="LGW">LGW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inbound */}
          <div>
            <label className="text-xs font-medium mb-1 block">Inbound</label>
            <Select value={formData.inbound} onValueChange={(value) => setFormData(prev => ({ ...prev, inbound: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BT 344, FRA → DUS">BT 344, FRA → DUS</SelectItem>
                <SelectItem value="BT 234, DUS → RIX">BT 234, DUS → RIX</SelectItem>
                <SelectItem value="BT 421, RMO → RIX">BT 421, RMO → RIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Outbound */}
          <div>
            <label className="text-xs font-medium mb-1 block">Outbound</label>
            <Select value={formData.outbound} onValueChange={(value) => setFormData(prev => ({ ...prev, outbound: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BT435, DUS → MAD">BT435, DUS → MAD</SelectItem>
                <SelectItem value="BT651, RIX → LGW">BT651, RIX → LGW</SelectItem>
                <SelectItem value="BT965, VNO → CDG">BT965, VNO → CDG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* After BT */}
          <div>
            <label className="text-xs font-medium mb-1 block">After BT</label>
            <div className="flex items-center gap-1">
              <Select value={formData.afterBTFrom} onValueChange={(value) => setFormData(prev => ({ ...prev, afterBTFrom: value }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRA">FRA</SelectItem>
                  <SelectItem value="DUS">DUS</SelectItem>
                  <SelectItem value="MAD">MAD</SelectItem>
                  <SelectItem value="LGW">LGW</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">to</span>
              <Select value={formData.afterBTTo} onValueChange={(value) => setFormData(prev => ({ ...prev, afterBTTo: value }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRA">FRA</SelectItem>
                  <SelectItem value="DUS">DUS</SelectItem>
                  <SelectItem value="MAD">MAD</SelectItem>
                  <SelectItem value="LGW">LGW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-medium mb-1 block">Destination</label>
            <Select value={formData.destination} onValueChange={(value) => setFormData(prev => ({ ...prev, destination: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUS">DUS</SelectItem>
                <SelectItem value="FRA">FRA</SelectItem>
                <SelectItem value="MAD">MAD</SelectItem>
                <SelectItem value="LGW">LGW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Applied Rate */}
          <div>
            <label className="text-xs font-medium mb-1 block">Applied Rate</label>
            <Select value={formData.appliedRate} onValueChange={(value) => setFormData(prev => ({ ...prev, appliedRate: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUS → LGW, €3.00">DUS → LGW, €3.00</SelectItem>
                <SelectItem value="FRA → DUS, €2.50">FRA → DUS, €2.50</SelectItem>
                <SelectItem value="MAD → LGW, €4.00">MAD → LGW, €4.00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-1 pt-2">
          <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            size="sm"
            className="h-7 text-xs px-3 bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={handleUpdate}
          >
            Update Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
