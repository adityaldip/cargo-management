"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: number
  order: number
}

interface ColumnConfigState {
  columnConfigs: ColumnConfig[]
  setColumnConfigs: (configs: ColumnConfig[]) => void
  updateColumnConfig: (key: string, updates: Partial<ColumnConfig>) => void
  resetToDefault: () => void
}

// Function to create default column configurations
const createDefaultColumnConfigs = (): ColumnConfig[] => {
  const columnLabels: Partial<Record<string, string>> = {
    id: 'Record ID.',
    rec_id: 'Rec. ID.',
    inb_flight_date: 'Inb. Flight Date.',
    outb_flight_date: 'Outb. Flight Date.', 
    des_no: 'Des. No.',
    rec_numb: 'Rec. Number.',
    orig_oe: 'Orig. OE.',
    dest_oe: 'Dest. OE.',
    inb_flight_no: 'Inb. Flight No.',
    outb_flight_no: 'Outb. Flight No.',
    mail_cat: 'Mail Category.',
    mail_class: 'Mail Class.',
    total_kg: 'Total Weight (kg).',
    invoice: 'Invoice.',
    assigned_customer: 'Customer.',
    assigned_rate: 'Rate.',
  }

  const columnOrder: Array<{ key: string; visible: boolean }> = [
    { key: 'inb_flight_date', visible: true },
    { key: 'outb_flight_date', visible: true },
    { key: 'rec_id', visible: true },
    { key: 'des_no', visible: true },
    { key: 'rec_numb', visible: true },
    { key: 'orig_oe', visible: true },
    { key: 'dest_oe', visible: true },
    { key: 'inb_flight_no', visible: true },
    { key: 'outb_flight_no', visible: true },
    { key: 'mail_cat', visible: true },
    { key: 'mail_class', visible: true },
    { key: 'total_kg', visible: true },
    { key: 'invoice', visible: true },
    { key: 'assigned_customer', visible: true },
    { key: 'assigned_rate', visible: true },
  ]

  return columnOrder.map((col, index) => ({
    key: col.key,
    label: columnLabels[col.key] || col.key,
    visible: col.visible,
    order: index + 1
  }))
}

export const useColumnConfigStore = create<ColumnConfigState>()(
  persist(
    (set, get) => ({
      columnConfigs: createDefaultColumnConfigs(),
      
      setColumnConfigs: (configs) => set({ columnConfigs: configs }),
      
      updateColumnConfig: (key, updates) => set((state) => ({
        columnConfigs: state.columnConfigs.map(config => 
          config.key === key ? { ...config, ...updates } : config
        )
      })),
      
      resetToDefault: () => set({ columnConfigs: createDefaultColumnConfigs() })
    }),
    {
      name: 'cargo-column-configs',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
