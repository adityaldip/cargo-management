"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ReviewTabType = "configure" | "preview" | "update-excel" | "update-mapping"

interface ReviewTabState {
  activeTab: ReviewTabType
  setActiveTab: (tab: ReviewTabType) => void
  resetToDefault: () => void
}

const DEFAULT_TAB: ReviewTabType = "update-excel"

export const useReviewTabStore = create<ReviewTabState>()(
  persist(
    (set) => ({
      activeTab: DEFAULT_TAB,
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      resetToDefault: () => set({ activeTab: DEFAULT_TAB })
    }),
    {
      name: 'review-merged-excel-tab',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
