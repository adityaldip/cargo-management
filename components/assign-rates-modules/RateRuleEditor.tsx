"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Trash2, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { RateRule } from "@/types/rate-management"

type ConditionType = {
  field: string
  operator: string
  value: string
}

interface RateRuleEditorProps {
  rule: RateRule
  rates: any[]
  isSaving: boolean
  isExecutingRules?: boolean
  editingRuleConditions: ConditionType[]
  editingRuleLogic: "AND" | "OR"
  editingRuleRateId: string
  openFieldSelects: Record<number, boolean>
  openOperatorSelects: Record<number, boolean>
  onUpdateConditions: (conditions: ConditionType[]) => void
  onUpdateLogic: (logic: "AND" | "OR") => void
  onUpdateRateId: (rateId: string) => void
  onUpdateFieldSelect: (index: number, open: boolean) => void
  onUpdateOperatorSelect: (index: number, open: boolean) => void
  onAddCondition: () => void
  onRemoveCondition: (index: number) => void
  onUpdateCondition: (index: number, updates: Partial<ConditionType>) => void
  onSave: () => void
  onCancel: () => void
  isSaveDisabled?: boolean // Controls whether save button should be disabled
  onRetryRates?: () => void // Optional retry function for rates
}

// Available field options from cargo_data columns
const cargoDataFields = [
  { key: 'inb_flight_date', label: 'Inb. Flight Date' },
  { key: 'outb_flight_date', label: 'Outb. Flight Date' },
  { key: 'rec_id', label: 'Rec. ID' },
  { key: 'des_no', label: 'Des. No.' },
  { key: 'rec_numb', label: 'Rec. Number' },
  { key: 'orig_oe', label: 'Orig. OE' },
  { key: 'dest_oe', label: 'Dest. OE' },
  { key: 'inb_flight_no', label: 'Inb. Flight No.' },
  { key: 'outb_flight_no', label: 'Outb. Flight No.' },
  { key: 'mail_cat', label: 'Mail Category' },
  { key: 'mail_class', label: 'Mail Class' },
  { key: 'total_kg', label: 'Total Weight (kg)' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'assigned_customer', label: 'Customer' },
  { key: 'assigned_rate', label: 'Rate' }
]


// Multi-select component for condition values
function MultiSelectValueInput({ 
  condition, 
  index, 
  onUpdateCondition, 
  isExecutingRules 
}: { 
  condition: ConditionType
  index: number
  onUpdateCondition: (index: number, updates: Partial<ConditionType>) => void
  isExecutingRules: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [availableOptions, setAvailableOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
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
        placeholder="Value..."
        disabled={isExecutingRules}
        className="h-6 text-xs border-gray-200 flex-1 min-w-16"
      />
    )
  }
  
  return (
    <div className="flex-1 min-w-16">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={isExecutingRules}
            className="h-6 w-full text-xs border-gray-200 justify-between font-normal"
          >
            <span className="truncate">
              {currentValues.length === 0 
                ? "Select values..." 
                : `${currentValues.length} selected`}
            </span>
            <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
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
    </div>
  )
}

export function RateRuleEditor({
  rule,
  rates,
  isSaving,
  isExecutingRules = false,
  editingRuleConditions,
  editingRuleLogic,
  editingRuleRateId,
  openFieldSelects,
  openOperatorSelects,
  onUpdateConditions,
  onUpdateLogic,
  onUpdateRateId,
  onUpdateFieldSelect,
  onUpdateOperatorSelect,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onSave,
  onCancel,
  isSaveDisabled = false,
  onRetryRates
}: RateRuleEditorProps) {
  console.log('=== DEBUG: RateRuleEditor ===')
  console.log('RateRuleEditor - editingRuleRateId:', editingRuleRateId)
  console.log('RateRuleEditor - rates array:', rates)
  console.log('RateRuleEditor - rates length:', rates?.length || 0)
  console.log('RateRuleEditor - rates type:', typeof rates)
  console.log('RateRuleEditor - available rates:', rates?.map(r => ({ id: r.id, name: r.name, is_active: r.is_active })) || [])
  return (
    <div className="border-t bg-gray-50 p-3">
      <div className="space-y-3">
        {/* Compact Filter Section */}
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          {/* Add Condition Button */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddCondition}
              disabled={isExecutingRules}
              className="h-7 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add condition
            </Button>
          </div>
          
          {/* Filter Conditions */}
          <div className="p-3 space-y-1.5">
            {editingRuleConditions.map((condition, index) => (
              <div key={index} className="flex flex-wrap items-center gap-1 p-1.5 rounded-md hover:bg-gray-50 group">
                {index === 0 ? (
                  <span className="text-xs font-medium text-gray-700 w-16">Where</span>
                ) : (
                  <Select 
                    value={editingRuleLogic}
                    onValueChange={(value) => onUpdateLogic(value as "AND" | "OR")}
                  >
                    <SelectTrigger className="h-6 w-16 text-xs border-gray-200" disabled={isExecutingRules}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">And</SelectItem>
                      <SelectItem value="OR">Or</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Popover 
                  open={openFieldSelects[index]} 
                  onOpenChange={(open) => onUpdateFieldSelect(index, open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFieldSelects[index]}
                      disabled={isExecutingRules}
                      className="h-6 w-36 text-xs border-gray-200 justify-between font-normal"
                    >
                      <span className="truncate">
                        {condition.field
                          ? cargoDataFields.find((field) => field.key === condition.field)?.label
                          : "Field..."}
                      </span>
                      <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0">
                    <Command>
                      <CommandInput placeholder="Search field..." className="h-8 text-xs" />
                      <CommandEmpty>No field found.</CommandEmpty>
                      <CommandGroup className="max-h-48 overflow-auto">
                        {cargoDataFields.map((field) => (
                          <CommandItem
                            key={field.key}
                            value={field.label}
                            onSelect={() => {
                              onUpdateCondition(index, { field: field.key, value: "" })
                              onUpdateFieldSelect(index, false)
                            }}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                condition.field === field.key ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {field.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Popover 
                  open={openOperatorSelects[index]} 
                  onOpenChange={(open) => onUpdateOperatorSelect(index, open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openOperatorSelects[index]}
                      className="h-6 w-34 text-xs border-gray-200 justify-between font-normal"
                    >
                      <span className="truncate">
                        {condition.operator === "equals" && "Is"}
                        {condition.operator === "contains" && "Contains"}
                        {condition.operator === "starts_with" && "Starts"}
                        {condition.operator === "ends_with" && "Ends"}
                        {condition.operator === "is_empty" && "Is empty"}
                        {condition.operator === "not_empty" && "Is not empty"}
                        {condition.operator === "does_not_contain" && "Does not contain"}
                        {!condition.operator && "Op..."}
                      </span>
                      <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-0">
                    <Command>
                      <CommandInput placeholder="Search..." className="h-8 text-xs" />
                      <CommandEmpty>No operator found.</CommandEmpty>
                      <CommandGroup>
                        {[
                          { value: "equals", label: "Is" },
                          { value: "contains", label: "Contains" },
                          { value: "starts_with", label: "Starts" },
                          { value: "ends_with", label: "Ends" },
                          { value: "is_empty", label: "Is empty" },
                          { value: "not_empty", label: "Is not empty" },
                          { value: "does_not_contain", label: "Does not contain" },
                        ].map((operator) => (
                          <CommandItem
                            key={operator.value}
                            value={operator.label}
                            onSelect={() => {
                              onUpdateCondition(index, { operator: operator.value })
                              onUpdateOperatorSelect(index, false)
                            }}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                condition.operator === operator.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {operator.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <MultiSelectValueInput
                  condition={condition}
                  index={index}
                  onUpdateCondition={onUpdateCondition}
                  isExecutingRules={isExecutingRules}
                />

                {editingRuleConditions.length > 1 && index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveCondition(index)}
                    disabled={isExecutingRules}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* Rate Assignment Row */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-3 pt-3">
              <span className="text-xs font-medium text-gray-700 w-16">Rate</span>
              <Select value={editingRuleRateId} onValueChange={onUpdateRateId}>
                <SelectTrigger className="h-6 text-xs border-gray-200 flex-1 min-w-40 max-w-64" disabled={isExecutingRules}>
                  <SelectValue placeholder={
                    !rates || rates.length === 0 
                      ? "Loading rates..." 
                      : "Select rate"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {!rates || rates.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500 text-center">
                      <div className="mb-2">
                        {!rates ? "Loading rates..." : "No rates available"}
                      </div>
                      {onRetryRates && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRetryRates()
                          }}
                          className="h-6 text-xs"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  ) : (
                    rates.filter(rate => rate.is_active !== false).map((rate) => (
                      <SelectItem key={rate.id} value={rate.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{rate.name || rate.description || `Rate ${rate.id}`}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {rate.currency || 'EUR'} {(rate.base_rate || 0).toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
            className="h-6 text-xs px-3"
            disabled={isSaving || isExecutingRules}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={onSave}
            disabled={isSaving || isExecutingRules || !editingRuleRateId || isSaveDisabled}
            className="bg-black hover:bg-gray-800 text-white h-6 text-xs px-3"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
