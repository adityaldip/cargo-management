"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  disabled = false,
  className = ""
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)

  // Filter options based on search term and remove empty values
  const filteredOptions = useMemo(() => {
    // First filter out options with empty string values (Radix UI doesn't allow empty string values)
    const validOptions = options.filter(option => option.value !== "")
    
    // Then filter by search term
    if (!searchTerm) return validOptions
    return validOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const selectedOption = options.find(option => option.value === value)
  
  // Use undefined instead of empty string for value (Radix UI requirement)
  const selectValue = value === "" ? undefined : value

  // Reset search term when dropdown closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm("")
    }
  }

  // Handle value change - convert undefined to empty string for compatibility
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue || "")
  }

  return (
    <SelectPrimitive.Root
      value={selectValue}
      onValueChange={handleValueChange}
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex min-h-[2.5rem] w-full items-start justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="whitespace-pre-line leading-normal block w-full text-left flex-1 min-w-0 pr-2 break-words overflow-visible">
          {selectedOption?.label || placeholder}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild className="flex-shrink-0 mt-0.5">
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-[9999] max-h-96 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          position="popper"
          style={{
            width: 'var(--radix-select-trigger-width)',
            minWidth: 'var(--radix-select-trigger-width)',
            maxWidth: 'var(--radix-select-trigger-width)',
          }}
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') {
                    handleOpenChange(false)
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          
          <SelectPrimitive.Viewport 
            className="p-1 max-h-64 overflow-y-auto"
            style={{
              width: '100%',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-start rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                >
                  <span className="absolute left-2 top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText className="whitespace-pre-line leading-normal block w-full break-words">{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
