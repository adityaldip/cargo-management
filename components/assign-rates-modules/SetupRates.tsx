"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import { useRatesData } from "./hooks"

interface Rate {
  id: string
  name: string
  description?: string
  rate_type: string
  base_rate: number
  currency: string
  multiplier: number
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function SetupRates() {
  const {
    rates,
    loading,
    error,
    isRefreshing,
    setError,
    refetch,
    updateRate,
    createRate
  } = useRatesData()
  
  
  // Rate management state
  const [isCreateRateModalOpen, setIsCreateRateModalOpen] = useState(false)
  const [isCreatingRate, setIsCreatingRate] = useState(false)
  const [newRateData, setNewRateData] = useState({
    name: '',
    description: '',
    rate_type: 'fixed',
    base_rate: 0,
    currency: 'EUR',
    multiplier: 1.0,
    tags: [] as string[],
    is_active: true
  })


  const handleCreateRate = async () => {
    if (!newRateData.name.trim()) {
      setError('Rate name is required')
      return
    }

    try {
      setIsCreatingRate(true)
      setError(null)
      
      const result = await createRate(newRateData)
      
      if (!result.success) {
        setError(result.error || 'Failed to create rate')
        return
      }

      // Reset form and close modal
      setNewRateData({
        name: '',
        description: '',
        rate_type: 'fixed',
        base_rate: 0,
        currency: 'EUR',
        multiplier: 1.0,
        tags: [],
        is_active: true
      })
      setIsCreateRateModalOpen(false)
    } catch (err) {
      const errorMsg = `Failed to create rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
    } finally {
      setIsCreatingRate(false)
    }
  }

  const toggleRateActive = async (rateId: string) => {
    const rate = rates.find(r => r.id === rateId)
    if (rate) {
      await updateRate(rateId, { is_active: !rate.is_active })
    }
  }

  const updateRateName = async (rateId: string, name: string) => {
    await updateRate(rateId, { name })
  }


  // Show loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Manage Rates</CardTitle>
            <p className="text-sm text-gray-600">
              Create and manage rate configurations
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-1 p-1 border border-gray-200 rounded-lg animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-black">
                Manage Rates
              </CardTitle>
              <p className="text-sm text-gray-600">
                Create and manage rate configurations
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateRateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Rates List */}
            <div className="space-y-1">
              {rates.filter(rate => rate && rate.id).map((rate, index) => (
                <div 
                  key={rate.id} 
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-md transition-all hover:bg-gray-50"
                >
                  {/* Rate Type Badge */}
                  {/* <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    {rate.rate_type?.charAt(0).toUpperCase() || 'F'}
                  </div> */}

                  {/* Active Switch */}
                  <div className="flex items-center">
                    <Switch
                      checked={rate.is_active}
                      onCheckedChange={() => toggleRateActive(rate.id)}
                      className="scale-75"
                    />
                  </div>

                  {/* Rate Name Input */}
                  <div className="flex-1">
                    <Input
                      value={rate.name}
                      onChange={(e) => updateRateName(rate.id, e.target.value)}
                      className="text-sm h-8"
                      placeholder="Rate name"
                    />
                  </div>

                  {/* Rate Info */}
                  <div className="text-right min-w-16">
                    <p className="text-xs font-medium text-black">
                      {rate.currency || 'EUR'} {(rate.base_rate || 0).toFixed(2)}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Rate Modal */}
      <Dialog open={isCreateRateModalOpen} onOpenChange={setIsCreateRateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rate-name">Rate Name *</Label>
              <Input
                id="rate-name"
                value={newRateData.name}
                onChange={(e) => setNewRateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rate name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="rate-description">Description</Label>
              <Input
                id="rate-description"
                value={newRateData.description}
                onChange={(e) => setNewRateData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate-type">Rate Type</Label>
                <Select 
                  value={newRateData.rate_type} 
                  onValueChange={(value) => setNewRateData(prev => ({ ...prev, rate_type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="per_kg">Per KG</SelectItem>
                    <SelectItem value="per_item">Per Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={newRateData.currency} 
                  onValueChange={(value) => setNewRateData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base-rate">Base Rate</Label>
                <Input
                  id="base-rate"
                  type="number"
                  step="0.01"
                  value={newRateData.base_rate}
                  onChange={(e) => setNewRateData(prev => ({ ...prev, base_rate: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="multiplier">Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  step="0.01"
                  value={newRateData.multiplier}
                  onChange={(e) => setNewRateData(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1.0 }))}
                  placeholder="1.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={newRateData.is_active}
                onCheckedChange={(checked) => setNewRateData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateRateModalOpen(false)}
                disabled={isCreatingRate}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRate}
                disabled={isCreatingRate || !newRateData.name.trim()}
              >
                {isCreatingRate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Rate'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
