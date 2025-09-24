"use client"

import { Progress } from "@/components/ui/progress"

interface ProgressDisplayProps {
  isProcessing: boolean
  processingProgress: number
  supabaseProgress: {
    percentage: number
    currentCount: number
    totalCount: number
    currentBatch: number
    totalBatches: number
    status: string
  }
}

export function ProgressDisplay({ isProcessing, processingProgress, supabaseProgress }: ProgressDisplayProps) {
  return (
    <>
      {/* Processing Progress Bar - Show during mapping processing ONLY */}
      {isProcessing && !supabaseProgress.status && (
        <div className="space-y-2 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Processing mappings...</span>
            <span>{processingProgress}%</span>
          </div>
          <Progress 
            value={processingProgress} 
            className="h-2"
          />
        </div>
      )}
      
      {/* Supabase Save Progress Bar - Show when saving to database */}
      {supabaseProgress.status && (
        <div className="space-y-2 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {supabaseProgress.status === 'preparing' && 'Preparing data...'}
              {supabaseProgress.status === 'saving' && 'Saving to database...'}
              {supabaseProgress.status === 'completed' && 'Save completed!'}
              {supabaseProgress.status === 'error' && 'Save failed'}
            </span>
            <span>{supabaseProgress.percentage}%</span>
          </div>
          <Progress 
            value={supabaseProgress.percentage} 
            className={`h-2 ${
              supabaseProgress.status === 'completed' ? 'bg-green-200' : 
              supabaseProgress.status === 'error' ? 'bg-red-200' : ''
            }`}
          />
          {supabaseProgress.totalCount > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {supabaseProgress.currentCount.toLocaleString()} / {supabaseProgress.totalCount.toLocaleString()} records
              </span>
              {supabaseProgress.totalBatches > 0 && (
                <span>
                  Batch {supabaseProgress.currentBatch} / {supabaseProgress.totalBatches}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
