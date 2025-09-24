"use client"

import { useState } from "react"

interface ProgressState {
  percentage: number
  currentCount: number
  totalCount: number
  currentBatch: number
  totalBatches: number
  status: '' | 'preparing' | 'saving' | 'completed' | 'error' | 'mapping-complete'
}

interface ProcessingProgressState {
  isProcessing: boolean
  processingProgress: number
  supabaseProgress: ProgressState
}

export function useProgressTracking() {
  const [state, setState] = useState<ProcessingProgressState>({
    isProcessing: false,
    processingProgress: 0,
    supabaseProgress: {
      percentage: 0,
      currentCount: 0,
      totalCount: 0,
      currentBatch: 0,
      totalBatches: 0,
      status: ''
    }
  })

  const showProcessingProgress = async (processingPromise: Promise<any>) => {
    setState(prev => ({ ...prev, processingProgress: 0 }))
    
    const progressInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        processingProgress: Math.min(prev.processingProgress + 2, 100)
      }))
    }, 50)

    try {
      await processingPromise
      clearInterval(progressInterval)
      setState(prev => ({ ...prev, processingProgress: 100 }))
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      clearInterval(progressInterval)
      throw error
    }
  }

  const updateSupabaseProgress = (progress: Partial<ProgressState>) => {
    setState(prev => ({
      ...prev,
      supabaseProgress: { ...prev.supabaseProgress, ...progress }
    }))
  }

  const resetProgress = () => {
    setState({
      isProcessing: false,
      processingProgress: 0,
      supabaseProgress: {
        percentage: 0,
        currentCount: 0,
        totalCount: 0,
        currentBatch: 0,
        totalBatches: 0,
        status: ''
      }
    })
  }

  const setProcessing = (isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }))
  }

  return {
    ...state,
    showProcessingProgress,
    updateSupabaseProgress,
    resetProgress,
    setProcessing
  }
}
