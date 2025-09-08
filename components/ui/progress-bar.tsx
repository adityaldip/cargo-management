"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Loader2, CheckCircle, XCircle } from "lucide-react"

interface ProgressBarProps {
  isVisible: boolean
  progress: number
  currentStep: string
  totalSteps: number
  currentStepIndex: number
  estimatedTimeRemaining?: number
  error?: string
  onCancel?: () => void
  onStop?: () => void
  isStopping?: boolean
}

export function ProgressBar({
  isVisible,
  progress,
  currentStep,
  totalSteps,
  currentStepIndex,
  estimatedTimeRemaining,
  error,
  onCancel,
  onStop,
  isStopping = false
}: ProgressBarProps) {
  if (!isVisible) return null

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)} detik`
    } else {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.round(seconds % 60)
      return `${minutes}m ${remainingSeconds}s`
    }
  }

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-5 w-5 text-red-600" />
    if (progress >= 100) return <CheckCircle className="h-5 w-5 text-green-600" />
    return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
  }

  const getStatusText = () => {
    if (error) return "Gagal menghapus data"
    if (isStopping) return "Menghentikan proses..."
    if (progress >= 100) return "Data berhasil dihapus"
    return "Sedang menghapus data..."
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg text-gray-900">
                {getStatusText()}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {error ? error : currentStep}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!error && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900 font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Langkah {currentStepIndex + 1} dari {totalSteps}</span>
                {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                  <span>Estimasi: {formatTime(estimatedTimeRemaining)}</span>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Terjadi kesalahan saat menghapus data</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            {onStop && !error && progress < 100 && !isStopping && (
              <button
                onClick={onStop}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Hentikan Proses
              </button>
            )}
            {onCancel && !error && progress < 100 && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batalkan
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              disabled={isStopping}
            >
              {error ? "Tutup" : progress >= 100 ? "Selesai" : "Tutup"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
