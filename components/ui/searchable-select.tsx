"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.searchable-select-container')) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown when value changes
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false)
      setSearchTerm("")
    }
  }, [value])

  const handleOptionClick = (optionValue: string) => {
    if (!disabled) {
      onValueChange(optionValue)
    }
  }

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={`relative searchable-select-container ${className}`}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={`w-full justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
          }
        }}
        disabled={disabled}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <svg
          className="ml-2 h-4 w-4 shrink-0 opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[100] bg-white border shadow-lg rounded-md mt-1">
          <div className="p-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!option.disabled) {
                      handleOptionClick(option.value)
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
