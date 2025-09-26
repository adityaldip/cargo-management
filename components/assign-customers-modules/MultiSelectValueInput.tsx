"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectValueInputProps {
  condition: {
    field: string
    operator: string
    value: string
  }
  index: number
  onUpdateCondition: (index: number, updates: Partial<{ field: string; operator: string; value: string }>) => void
  isExecutingRules?: boolean
  className?: string
}

export function MultiSelectValueInput({ 
  condition, 
  index, 
  onUpdateCondition, 
  isExecutingRules = false,
  className = "h-7 text-xs border-gray-200 flex-1 min-w-20"
}: MultiSelectValueInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [availableOptions, setAvailableOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [hasMoreData, setHasMoreData] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  
  // Cache for field values to avoid refetching
  const fieldValuesCache = React.useRef<Record<string, string[]>>({})
  
  // Parse current values (comma-separated string to array)
  const currentValues = condition.value ? condition.value.split(',').map(v => v.trim()).filter(Boolean) : []
  
  // Fetch options when field changes
  const fetchFieldValues = async (field: string) => {
    if (!field) return
    
    // Check cache first
    if (fieldValuesCache.current[field]) {
      console.log('Using cached values for field:', field)
      setAvailableOptions(fieldValuesCache.current[field])
      return
    }
    
    setIsLoading(true)
    setLoadingProgress(0)
    
    try {
      console.log('Fetching field values for:', field)
      
      // Show progress indicator
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const response = await fetch(`/api/cargo-data/field-values?field=${encodeURIComponent(field)}`)
      
      clearInterval(progressInterval)
      setLoadingProgress(100)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Field values response:', data)
        const values = data.values || []
        setAvailableOptions(values)
        
        // Log additional info about the dataset
        if (data.totalCount) {
          console.log(`Total records in database: ${data.totalCount}`)
          setTotalCount(data.totalCount)
        }
        if (data.totalFetched && data.pagesFetched) {
          console.log(`Fetched ${data.totalFetched} records across ${data.pagesFetched} pages`)
        }
        if (data.totalFetched && data.totalCount && data.totalFetched < data.totalCount) {
          console.warn('⚠️ Not all records fetched - pagination may be incomplete')
          setHasMoreData(true)
        } else {
          setHasMoreData(false)
        }
        
        // Cache the values
        fieldValuesCache.current[field] = values
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch field values:', response.status, response.statusText, errorData)
        setAvailableOptions([])
      }
    } catch (error) {
      console.error('Error fetching field values:', error)
      setAvailableOptions([])
    } finally {
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }
  
  // Fetch values when field changes
  React.useEffect(() => {
    if (condition.field) {
      fetchFieldValues(condition.field)
    }
  }, [condition.field])
  
  const filteredOptions = availableOptions.filter(option => 
    option.toLowerCase().includes(searchValue.toLowerCase())
  )
  
  const handleToggleValue = (value: string) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    onUpdateCondition(index, { value: newValues.join(', ') })
  }
  
  const handleRemoveValue = (value: string) => {
    const newValues = currentValues.filter(v => v !== value)
    onUpdateCondition(index, { value: newValues.join(', ') })
  }
  
  // If no field selected or no options available, show regular input
  if (!condition.field || (availableOptions.length === 0 && !isLoading)) {
    return (
      <Input
        value={condition.value}
        onChange={(e) => onUpdateCondition(index, { value: e.target.value })}
        placeholder="Enter value..."
        disabled={isExecutingRules}
        className={className}
      />
    )
  }
  
  return (
    <div className="flex-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={isExecutingRules}
            className={`${className} justify-between font-normal`}
          >
            <span className="truncate">
              {currentValues.length === 0 
                ? "Select values..." 
                : `${currentValues.length} selected`}
            </span>
            <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput 
              placeholder="Search values..." 
              className="h-8 text-xs"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>
              {isLoading ? `Loading values... ${loadingProgress}%` : "No values found."}
            </CommandEmpty>
            {hasMoreData && (
              <div className="p-2 text-xs text-amber-600 bg-amber-50 border-t">
                ⚠️ Large dataset - pagination may be incomplete
              </div>
            )}
            <CommandGroup className="max-h-48 overflow-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-4 text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mb-2"></div>
                  <div>Loading values... {loadingProgress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleToggleValue(option)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        currentValues.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected values as chips */}
      {currentValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {currentValues.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="h-5 text-xs px-2 py-0 flex items-center gap-1"
            >
              {value}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => handleRemoveValue(value)}
              />
            </Badge>
          ))}
        </div>
      )}
      
      {/* Data summary */}
      {availableOptions.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {availableOptions.length} unique values available
          {totalCount && ` (from ${totalCount.toLocaleString()} total records)`}
          {hasMoreData && " - pagination may be incomplete"}
        </div>
      )}
    </div>
  )
}
