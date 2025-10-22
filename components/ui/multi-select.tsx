"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  maxDisplay?: number
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  emptyMessage = "No item found.",
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  const selectedOptions = options.filter((option) => value.includes(option.value))

  const handleSelect = (optionValue: string) => {
    if (optionValue === 'all') {
      // Toggle all options
      const allValues = options.filter(opt => !opt.disabled).map(opt => opt.value)
      const isAllSelected = allValues.every(val => value.includes(val))
      onValueChange(isAllSelected ? [] : allValues)
    } else {
      // Toggle individual option
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onValueChange(newValue)
    }
  }

  const handleRemove = (optionValue: string) => {
    onValueChange(value.filter((v) => v !== optionValue))
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between min-h-[40px] h-auto"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.slice(0, maxDisplay).map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="mr-1 mb-1"
              >
                {option.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(option.value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(option.value)
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))
          )}
          {value.length > maxDisplay && (
            <Badge variant="secondary" className="mr-1 mb-1">
              +{value.length - maxDisplay} more
            </Badge>
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2">
            <input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-2 max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-md",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (!option.disabled) {
                                handleSelect(option.value)
                                setSearchValue("")
                              }
                            }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
