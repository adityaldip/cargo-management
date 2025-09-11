"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AssignRatesTabType = "setup" | "configure" | "execute"

interface AssignRatesTabState {
  activeTab: AssignRatesTabType
  setActiveTab: (tab: AssignRatesTabType) => void
  resetToDefault: () => void
}

const DEFAULT_TAB: AssignRatesTabType = "setup"

export const useAssignRatesTabStore = create<AssignRatesTabState>()(
  persist(
    (set) => ({
      activeTab: DEFAULT_TAB,
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      resetToDefault: () => set({ 
        activeTab: DEFAULT_TAB
      })
    }),
    {
      name: 'assign-rates-tab-navigation',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
