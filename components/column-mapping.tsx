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

export function ColumnMapping({ excelColumns, sampleData, onMappingComplete }: ColumnMappingProps) {
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-black mb-2">Map Your Columns</h2>
        <p className="text-gray-600">Map your Excel columns to the final export format</p>
      </div>

      {/* Progress Header */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-black flex items-center justify-between">
            <span>Column Mapping Progress</span>
            <span className="text-sm font-normal text-gray-600">
              {getMappedCount()} / {getTotalCount()} columns mapped
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Column Mapping Interface */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                Excel Column
              </div>
              <p className="text-xs text-gray-500">Column headers from raw Excel file</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">Mapped</div>
              <p className="text-xs text-gray-500">
                {getMappedCount()} / {getTotalCount()} mapped
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                Final Export Column
              </div>
              <p className="text-xs text-gray-500">Column headers of final export file</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-6 items-center py-4 border-b border-gray-100 last:border-b-0"
              >
                {/* Excel Column */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-600">
                      {index + 1}
                    </div>
                    <span className="font-medium text-black">{mapping.excelColumn}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-8">
                    {mapping.sampleData.slice(0, 2).map((sample, i) => (
                      <div key={i} className="truncate">
                        {sample}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mapping Status */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    {mapping.status === "mapped" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : mapping.status === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Final Export Column */}
                <div className="space-y-2">
                  <Select
                    value={mapping.mappedTo || "unmapped"}
                    onValueChange={(value) => handleMappingChange(mapping.excelColumn, value)}
                  >
                    <SelectTrigger className="w-full">
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
                  {mapping.status === "mapped" && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Mapped successfully
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {getMappedCount() === getTotalCount() ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  All columns mapped successfully
                </span>
              ) : (
                <span>{getTotalCount() - getMappedCount()} columns still need mapping</span>
              )}
            </div>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleContinue}>
              Continue to Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
