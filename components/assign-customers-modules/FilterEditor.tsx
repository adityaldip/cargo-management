"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Plus, Trash2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { MultiSelectValueInput } from "./MultiSelectValueInput"

interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface FilterEditorProps {
  conditions: FilterCondition[]
  onConditionsChange: (conditions: FilterCondition[]) => void
  logic: "AND" | "OR"
  onLogicChange: (logic: "AND" | "OR") => void
  assignTo: string
  onAssignToChange: (assignTo: string) => void
  customers: Array<{
    id: string
    name: string
    code: string
    codes: Array<{
      id: string
      code: string
      product: string
      is_active: boolean
    }>
  }>
  loadingCustomers: boolean
  isSaving: boolean
  isExecutingRules?: boolean
  onSave: () => void
  onCancel: () => void
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

export function FilterEditor({
  conditions,
  onConditionsChange,
  logic,
  onLogicChange,
  assignTo,
  onAssignToChange,
  customers,
  loadingCustomers,
  isSaving,
  isExecutingRules = false,
  onSave,
  onCancel
}: FilterEditorProps) {
  const [openFieldSelects, setOpenFieldSelects] = useState<Record<number, boolean>>({})
  const [openOperatorSelects, setOpenOperatorSelects] = useState<Record<number, boolean>>({})
  const [openCustomerCodeSelect, setOpenCustomerCodeSelect] = useState(false)

  // Memoized customers for better performance
  const memoizedCustomers = useMemo(() => {
    return customers.sort((a, b) => a.name.localeCompare(b.name))
  }, [customers])

  // Helper functions for editing rule conditions
  const addCondition = () => {
    const firstField = cargoDataFields[0]?.key || "orig_oe"
    onConditionsChange([...conditions, { field: firstField, operator: "equals", value: "" }])
  }

  const removeCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    onConditionsChange(conditions.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="space-y-4">
        {/* Notion-Style Filter Section */}
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          {/* Add Condition Button - Moved to top */}
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={addCondition}
              className="h-8 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add condition
            </Button>
          </div>
          
          {/* Filter Conditions */}
          <div className="p-4 space-y-2">
            {conditions.map((condition, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
                {index === 0 ? (
                  <span className="text-xs font-medium text-gray-700 w-18 flex-shrink-0">Where</span>
                ) : (
                  <Select 
                    value={logic}
                    onValueChange={(value) => onLogicChange(value as "AND" | "OR")}
                  >
                    <SelectTrigger className="h-7 w-18 text-xs border-gray-200 flex-shrink-0">
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
                  onOpenChange={(open) => setOpenFieldSelects(prev => ({ ...prev, [index]: open }))}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFieldSelects[index]}
                      className="h-7 w-36 text-xs border-gray-200 justify-between font-normal"
                    >
                      <span className="truncate">
                        {condition.field
                          ? cargoDataFields.find((field) => field.key === condition.field)?.label
                          : "Field..."}
                      </span>
                      <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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

                <Popover 
                  open={openOperatorSelects[index]} 
                  onOpenChange={(open) => setOpenOperatorSelects(prev => ({ ...prev, [index]: open }))}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openOperatorSelects[index]}
                      className="h-7 w-34 text-xs border-gray-200 justify-between font-normal"
                    >
                      <span className="truncate">
                        {condition.operator === "equals" && "Is"}
                        {condition.operator === "contains" && "Contains"}
                        {condition.operator === "starts_with" && "Starts"}
                        {condition.operator === "ends_with" && "Ends"}
                        {condition.operator === "is_empty" && "Is empty"}
                        {condition.operator === "not_empty" && "Is not empty"}
                        {condition.operator === "does_not_contain" && "Does not contain"}
                        {!condition.operator && "Operator..."}
                      </span>
                      <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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

                <MultiSelectValueInput
                  condition={condition}
                  index={index}
                  onUpdateCondition={updateCondition}
                  isExecutingRules={isExecutingRules}
                  className="h-7 text-xs border-gray-200 flex-1 min-w-20 w-full"
                />

                {conditions.length > 1 && index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* Contractee Code Assignment Row */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
              <span className="text-xs font-medium text-gray-700 w-18 flex-shrink-0">Assign To</span>
              <Popover open={openCustomerCodeSelect} onOpenChange={setOpenCustomerCodeSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCustomerCodeSelect}
                    className="h-7 text-xs border-gray-200 flex-1 w-1/2 justify-between font-normal"
                    disabled={loadingCustomers}
                  >
                    <span className="truncate">
                      {assignTo
                        ? (() => {
                            // Find the selected contractee code
                            for (const customer of memoizedCustomers) {
                              const selectedCode = customer.codes.find(code => code.id === assignTo)
                              if (selectedCode) {
                                return `${selectedCode.product} (${customer.name})`
                              }
                            }
                            return "Select contractee product..."
                          })()
                        : loadingCustomers 
                          ? "Loading contractee products..." 
                          : "Select contractee product..."}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[28rem] p-0" side="bottom" align="start">
                  <Command>
                    <CommandInput placeholder="Search contractee products..." className="h-8 text-xs" />
                    <CommandEmpty>
                      {loadingCustomers ? "Loading..." : "No contractee products found."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {memoizedCustomers.map((customer) => {
                        const activeCodes = customer.codes.filter(code => code.is_active)
                        return activeCodes.map((code) => (
                          <CommandItem
                            key={code.id}
                            value={`${code.product} ${customer.name}`}
                            onSelect={() => {
                              onAssignToChange(code.id)
                              setOpenCustomerCodeSelect(false)
                            }}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                assignTo === code.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center justify-between min-w-0 flex-1">
                              <span className="font-medium text-sm">{code.product}</span>
                              <span className="text-gray-500 text-xs">{customer.name} ({customer.code})</span>
                            </div>
                          </CommandItem>
                        ))
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
            className="h-7 text-xs"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="bg-black hover:bg-gray-800 text-white h-7 text-xs"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
