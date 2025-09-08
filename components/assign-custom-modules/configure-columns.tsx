"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, Eye, Loader2 } from "lucide-react"
import { useColumnConfigStore, type ColumnConfig } from "@/store/column-config-store"


interface ConfigureColumnsProps {
  onSwitchToPreview: () => void
}


export function ConfigureColumns({ onSwitchToPreview }: ConfigureColumnsProps) {
  // Use Zustand store for column configurations
  const { columnConfigs, setColumnConfigs, updateColumnConfig, resetToDefault } = useColumnConfigStore()
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [isConfigLoading, setIsConfigLoading] = useState(false)

  // Save column configurations using Zustand store
  const saveColumnConfigs = (configs: ColumnConfig[]) => {
    setColumnConfigs(configs)
  }

  const updateColumnLabel = (key: string, label: string) => {
    updateColumnConfig(key, { label })
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault()
    
    if (!draggedColumn || draggedColumn === targetColumnKey) return

    const draggedIndex = columnConfigs.findIndex(c => c.key === draggedColumn)
    const targetIndex = columnConfigs.findIndex(c => c.key === targetColumnKey)
    
    const newConfigs = [...columnConfigs]
    const [draggedItem] = newConfigs.splice(draggedIndex, 1)
    newConfigs.splice(targetIndex, 0, draggedItem)
    
    // Update order values based on new positions
    const updatedConfigs = newConfigs.map((config, index) => ({
      ...config,
      order: index + 1
    }))
    
    setColumnConfigs(updatedConfigs)
    saveColumnConfigs(updatedConfigs)
    setDraggedColumn(null)
  }

  // Handle tab change with loading state
  useEffect(() => {
    setIsConfigLoading(true)
    const timer = setTimeout(() => {
      setIsConfigLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white border-gray-200 shadow-sm" style={{ padding:"12px 0px 12px 0px" }}>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-black">Configure Columns</CardTitle>
                <p className="text-sm text-gray-600">
                  Drag to reorder, edit labels
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onSwitchToPreview}
                  disabled={isConfigLoading}
                >
                  {isConfigLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Review Data
                </Button>
              </div>
            </div>
            {/* Column Configuration List */}
            {isConfigLoading ? (
              <div className="space-y-1">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border border-gray-200 rounded-md">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {columnConfigs.map((config, index) => (
                  <div 
                    key={config.key} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, config.key)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, config.key)}
                    className={`flex items-center gap-3 p-2 border border-gray-200 rounded-md transition-all cursor-pointer hover:bg-gray-50 hover:border-gray-300 ${draggedColumn === config.key ? 'opacity-50 bg-blue-50' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab hover:cursor-grabbing flex-shrink-0">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    {/* Column Label Input */}
                    <div className="flex-1">
                      <Input
                        value={config.label}
                        onChange={(e) => updateColumnLabel(config.key, e.target.value)}
                        className="text-sm h-8"
                        placeholder="Column label"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
