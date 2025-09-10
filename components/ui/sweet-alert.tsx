"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, CheckCircle } from "lucide-react"

interface SweetAlertProps {
  isVisible: boolean
  title: string
  text: string
  type: "warning" | "error" | "success" | "info"
  showCancelButton?: boolean
  confirmButtonText?: string
  cancelButtonText?: string
  onConfirm: () => void
  onCancel?: () => void
  onClose: () => void
  disabled?: boolean
}

export function SweetAlert({
  isVisible,
  title,
  text,
  type,
  showCancelButton = true,
  confirmButtonText = "Ya, Hapus!",
  cancelButtonText = "Batal",
  onConfirm,
  onCancel,
  onClose,
  disabled = false
}: SweetAlertProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    }
  }, [isVisible])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />
      case "error":
        return <X className="h-12 w-12 text-red-500" />
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case "info":
        return <AlertTriangle className="h-12 w-12 text-blue-500" />
      default:
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case "warning":
        return "bg-red-600 hover:bg-red-700 text-white"
      case "error":
        return "bg-red-600 hover:bg-red-700 text-white"
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white"
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white"
      default:
        return "bg-red-600 hover:bg-red-700 text-white"
    }
  }

  const handleConfirm = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onConfirm()
      onClose()
    }, 150)
  }

  const handleCancel = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onCancel?.()
      onClose()
    }, 150)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/25 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Text */}
          <p className="text-gray-600 text-center mb-6">
            {text}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            {showCancelButton && (
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {cancelButtonText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={disabled}
              className={`px-6 py-2 text-sm rounded-lg transition-colors ${getConfirmButtonClass()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {disabled ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  {confirmButtonText}
                </div>
              ) : (
                confirmButtonText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
