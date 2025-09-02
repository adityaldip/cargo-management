"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"

interface ColumnMapping {
  excelColumn: string
  mappedTo: string | null
  finalColumn: string
  status: "mapped" | "unmapped" | "warning"
  sampleData: string[]
}

interface ColumnMappingProps {
  excelColumns: string[]
  sampleData: Record<string, string[]>
  onMappingComplete: (mappings: ColumnMapping[]) => void
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
  const [mappings, setMappings] = useState<ColumnMapping[]>(() => {
    return excelColumns.map((col, index) => ({
      excelColumn: col,
      mappedTo: index < FINAL_EXPORT_COLUMNS.length ? FINAL_EXPORT_COLUMNS[index] : null,
      finalColumn: FINAL_EXPORT_COLUMNS[index] || "Unmapped",
      status: index < FINAL_EXPORT_COLUMNS.length ? "mapped" : "unmapped",
      sampleData: sampleData[col] || [],
    }))
  })

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

  const handleContinue = () => {
    onMappingComplete(mappings)
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Column Mapping Interface */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-0">
          <div className="grid grid-cols-3 gap-1 mt-1">
            <div className="text-center">
              <div className="bg-black text-white px-1 py-2 rounded text-xs font-medium">
                Excel Column
              </div>
            </div>
            <div className="text-center">
              {/* <div className="bg-blue-100 text-blue-800 px-1 py-2 rounded text-xs font-medium">
                {getMappedCount()}/{getTotalCount()}
              </div> */}
            </div>
            <div className="text-center">
              <div className="bg-black text-white px-1 py-2 rounded text-xs font-medium">
                Final Export Column
              </div>
            </div>
          </div>
        </CardHeader> 
        <CardContent className="pt-0">
          <div className="space-y-1">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 items-center py-1"
              >
                {/* Excel Column */}
                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-600 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-black text-sm truncate">{mapping.excelColumn}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {mapping.sampleData[0] && mapping.sampleData[0].substring(0, 20)}
                      {mapping.sampleData[0] && mapping.sampleData[0].length > 20 && '...'}
                    </div>
                  </div>
                </div>

                {/* Mapping Status */}
                <div className="flex items-center justify-center">
                  {mapping.status === "mapped" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 border border-gray-300 rounded-full" />
                  )}
                </div>

                {/* Final Export Column */}
                <div>
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
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div>
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            <Button size="sm" className="bg-black hover:bg-gray-800 text-white" onClick={handleContinue}>
              Continue to Next Step
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
