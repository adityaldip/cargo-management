"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, Plus, Trash2, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface FilterField {
  key: string
  label: string
  type?: 'text' | 'number' | 'date'
}

export interface FilterPopupProps {
  isOpen: boolean
  onClose: () => void
  onApply: (conditions: FilterCondition[], logic: "AND" | "OR") => void
  fields: FilterField[]
  initialConditions?: FilterCondition[]
  initialLogic?: "AND" | "OR"
  title?: string
}

const operators = [
  { value: "equals", label: "Is" },
  { value: "contains", label: "Contains" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "not_empty", label: "Is not empty" },
  { value: "is_empty", label: "Is empty" }
]

export function FilterPopup({
  isOpen,
  onClose,
  onApply,
  fields,
  initialConditions = [],
  initialLogic = "AND",
  title = "Filter Data"
}: FilterPopupProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(
    initialConditions.length > 0 ? initialConditions : [{ field: fields[0]?.key || "", operator: "equals", value: "" }]
  )
  const [logic, setLogic] = useState<"AND" | "OR">(initialLogic)
  const [openFieldSelects, setOpenFieldSelects] = useState<Record<number, boolean>>({})
  const [openOperatorSelects, setOpenOperatorSelects] = useState<Record<number, boolean>>({})
  const popupRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Don't close if clicking inside the popup
      if (popupRef.current && popupRef.current.contains(target)) {
        return
      }
      
      // Don't close if clicking on a portal element (Select dropdowns, Popover content, etc.)
      const portalElements = document.querySelectorAll('[data-radix-portal], [data-radix-popper-content-wrapper]')
      for (const portalElement of portalElements) {
        if (portalElement.contains(target)) {
          return
        }
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

  const addCondition = () => {
    setConditions(prev => [...prev, { field: fields[0]?.key || "", operator: "equals", value: "" }])
  }

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    setConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  const handleApply = () => {
    const validConditions = conditions.filter(cond => cond.field && cond.operator && (cond.value.trim() || cond.operator === "not_empty" || cond.operator === "is_empty"))
    onApply(validConditions, logic)
    onClose()
  }

  const handleClear = () => {
    setConditions([{ field: fields[0]?.key || "", operator: "equals", value: "" }])
    setLogic("AND")
  }

  const getOperatorsForField = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey)
    if (field?.type === 'number') {
      return operators.filter(op => ['equals', 'greater_than', 'less_than', 'not_empty', 'is_empty'].includes(op.value))
    }
    if (field?.type === 'date') {
      return operators.filter(op => ['equals', 'greater_than', 'less_than', 'not_empty', 'is_empty'].includes(op.value))
    }
    return operators
  }

  if (!isOpen) return null

  return (
    <div ref={popupRef} className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-96 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Filter</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            Clear all
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
          {/* Filter Conditions */}
          {conditions.map((condition, index) => (
            <div key={index} className="flex flex-wrap items-center gap-1 p-2 rounded-md hover:bg-gray-50 group">
              {index === 0 ? (
                <span className="text-xs font-medium text-gray-700 w-12 flex-shrink-0">Where</span>
              ) : (
                <Select 
                  value={logic}
                  onValueChange={(value) => setLogic(value as "AND" | "OR")}
                >
                  <SelectTrigger className="h-6 w-12 text-xs border-gray-200 flex-shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">And</SelectItem>
                    <SelectItem value="OR">Or</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Field Selection */}
              <Popover 
                open={openFieldSelects[index]} 
                onOpenChange={(open) => setOpenFieldSelects(prev => ({ ...prev, [index]: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openFieldSelects[index]}
                    className="h-6 w-28 text-xs border-gray-200 justify-between font-normal"
                  >
                    <span className="truncate">
                      {condition.field
                        ? fields.find((field) => field.key === condition.field)?.label
                        : "Field..."}
                    </span>
                    <ChevronDown className="ml-1 h-2 w-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0">
                  <Command>
                    <CommandInput placeholder="Search field..." className="h-8 text-xs" />
                    <CommandEmpty>No field found.</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-auto">
                      {fields.map((field) => (
                        <CommandItem
                          key={field.key}
                          value={field.label}
                          onSelect={() => {
                            updateCondition(index, { field: field.key, value: "" })
                            setOpenFieldSelects(prev => ({ ...prev, [index]: false }))
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

              {/* Operator Selection */}
              <Popover 
                open={openOperatorSelects[index]} 
                onOpenChange={(open) => setOpenOperatorSelects(prev => ({ ...prev, [index]: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openOperatorSelects[index]}
                    className="h-6 w-20 text-xs border-gray-200 justify-between font-normal"
                  >
                    <span className="truncate">
                      {operators.find(op => op.value === condition.operator)?.label || "Op..."}
                    </span>
                    <ChevronDown className="ml-1 h-2 w-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-0">
                  <Command>
                    <CommandInput placeholder="Search..." className="h-8 text-xs" />
                    <CommandEmpty>No operator found.</CommandEmpty>
                    <CommandGroup>
                      {getOperatorsForField(condition.field).map((operator) => (
                        <CommandItem
                          key={operator.value}
                          value={operator.label}
                          onSelect={() => {
                            updateCondition(index, { operator: operator.value })
                            setOpenOperatorSelects(prev => ({ ...prev, [index]: false }))
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

              {/* Value Input */}
              {!['not_empty', 'is_empty'].includes(condition.operator) && (
                <Input
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Value..."
                  className="h-6 text-xs border-gray-200 flex-1 min-w-16"
                  type={fields.find(f => f.key === condition.field)?.type === 'number' ? 'number' : 'text'}
                />
              )}

              {/* Remove Button */}
              {conditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {/* Add Condition Button */}
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addCondition}
              className="h-6 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-2 w-2 mr-1" />
              Add filter
            </Button>
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
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          size="sm"
          className="bg-black hover:bg-gray-800 text-white h-6 px-3 text-xs"
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
