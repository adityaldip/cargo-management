"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface IgnoreRuleCondition {
  field: string
  operator: string
  value: string
}

export interface IgnoreRulesState {
  // Mail System rules (completely separate)
  mailSystemConditions: IgnoreRuleCondition[]
  mailSystemExpanded: boolean
  mailSystemLastUpdated: number
  
  // Mail Agent rules (completely separate)
  mailAgentConditions: IgnoreRuleCondition[]
  mailAgentExpanded: boolean
  mailAgentLastUpdated: number
  
  // Actions for Mail System
  setMailSystemConditions: (conditions: IgnoreRuleCondition[]) => void
  setMailSystemExpanded: (expanded: boolean) => void
  
  // Actions for Mail Agent
  setMailAgentConditions: (conditions: IgnoreRuleCondition[]) => void
  setMailAgentExpanded: (expanded: boolean) => void
  
  // Targeted reset functions (only reset the specific system)
  resetMailSystemRules: () => void
  resetMailAgentRules: () => void
  
  // Utility functions
  getConditionsForDataSource: (dataSource: "mail-agent" | "mail-system") => IgnoreRuleCondition[]
  setConditionsForDataSource: (dataSource: "mail-agent" | "mail-system", conditions: IgnoreRuleCondition[]) => void
}

export const useIgnoreRulesStore = create<IgnoreRulesState>()(
  persist(
    (set, get) => ({
      // Initial state - completely separate for each system
      mailSystemConditions: [],
      mailSystemExpanded: false,
      mailSystemLastUpdated: 0,
      mailAgentConditions: [],
      mailAgentExpanded: false,
      mailAgentLastUpdated: 0,
      
      // Actions for Mail System
      setMailSystemConditions: (conditions) => 
        set({ 
          mailSystemConditions: conditions,
          mailSystemLastUpdated: Date.now()
        }),
        
      setMailSystemExpanded: (expanded) => 
        set({ mailSystemExpanded: expanded }),
      
      // Actions for Mail Agent
      setMailAgentConditions: (conditions) => 
        set({ 
          mailAgentConditions: conditions,
          mailAgentLastUpdated: Date.now()
        }),
        
      setMailAgentExpanded: (expanded) => 
        set({ mailAgentExpanded: expanded }),
      
      // Targeted reset functions (only reset the specific system)
      resetMailSystemRules: () => 
        set({ 
          mailSystemConditions: [], 
          mailSystemExpanded: false,
          mailSystemLastUpdated: Date.now()
        }),
        
      resetMailAgentRules: () => 
        set({ 
          mailAgentConditions: [], 
          mailAgentExpanded: false,
          mailAgentLastUpdated: Date.now()
        }),
      
      // Utility functions
      getConditionsForDataSource: (dataSource) => {
        const state = get()
        return dataSource === "mail-system" 
          ? state.mailSystemConditions 
          : state.mailAgentConditions
      },
      
      setConditionsForDataSource: (dataSource, conditions) => {
        if (dataSource === "mail-system") {
          get().setMailSystemConditions(conditions)
        } else {
          get().setMailAgentConditions(conditions)
        }
      },
    }),
    {
      name: 'ignore-rules-storage', // localStorage key
      // Only persist the conditions, not the expanded state
      partialize: (state) => ({
        mailSystemConditions: state.mailSystemConditions,
        mailAgentConditions: state.mailAgentConditions,
      }),
    }
  )
)
