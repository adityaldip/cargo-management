"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
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
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate position when dropdown opens or window resizes/scrolls
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          setPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          })
        }
      }

      updatePosition()
      
      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Don't close if clicking inside dropdown or container
      if (
        dropdownRef.current && 
        dropdownRef.current.contains(target)
      ) {
        return
      }
      if (
        containerRef.current &&
        containerRef.current.contains(target)
      ) {
        return
      }
      // Close if clicking outside
      setIsOpen(false)
      setSearchTerm("")
    }

    if (isOpen) {
      // Use setTimeout to ensure dropdown is rendered first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true)
      }, 0)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true)
      }
    }
  }, [isOpen])

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

  const dropdownContent = isOpen && typeof window !== 'undefined' ? (
    <div
      ref={dropdownRef}
      className="fixed z-[99999] bg-white border shadow-lg rounded-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2">
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className={`flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer ${
                option.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!option.disabled) {
                  handleOptionClick(option.value)
                }
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
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
  ) : null

  return (
    <>
      <div ref={containerRef} className={`relative searchable-select-container ${className}`}>
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
      </div>
      {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </>
  )
}
