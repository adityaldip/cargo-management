"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react"
import type { ColumnMappingRule } from "@/lib/file-processor"

interface ColumnMappingProps {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  onMappingComplete: (mappings: ColumnMappingRule[]) => void
  onCancel?: () => void
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
  "Invoice",
  "Customer name / number",
]

export function ColumnMapping({ excelColumns, sampleData, onMappingComplete, onCancel }: ColumnMappingProps) {
  const [mappings, setMappings] = useState<ColumnMappingRule[]>(() => {
    return excelColumns.map((col, index) => ({
      excelColumn: col,
      mappedTo: index < FINAL_EXPORT_COLUMNS.length ? FINAL_EXPORT_COLUMNS[index] : null,
      finalColumn: FINAL_EXPORT_COLUMNS[index] || "Unmapped",
      status: (index < FINAL_EXPORT_COLUMNS.length ? "mapped" : "unmapped") as "mapped" | "unmapped" | "warning",
      sampleData: sampleData[col] || [],
    }))
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMappingChange = (excelColumn: string, finalColumn: string) => {
    setMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.excelColumn === excelColumn) {
          return {
            ...mapping,
            mappedTo: finalColumn === "unmapped" ? null : finalColumn,
            finalColumn: finalColumn === "unmapped" ? "Unmapped" : finalColumn,
            status: finalColumn === "unmapped" ? "unmapped" : "mapped",
          }
        }
        return mapping
      }),
    )
  }

  const getMappedCount = () => mappings.filter((m) => m.status === "mapped").length
  const getTotalCount = () => mappings.length

  const handleContinue = async () => {
    setIsProcessing(true)
    try {
      await onMappingComplete(mappings)
    } catch (error) {
      console.error('Error processing mappings:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4 pt-2 max-w-xl mx-auto">
      {/* Column Mapping Interface */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Excel Column</TableHead>
                <TableHead>Final Export Column</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">
                    <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-600 mx-auto">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="font-medium text-black text-sm truncate">{mapping.excelColumn}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {mapping.sampleData[0] && mapping.sampleData[0].substring(0, 30)}
                        {mapping.sampleData[0] && mapping.sampleData[0].length > 30 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping.mappedTo || "unmapped"}
                      onValueChange={(value) => handleMappingChange(mapping.excelColumn, value)}
                    >
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue placeholder="Select mapping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">
                          <span className="text-gray-500">Don't map</span>
                        </SelectItem>
                        {FINAL_EXPORT_COLUMNS.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div>
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-gray-800 text-white" 
              onClick={handleContinue}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Continue to Next Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
