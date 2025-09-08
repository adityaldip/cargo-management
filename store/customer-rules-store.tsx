"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CustomerRule {
  id: string
  name: string
  description?: string
  priority: number
  conditions: CustomerRuleCondition[]
  customer: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerRuleCondition {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex'
  value: string
  logic?: 'AND' | 'OR'
}

interface CustomerRulesState {
  rules: CustomerRule[]
  setRules: (rules: CustomerRule[]) => void
  addRule: (rule: CustomerRule) => void
  updateRule: (id: string, updates: Partial<CustomerRule>) => void
  deleteRule: (id: string) => void
  reorderRules: (ruleIds: string[]) => void
  clearRules: () => void
}

export const useCustomerRulesStore = create<CustomerRulesState>()(
  persist(
    (set, get) => ({
      rules: [],
      
      setRules: (rules) => set({ rules }),
      
      addRule: (rule) => set((state) => ({
        rules: [rule, ...state.rules]
      })),
      
      updateRule: (id, updates) => set((state) => ({
        rules: state.rules.map(rule => 
          rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
        )
      })),
      
      deleteRule: (id) => set((state) => ({
        rules: state.rules.filter(rule => rule.id !== id)
      })),
      
      reorderRules: (ruleIds) => set((state) => {
        const reorderedRules = ruleIds
          .map(id => state.rules.find(rule => rule.id === id))
          .filter(Boolean) as CustomerRule[]
        
        // Update priorities based on new order
        const updatedRules = reorderedRules.map((rule, index) => ({
          ...rule,
          priority: index + 1,
          updatedAt: new Date().toISOString()
        }))
        
        return { rules: updatedRules }
      }),
      
      clearRules: () => set({ rules: [] })
    }),
    {
      name: 'customer-rules-cache',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
