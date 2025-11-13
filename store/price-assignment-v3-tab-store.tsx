"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PriceAssignmentV3TabType = "flights" | "airport-codes" | "customer-management" | "sector-rates" | "preview"
export type PriceAssignmentViewType = "main" | "results"

interface PriceAssignmentV3TabState {
  activeTab: PriceAssignmentV3TabType
  currentView: PriceAssignmentViewType
  setActiveTab: (tab: PriceAssignmentV3TabType) => void
  setCurrentView: (view: PriceAssignmentViewType) => void
  resetToDefault: () => void
}

const DEFAULT_TAB: PriceAssignmentV3TabType = "airport-codes"
const DEFAULT_VIEW: PriceAssignmentViewType = "main"

export const usePriceAssignmentV3TabStore = create<PriceAssignmentV3TabState>()(
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
      name: 'price-assignment-v3-tab-navigation',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

