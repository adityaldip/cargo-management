"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AssignCustomersTabType = "customers" | "configure" | "execute"
export type AssignCustomersViewType = "rules" | "results"

interface AssignCustomersTabState {
  activeTab: AssignCustomersTabType
  currentView: AssignCustomersViewType
  setActiveTab: (tab: AssignCustomersTabType) => void
  setCurrentView: (view: AssignCustomersViewType) => void
  resetToDefault: () => void
}

const DEFAULT_TAB: AssignCustomersTabType = "customers"
const DEFAULT_VIEW: AssignCustomersViewType = "rules"

export const useAssignCustomersTabStore = create<AssignCustomersTabState>()(
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
      name: 'assign-customers-tab-navigation',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
