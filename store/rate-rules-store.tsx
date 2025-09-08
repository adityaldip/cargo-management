"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface RateRule {
  id: string
  name: string
  description?: string
  priority: number
  conditions: RateRuleCondition[]
  rate: number
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RateRuleCondition {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than'
  value: string
  logic?: 'AND' | 'OR'
}

interface RateRulesState {
  rateRules: RateRule[]
  setRateRules: (rules: RateRule[]) => void
  addRateRule: (rule: RateRule) => void
  updateRateRule: (id: string, updates: Partial<RateRule>) => void
  deleteRateRule: (id: string) => void
  reorderRateRules: (ruleIds: string[]) => void
  clearRateRules: () => void
}

export const useRateRulesStore = create<RateRulesState>()(
  persist(
    (set, get) => ({
      rateRules: [],
      
      setRateRules: (rateRules) => set({ rateRules }),
      
      addRateRule: (rule) => set((state) => ({
        rateRules: [rule, ...state.rateRules]
      })),
      
      updateRateRule: (id, updates) => set((state) => ({
        rateRules: state.rateRules.map(rule => 
          rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
        )
      })),
      
      deleteRateRule: (id) => set((state) => ({
        rateRules: state.rateRules.filter(rule => rule.id !== id)
      })),
      
      reorderRateRules: (ruleIds) => set((state) => {
        const reorderedRules = ruleIds
          .map(id => state.rateRules.find(rule => rule.id === id))
          .filter(Boolean) as RateRule[]
        
        // Update priorities based on new order
        const updatedRules = reorderedRules.map((rule, index) => ({
          ...rule,
          priority: index + 1,
          updatedAt: new Date().toISOString()
        }))
        
        return { rateRules: updatedRules }
      }),
      
      clearRateRules: () => set({ rateRules: [] })
    }),
    {
      name: 'rate-rules',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
