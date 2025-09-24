"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ColumnMappingRule } from "@/lib/file-processor"
import { FINAL_EXPORT_COLUMNS } from "@/lib/mapping-utils"

interface MappingTableProps {
  mappings: ColumnMappingRule[]
  onMappingChange: (excelColumn: string, finalColumn: string) => void
}

export function MappingTable({ mappings, onMappingChange }: MappingTableProps) {
  return (
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
                  onValueChange={(value) => onMappingChange(mapping.excelColumn, value)}
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
  )
}
