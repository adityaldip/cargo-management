"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ColumnConfig } from "@/store/column-config-store"

export interface DisplayFieldsPopupProps {
  isOpen: boolean
  onClose: () => void
  onApply: (configs: ColumnConfig[]) => void
  columnConfigs: ColumnConfig[]
  title?: string
}

export function DisplayFieldsPopup({
  isOpen,
  onClose,
  onApply,
  columnConfigs,
  title = "Display Fields"
}: DisplayFieldsPopupProps) {
  const [configs, setConfigs] = useState<ColumnConfig[]>(columnConfigs)
  const popupRef = useRef<HTMLDivElement>(null)

  // Update local state when columnConfigs prop changes
  useEffect(() => {
    setConfigs(columnConfigs)
  }, [columnConfigs])

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Don't close if clicking inside the popup
      if (popupRef.current && popupRef.current.contains(target)) {
        return
      }
      
      // Close the popup if clicking outside
      onClose()
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const toggleFieldVisibility = (key: string) => {
    const newConfigs = configs.map(config => 
      config.key === key ? { ...config, visible: !config.visible } : config
    )
    setConfigs(newConfigs)
    // Apply changes immediately
    onApply(newConfigs)
  }

  const selectAll = () => {
    const newConfigs = configs.map(config => ({ ...config, visible: true }))
    setConfigs(newConfigs)
    onApply(newConfigs)
  }

  const deselectAll = () => {
    const newConfigs = configs.map(config => ({ ...config, visible: false }))
    setConfigs(newConfigs)
    onApply(newConfigs)
  }


  const handleReset = () => {
    setConfigs(columnConfigs)
  }

  const visibleCount = configs.filter(config => config.visible).length
  const totalCount = configs.length

  if (!isOpen) return null

  return (
    <div ref={popupRef} className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-96 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        <div className="space-y-2">
          {/* Select All / Deselect All */}
          <div className="flex gap-2 pb-2 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-6 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              className="h-6 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              Deselect All
            </Button>
          </div>

          {/* Field List */}
          <div className="flex flex-wrap gap-2">
            {configs.map((config) => (
              <Button
                key={config.key}
                variant="outline"
                onClick={() => toggleFieldVisibility(config.key)}
                className={cn(
                  "h-8 text-xs font-normal transition-all duration-200 hover:scale-105 px-3",
                  config.visible 
                    ? "bg-black text-white border-black hover:bg-gray-800 hover:border-gray-800 hover:text-white" 
                    : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 hover:border-gray-400"
                )}
              >
                {config.label}
              </Button>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-600">
              {visibleCount} of {totalCount} fields selected
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-6 px-3 text-xs"
        >
          Close
        </Button>
      </div>
    </div>
  )
}
