"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"

interface LoadingSkeletonProps {
  showPdfPreview?: boolean
}

export function LoadingSkeleton({ showPdfPreview = false }: LoadingSkeletonProps) {
  return (
    <div className="flex gap-2">
      {/* Invoice Table Loading */}
      <div className="w-1/2">
        <Card className="bg-white border-gray-200 shadow-sm pt-2" style={{ paddingBottom: "8px" }}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between pb-0 px-4 pt-0">
              <div className="flex items-center gap-2 text-base pb-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Loading indicator */}
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading invoices...</span>
                </div>
              </div>
              
              {/* Table header skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-8 w-6" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
              
              {/* Table rows skeleton */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Skeleton className="h-12 w-6" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PDF Preview Loading */}
      {showPdfPreview && (
        <div className="w-1/2 h-[calc(100vh-2rem)]">
          <Card className="bg-white border-gray-200 shadow-sm h-full pt-0" style={{ paddingBottom: 0 }}>
            <CardContent className="h-full p-0 flex flex-col">
              <div className="bg-white border border-gray-200 rounded-lg px-3 pt-2 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20" />
                </div>
                
                {/* Loading indicator for PDF preview */}
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading invoice preview...</span>
                  </div>
                </div>
                
                {/* Invoice Header Skeleton */}
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-2">
                    <div>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-4 w-12 mb-1" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className="mb-2 flex-1 flex flex-col">
                  <div className="border-t border-gray-300 pt-2 flex-1 flex flex-col">
                    {/* Table header skeleton */}
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    
                    {/* Table rows skeleton */}
                    <div className="flex-1 space-y-1">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Totals skeleton */}
                    <div className="border-t border-gray-300 mt-2 pt-2">
                      <div className="grid grid-cols-5 gap-2">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
