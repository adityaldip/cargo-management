"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Settings,
  AlertTriangle
} from "lucide-react"
import { ratesAPI } from "@/lib/api-client"

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

export function ManageRates() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)

  const fetchRates = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const { data: ratesData, error: fetchError } = await ratesAPI.getAll()

      if (fetchError) {
        setError(fetchError)
        return
      }

      if (ratesData) {
        setRates(ratesData)
      }
    } catch (err) {
      setError(`Failed to fetch rates: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleCreateRate = async (rateData: Partial<Rate>) => {
    try {
      setError(null)
      const { data, error } = await ratesAPI.create(rateData)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      await fetchRates(true)
      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to create rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const handleUpdateRate = async (rateId: string, updates: Partial<Rate>) => {
    try {
      setError(null)
      const { data, error } = await ratesAPI.update(rateId, updates)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      await fetchRates(true)
      return { success: true, data }
    } catch (err) {
      const errorMsg = `Failed to update rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const handleDeleteRate = async (rateId: string) => {
    try {
      setError(null)
      const { error } = await ratesAPI.delete(rateId)
      
      if (error) {
        setError(error)
        return { success: false, error }
      }

      await fetchRates(true)
      return { success: true }
    } catch (err) {
      const errorMsg = `Failed to delete rate: ${err instanceof Error ? err.message : 'Unknown error'}`
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  const toggleRateActive = async (rateId: string) => {
    const rate = rates.find(r => r.id === rateId)
    if (rate) {
      await handleUpdateRate(rateId, { is_active: !rate.is_active })
    }
  }

  useEffect(() => {
    fetchRates()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Manage Rates</CardTitle>
            <p className="text-sm text-gray-600">
              Create and manage rate definitions
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-3 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    <div className="w-8 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
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
              <CardTitle className="text-black flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Manage Rates
              </CardTitle>
              <p className="text-sm text-gray-600">
                Create and manage rate definitions for your cargo system
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Rate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchRates(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rates.map((rate) => (
              <div 
                key={rate.id} 
                className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg transition-all ${
                  rate.is_active ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {/* Active Switch */}
                <Switch
                  checked={rate.is_active}
                  onCheckedChange={() => toggleRateActive(rate.id)}
                  className="scale-75"
                />

                {/* Rate Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-black text-sm">{rate.name}</h3>
                  {rate.description && (
                    <p className="text-xs text-gray-600 mt-1">{rate.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {rate.rate_type}
                    </Badge>
                    {rate.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rate Value */}
                <div className="text-right min-w-20">
                  <p className="text-sm font-medium text-black">
                    {rate.currency} {rate.base_rate.toFixed(2)}
                    {rate.rate_type === "per_kg" && "/kg"}
                  </p>
                  {rate.multiplier !== 1.0 && (
                    <p className="text-xs text-gray-500">
                      ×{rate.multiplier}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingRate(rate)}
                    className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete "${rate.name}"? This action cannot be undone.`)) {
                        const result = await handleDeleteRate(rate.id)
                        if (!result.success) {
                          alert(`Failed to delete rate: ${result.error}`)
                        }
                      }
                    }}
                    className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {rates.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No rates found. Create your first rate to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Rate Modal would go here */}
      {/* You can create a separate CreateRateModal component similar to CreateRateRuleModal */}
    </div>
  )
}
