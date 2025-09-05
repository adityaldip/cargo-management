"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { FilterCondition } from "@/components/ui/filter-popup"

// Define the different pages/components that can have filters
type FilterPage = 
  | "review-merged-excel"
  | "execute-rates" 
  | "execute-rules"
  | "configure-rates"
  | "rules-configuration"

interface PageFilterState {
  conditions: FilterCondition[]
  logic: "AND" | "OR"
  isActive: boolean
}

interface FilterStore {
  // Get filter state for a specific page
  getPageFilters: (page: FilterPage) => PageFilterState
  
  // Set filter state for a specific page
  setPageFilters: (page: FilterPage, state: PageFilterState) => void
  
  // Clear filters for a specific page
  clearPageFilters: (page: FilterPage) => void
  
  // Clear all filters across all pages
  clearAllFilters: () => void
  
  // Check if any page has active filters
  hasAnyActiveFilters: () => boolean
  
  // Get count of pages with active filters
  getActiveFilterCount: () => number
}

const FilterContext = createContext<FilterStore | undefined>(undefined)

const STORAGE_KEY = "mail-processing-filters"
const DEFAULT_FILTER_STATE: PageFilterState = {
  conditions: [],
  logic: "AND",
  isActive: false
}

interface FilterProviderProps {
  children: ReactNode
}

export function FilterProvider({ children }: FilterProviderProps) {
  const [filterStates, setFilterStates] = useState<Record<FilterPage, PageFilterState>>({
    "review-merged-excel": { ...DEFAULT_FILTER_STATE },
    "execute-rates": { ...DEFAULT_FILTER_STATE },
    "execute-rules": { ...DEFAULT_FILTER_STATE },
    "configure-rates": { ...DEFAULT_FILTER_STATE },
    "rules-configuration": { ...DEFAULT_FILTER_STATE }
  })
  const [isHydrated, setIsHydrated] = useState(false)

  // Save to localStorage whenever state changes
  const saveToStorage = (newStates: Record<FilterPage, PageFilterState>) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStates))
    }
  }

  // Load from localStorage on hydration
  useEffect(() => {
    setIsHydrated(true)
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsedStates = JSON.parse(stored) as Record<FilterPage, PageFilterState>
          // Merge with default states to ensure all pages exist
          const mergedStates = {
            "review-merged-excel": parsedStates["review-merged-excel"] || { ...DEFAULT_FILTER_STATE },
            "execute-rates": parsedStates["execute-rates"] || { ...DEFAULT_FILTER_STATE },
            "execute-rules": parsedStates["execute-rules"] || { ...DEFAULT_FILTER_STATE },
            "configure-rates": parsedStates["configure-rates"] || { ...DEFAULT_FILTER_STATE },
            "rules-configuration": parsedStates["rules-configuration"] || { ...DEFAULT_FILTER_STATE }
          }
          setFilterStates(mergedStates)
        }
      } catch (error) {
        console.warn("Failed to load filter states from localStorage:", error)
      }
    }
  }, [])

  const getPageFilters = (page: FilterPage): PageFilterState => {
    return filterStates[page] || { ...DEFAULT_FILTER_STATE }
  }

  const setPageFilters = (page: FilterPage, state: PageFilterState) => {
    const newStates = {
      ...filterStates,
      [page]: {
        ...state,
        isActive: state.conditions.length > 0
      }
    }
    setFilterStates(newStates)
    saveToStorage(newStates)
  }

  const clearPageFilters = (page: FilterPage) => {
    const newStates = {
      ...filterStates,
      [page]: { ...DEFAULT_FILTER_STATE }
    }
    setFilterStates(newStates)
    saveToStorage(newStates)
  }

  const clearAllFilters = () => {
    const newStates: Record<FilterPage, PageFilterState> = {
      "review-merged-excel": { ...DEFAULT_FILTER_STATE },
      "execute-rates": { ...DEFAULT_FILTER_STATE },
      "execute-rules": { ...DEFAULT_FILTER_STATE },
      "configure-rates": { ...DEFAULT_FILTER_STATE },
      "rules-configuration": { ...DEFAULT_FILTER_STATE }
    }
    setFilterStates(newStates)
    saveToStorage(newStates)
  }

  const hasAnyActiveFilters = (): boolean => {
    return Object.values(filterStates).some(state => state.isActive)
  }

  const getActiveFilterCount = (): number => {
    return Object.values(filterStates).filter(state => state.isActive).length
  }

  const value: FilterStore = {
    getPageFilters,
    setPageFilters,
    clearPageFilters,
    clearAllFilters,
    hasAnyActiveFilters,
    getActiveFilterCount
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilterStore() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilterStore must be used within a FilterProvider")
  }
  return context
}

// Hook for individual pages to manage their filter state
export function usePageFilters(page: FilterPage) {
  const store = useFilterStore()
  
  const pageState = store.getPageFilters(page)
  
  const setFilters = (conditions: FilterCondition[], logic: "AND" | "OR" = "AND") => {
    store.setPageFilters(page, {
      conditions,
      logic,
      isActive: conditions.length > 0
    })
  }
  
  const clearFilters = () => {
    store.clearPageFilters(page)
  }
  
  const hasActiveFilters = pageState.isActive
  
  return {
    conditions: pageState.conditions,
    logic: pageState.logic,
    hasActiveFilters,
    setFilters,
    clearFilters
  }
}
