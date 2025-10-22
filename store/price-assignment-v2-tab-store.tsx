"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PriceAssignmentV2TabType = "flights" | "airport-codes" | "customer-management" | "sector-rates" | "preview"
export type PriceAssignmentViewType = "main" | "results"

interface PriceAssignmentV2TabState {
  activeTab: PriceAssignmentV2TabType
  currentView: PriceAssignmentViewType
  setActiveTab: (tab: PriceAssignmentV2TabType) => void
  setCurrentView: (view: PriceAssignmentViewType) => void
  resetToDefault: () => void
}

const DEFAULT_TAB: PriceAssignmentV2TabType = "airport-codes"
const DEFAULT_VIEW: PriceAssignmentViewType = "main"

export const usePriceAssignmentV2TabStore = create<PriceAssignmentV2TabState>()(
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
      name: 'price-assignment-v2-tab-navigation',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
