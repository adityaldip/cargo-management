"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Plus, Trash2, ChevronDown } from "lucide-react"
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

export function RateRuleEditor({
  rule,
  rates,
  isSaving,
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
  onCancel
}: RateRuleEditorProps) {
  console.log('RateRuleEditor - editingRuleRateId:', editingRuleRateId)
  console.log('RateRuleEditor - available rates:', rates.map(r => ({ id: r.id, name: r.name, is_active: r.is_active })))
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
                    <SelectTrigger className="h-6 w-16 text-xs border-gray-200">
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
                      className="h-6 w-28 text-xs border-gray-200 justify-between font-normal"
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
                      className="h-6 w-24 text-xs border-gray-200 justify-between font-normal"
                    >
                      <span className="truncate">
                        {condition.operator === "equals" && "Is"}
                        {condition.operator === "contains" && "Contains"}
                        {condition.operator === "starts_with" && "Starts"}
                        {condition.operator === "ends_with" && "Ends"}
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
                          { value: "ends_with", label: "Ends" }
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

                <Input
                  value={condition.value}
                  onChange={(e) => onUpdateCondition(index, { value: e.target.value })}
                  placeholder="Value..."
                  className="h-6 text-xs border-gray-200 flex-1 min-w-16"
                />

                {editingRuleConditions.length > 1 && index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveCondition(index)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* Rate Assignment Row */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-3 pt-3">
              <span className="text-xs font-medium text-gray-700 min-w-6">Rate</span>
              {console.log('Select value being set to:', editingRuleRateId)}
              <Select value={editingRuleRateId} onValueChange={onUpdateRateId}>
                <SelectTrigger className="h-6 text-xs border-gray-200 flex-1 min-w-40 max-w-64">
                  <SelectValue placeholder="Select rate" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {rates.filter(rate => rate.is_active !== false).map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{rate.name || rate.description || `Rate ${rate.id}`}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {rate.currency || 'EUR'} {(rate.base_rate || 0).toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
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
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            size="sm"
            onClick={onSave}
            disabled={isSaving || !editingRuleRateId}
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
