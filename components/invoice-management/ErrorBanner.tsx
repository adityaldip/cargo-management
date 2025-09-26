"use client"

import { WarningBanner } from "@/components/ui/status-banner"

interface ErrorBannerProps {
  error: string | null
  className?: string
}

export function ErrorBanner({ error, className }: ErrorBannerProps) {
  if (!error) return null

  return (
    <WarningBanner 
      message={`Error loading real data: ${error}`}
      className={`mb-4 bg-red-50 border-red-200 text-red-800 ${className || ''}`}
    />
  )
}
