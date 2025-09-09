"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, HardDrive, Trash2, CheckCircle } from "lucide-react"
import { getStorageQuotaInfo, performProgressiveCleanup, type StorageQuotaInfo } from "@/lib/storage-utils"
import { useToast } from "@/hooks/use-toast"

interface StorageMonitorProps {
  showDetails?: boolean
  onCleanupComplete?: () => void
}

export function StorageMonitor({ showDetails = false, onCleanupComplete }: StorageMonitorProps) {
  const [storageInfo, setStorageInfo] = useState<StorageQuotaInfo>({ 
    used: 0, 
    available: 0, 
    percentage: 0, 
    isNearLimit: false, 
    isFull: false 
  })
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupStatus, setCleanupStatus] = useState<string>("")
  const { toast } = useToast()

  const refreshStorageInfo = () => {
    const info = getStorageQuotaInfo()
    setStorageInfo(info)
  }

  useEffect(() => {
    refreshStorageInfo()
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshStorageInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleCleanup = async () => {
    setIsCleaningUp(true)
    setCleanupStatus("Starting cleanup...")

    try {
      const result = await performProgressiveCleanup((strategy, description, itemsRemoved) => {
        setCleanupStatus(`${description} - ${itemsRemoved} items removed`)
      })

      if (result.success) {
        toast({
          title: "Storage Cleanup Complete",
          description: `Successfully freed up space using ${result.strategiesUsed.length} cleanup strategies. ${result.totalItemsRemoved} items removed.`,
          duration: 5000,
        })
        
        refreshStorageInfo()
        onCleanupComplete?.()
      } else {
        toast({
          title: "Cleanup Partially Successful",
          description: `Tried ${result.strategiesUsed.length} strategies but storage is still near capacity. Consider manually removing large files.`,
          variant: "destructive",
          duration: 7000,
        })
      }
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "An error occurred during storage cleanup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCleaningUp(false)
      setCleanupStatus("")
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = () => {
    if (storageInfo.isFull) return "text-red-600"
    if (storageInfo.isNearLimit) return "text-orange-600"
    return "text-green-600"
  }

  const getProgressColor = () => {
    if (storageInfo.isFull) return "bg-red-500"
    if (storageInfo.isNearLimit) return "bg-orange-500"
    return "bg-green-500"
  }

  // Auto-cleanup when storage is near limit or full
  React.useEffect(() => {
    if (storageInfo.isNearLimit || storageInfo.isFull) {
      const performAutoCleanup = async () => {
        try {
          const result = await performProgressiveCleanup()
          
          if (result.success) {
            toast({
              title: "Storage Automatically Cleaned",
              description: `Freed up space using ${result.strategiesUsed.length} cleanup strategies. ${result.totalItemsRemoved} items removed to prevent storage issues.`,
              duration: 5000,
            })
            
            // Refresh storage info after cleanup
            refreshStorageInfo()
            onCleanupComplete?.()
          } else {
            // Only show warning if cleanup failed completely
            if (storageInfo.isFull) {
              toast({
                title: "Storage Full",
                description: "Automatic cleanup couldn't free enough space. Some features may be limited until space is available.",
                variant: "destructive",
                duration: 7000,
              })
            }
          }
        } catch (error) {
          console.error('Auto cleanup error:', error)
          if (storageInfo.isFull) {
            toast({
              title: "Storage Issue",
              description: "Storage is full and automatic cleanup failed. Some features may not work properly.",
              variant: "destructive",
              duration: 7000,
            })
          }
        }
      }

      // Debounce auto cleanup to prevent multiple triggers
      const timeoutId = setTimeout(performAutoCleanup, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [storageInfo.isNearLimit, storageInfo.isFull, toast, onCleanupComplete])

  // Don't render the component - auto cleanup handles everything
  return null
}
