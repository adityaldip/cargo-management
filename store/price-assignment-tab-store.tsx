"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PriceAssignmentTabType = "flights" | "airport-codes" | "sector-rates" | "preview"
export type PriceAssignmentViewType = "main" | "results"

interface PriceAssignmentTabState {
  activeTab: PriceAssignmentTabType
  currentView: PriceAssignmentViewType
  setActiveTab: (tab: PriceAssignmentTabType) => void
  setCurrentView: (view: PriceAssignmentViewType) => void
  resetToDefault: () => void
}

const DEFAULT_TAB: PriceAssignmentTabType = "flights"
const DEFAULT_VIEW: PriceAssignmentViewType = "main"

export const usePriceAssignmentTabStore = create<PriceAssignmentTabState>()(
  persist(
    (set) => ({
      activeTab: DEFAULT_TAB,
      currentView: DEFAULT_VIEW,
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentView: (view) => set({ currentView: view }),
      
      resetToDefault: () => set({ 
        activeTab: DEFAULT_TAB, 
        currentView: DEFAULT_VIEW 
      })
    }),
    {
      name: 'price-assignment-tab-navigation',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
