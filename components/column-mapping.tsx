"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react"
import type { ColumnMappingRule } from "@/lib/file-processor"
import { useColumnMappingStore } from "@/store/column-mapping-store"
import { useHydration } from "@/hooks/use-hydration"
import { useColumnMappingPersistence } from "@/hooks/use-column-mapping-persistence"
import { useToast } from "@/hooks/use-toast"

interface ColumnMappingProps {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  onMappingComplete: (mappings: ColumnMappingRule[]) => void
  onCancel?: () => void
  dataSource: "mail-agent" | "mail-system"
  totalRows?: number
}

const FINAL_EXPORT_COLUMNS = [
  "Inb.Flight Date",
  "Outb.Flight Date", 
  "Rec. ID",
  "Des. No.",
  "Rec. Numb.",
  "Orig. OE",
  "Dest. OE",
  "Inb. Flight No. | STA",
  "Outb. Flight No. | STD",
  "Mail Cat.",
  "Mail Class",
  "Total kg",
]

export function ColumnMapping({ excelColumns, sampleData, onMappingComplete, onCancel, dataSource, totalRows }: ColumnMappingProps) {
  const { 
    getColumnMapping, 
    setColumnMapping, 
    updateMappings, 
    clearColumnMapping
  } = useColumnMappingStore()
  
  const isHydrated = useHydration()
  const { isLoaded, saveMapping, clearMapping, getMatchingMapping } = useColumnMappingPersistence(dataSource)
  const { toast } = useToast()
  const [mappings, setMappings] = useState<ColumnMappingRule[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  
  // Initialize mappings from store or create default ones
  useEffect(() => {
    // Wait for both hydration and localStorage loading
    if (!isHydrated || !isLoaded) {
      return
    }
    
    // Don't run if no excel columns
    if (excelColumns.length === 0) {
      return
    }
    
    // Try to get stored mapping using the persistence hook
    const matchingMapping = getMatchingMapping(excelColumns)
    
    if (matchingMapping) {
      // Use stored mappings if columns match
      setMappings(matchingMapping.mappings)
    } else {
      // Create default mappings
      const defaultMappings = excelColumns.map((col, index) => ({
        excelColumn: col,
        mappedTo: index < FINAL_EXPORT_COLUMNS.length ? FINAL_EXPORT_COLUMNS[index] : null,
        finalColumn: FINAL_EXPORT_COLUMNS[index] || "Unmapped",
        status: (index < FINAL_EXPORT_COLUMNS.length ? "mapped" : "unmapped") as "mapped" | "unmapped" | "warning",
        sampleData: sampleData[col] || [],
      }))
      setMappings(defaultMappings)
      
      // Save to both Zustand store and localStorage
      setColumnMapping(dataSource, excelColumns, sampleData, defaultMappings)
      saveMapping(excelColumns, sampleData, defaultMappings)
    }
    
    setHasInitialized(true)
  }, [excelColumns, sampleData, dataSource, isHydrated, isLoaded])

  const handleMappingChange = (excelColumn: string, finalColumn: string) => {
    setMappings((prev) => {
      const newMappings = prev.map((mapping) => {
        if (mapping.excelColumn === excelColumn) {
          // If mapping to a specific column, check for conflicts
          let status: "mapped" | "unmapped" | "warning" = "mapped"
          
          if (finalColumn === "unmapped") {
            status = "unmapped"
          } else {
            // Check if this final column is already mapped by another excel column
            const isAlreadyMapped = prev.some(
              (m) => m.excelColumn !== excelColumn && m.mappedTo === finalColumn
            )
            if (isAlreadyMapped) {
              status = "warning"
            }
          }
          
          return {
            ...mapping,
            mappedTo: finalColumn === "unmapped" ? null : finalColumn,
            finalColumn: finalColumn === "unmapped" ? "Unmapped" : finalColumn,
            status,
          }
        }
        
        // Update status of other mappings if they conflict with the new mapping
        if (mapping.mappedTo === finalColumn && finalColumn !== "unmapped") {
          return {
            ...mapping,
            status: "warning" as const,
          }
        }
        
        // Reset status if conflict is resolved
        if (mapping.status === "warning" && mapping.mappedTo && finalColumn !== mapping.mappedTo) {
          const stillHasConflict = prev.some(
            (m) => m.excelColumn !== mapping.excelColumn && 
                   m.excelColumn !== excelColumn && 
                   m.mappedTo === mapping.mappedTo
          )
          if (!stillHasConflict) {
            return {
              ...mapping,
              status: "mapped" as const,
            }
          }
        }
        
        return mapping
      })
      
      return newMappings
    })
  }
  
  // Update store and localStorage when mappings change
  useEffect(() => {
    if (mappings.length > 0 && hasInitialized) {
      updateMappings(dataSource, mappings)
      saveMapping(excelColumns, sampleData, mappings)
    }
  }, [mappings, dataSource, hasInitialized]) // Removed updateMappings and saveMapping from dependencies

  const getMappedCount = () => mappings.filter((m) => m.status === "mapped").length
  const getTotalCount = () => mappings.length
  const getConflictCount = () => mappings.filter((m) => m.status === "warning").length

  const hasConflicts = () => getConflictCount() > 0

  // Show processing progress that syncs with actual processing
  const showProcessingProgress = async (processingPromise: Promise<any>) => {
    // Start with initial progress
    setProcessingProgress(10)
    
    // Create a progress interval that gradually increases
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        // Gradually increase progress but don't go above 90% until processing is done
        const newProgress = Math.min(prev + Math.random() * 15, 90)
        return Math.round(newProgress)
      })
    }, 200)

    try {
      // Wait for the actual processing to complete
      await processingPromise
      
      // Clear the interval and set to 100%
      clearInterval(progressInterval)
      setProcessingProgress(100)
      
      // Wait a moment to show 100% before completing
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } catch (error) {
      // Clear interval on error
      clearInterval(progressInterval)
      throw error
    }
  }

  const handleContinue = async () => {
    if (hasConflicts()) {
      toast({
        title: "Mapping Conflicts Detected",
        description: "Please resolve mapping conflicts before continuing. Multiple Excel columns cannot be mapped to the same final column.",
        variant: "destructive",
      })
      return
    }
    
    if (mappings.length === 0) {
      toast({
        title: "No Mappings Available",
        description: "Please wait for column mappings to be initialized.",
        variant: "destructive",
      })
      return
    }
    
    setIsProcessing(true)
    setProcessingProgress(0)
    
    try {
      // Start the actual mapping completion
      const mappingPromise = Promise.resolve(onMappingComplete(mappings))
      
      // Show progress that syncs with the actual processing
      await showProcessingProgress(mappingPromise)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process column mappings"
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const handleCancel = () => {
    // Clear the stored mapping when canceling
    clearColumnMapping(dataSource)
    clearMapping()
    onCancel?.()
  }

  return (
    <div className="space-y-1 pt-1 max-w-xl mx-auto">
      {/* Single Card with All Components */}
      <Card className="bg-white border-gray-200 shadow-sm" style={{ paddingBottom: "8px", paddingTop: "8px" }}>
        <CardContent className="space-y-1">
          <CardTitle className="text-lg">Column Mapping</CardTitle>
          {/* File Info */}
          {totalRows && (
            <div className="text-xs text-gray-500 pb-1">
              Processing {totalRows.toLocaleString()} rows of data
            </div>
          )}
          {/* Mapping Summary */}
          <div className="flex items-center justify-between text-sm pb-1">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">
                Mapped: <strong className="text-green-600">{getMappedCount()}</strong>
              </span>
              <span className="text-gray-600">
                Unmapped: <strong className="text-gray-500">{getTotalCount() - getMappedCount() - getConflictCount()}</strong>
              </span>
              {getConflictCount() > 0 && (
                <span className="text-gray-600">
                  Conflicts: <strong className="text-red-600">{getConflictCount()}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Processing Progress Bar - Only shown during processing */}
          {isProcessing && (
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
          
          {hasConflicts() && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                Please resolve mapping conflicts. Multiple Excel columns cannot be mapped to the same final column.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pb-2">
            <div>
              {onCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Column Mapping?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel? This will reset the upload and return to the upload step. All mapping progress will be lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Continue Mapping</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
                        Yes, Cancel and Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Button 
              size="sm" 
              className={`${
                hasConflicts() 
                  ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                  : "bg-black hover:bg-gray-800"
              } text-white`}
              onClick={handleContinue}
              disabled={isProcessing || hasConflicts()}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Continue to Next Step'}
            </Button>
          </div>


          {/* Column Mapping Table */}
          <div className="border-t border-gray-200 pt-0">
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="w-8 text-center py-1 text-xs">No</TableHead>
                <TableHead className="py-1 text-xs">Excel Column</TableHead>
                <TableHead className="py-1 text-xs">Final Export Column</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow 
                  key={index}
                  className={`h-8 ${mapping.status === "warning" ? "bg-red-50 border-red-200" : ""}`}
                >
                  <TableCell className="text-center py-1">
                    <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-600 mx-auto">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="min-w-0">
                      <div className="font-medium text-black text-xs truncate">{mapping.excelColumn}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {mapping.sampleData[0] && mapping.sampleData[0].substring(0, 25)}
                        {mapping.sampleData[0] && mapping.sampleData[0].length > 25 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <Select
                      value={mapping.mappedTo || "unmapped"}
                      onValueChange={(value) => handleMappingChange(mapping.excelColumn, value)}
                    >
                      <SelectTrigger 
                        className={`w-full h-6 text-xs ${
                          mapping.status === "warning" 
                            ? "border-red-300 focus:border-red-500" 
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select mapping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">
                          <span className="text-gray-500">Don't map</span>
                        </SelectItem>
                        {FINAL_EXPORT_COLUMNS.map((col) => {
                          // Check if this column is already mapped by another excel column
                          const isUsedByOther = mappings.some(
                            (m) => m.excelColumn !== mapping.excelColumn && m.mappedTo === col
                          )
                          return (
                            <SelectItem 
                              key={col} 
                              value={col}
                              className={isUsedByOther ? "text-red-600" : ""}
                            >
                              {col} {isUsedByOther && "(⚠️ Already used)"}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


