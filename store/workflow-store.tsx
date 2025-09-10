"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type WorkflowStep = 
  | "import-mail-agent"
  | "import-mail-system" 
  | "review-merged-excel"
  | "assign-customers"
  | "assign-rates"
  | "review-rates"
  | "review-invoices"
  | "reporting"

interface WorkflowStore {
  activeStep: WorkflowStep
  setActiveStep: (step: WorkflowStep) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  isClearingData: boolean
  setIsClearingData: (clearing: boolean) => void
  shouldStopProcess: boolean
  setShouldStopProcess: (shouldStop: boolean) => void
  isExporting: boolean
  setIsExporting: (exporting: boolean) => void
  isBulkDeleting: boolean
  setIsBulkDeleting: (bulkDeleting: boolean) => void
}

const WorkflowContext = createContext<WorkflowStore | undefined>(undefined)

const STORAGE_KEY = "mail-processing-active-step"
const DEFAULT_STEP: WorkflowStep = "import-mail-agent"

interface WorkflowProviderProps {
  children: ReactNode
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  // Always start with DEFAULT_STEP to prevent hydration mismatch
  const [activeStep, setActiveStepState] = useState<WorkflowStep>(DEFAULT_STEP)
  const [isProcessing, setIsProcessingState] = useState(false)
  const [isClearingData, setIsClearingDataState] = useState(false)
  const [shouldStopProcess, setShouldStopProcessState] = useState(false)
  const [isExporting, setIsExportingState] = useState(false)
  const [isBulkDeleting, setIsBulkDeletingState] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const setActiveStep = (step: WorkflowStep) => {
    setActiveStepState(step)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, step)
    }
  }

  // Hydration effect - load from localStorage only after hydration
  useEffect(() => {
    setIsHydrated(true)
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as WorkflowStep
      if (stored) {
        setActiveStepState(stored)
      }
    }
  }, [])

  const value: WorkflowStore = {
    activeStep,
    setActiveStep,
    isProcessing,
    setIsProcessing: setIsProcessingState,
    isClearingData,
    setIsClearingData: setIsClearingDataState,
    shouldStopProcess,
    setShouldStopProcess: setShouldStopProcessState,
    isExporting,
    setIsExporting: setIsExportingState,
    isBulkDeleting,
    setIsBulkDeleting: setIsBulkDeletingState,
  }

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflowStore() {
  const context = useContext(WorkflowContext)
  if (context === undefined) {
    throw new Error("useWorkflowStore must be used within a WorkflowProvider")
  }
  return context
}
