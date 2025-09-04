"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Play,
  ArrowLeft
} from "lucide-react"
import { useCustomerRules } from "./hooks"
import { AssignCustomersProps, ViewType } from "./types"

interface ExecuteRulesProps extends Pick<AssignCustomersProps, 'data'> {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

export function ExecuteRules({ data, currentView, setCurrentView }: ExecuteRulesProps) {
  const { rules } = useCustomerRules()

  if (currentView === "rules") {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-black">Cargo Data Preview</CardTitle>
              <p className="text-sm text-gray-600">Preview of cargo data that will be processed by automation rules</p>
            </div>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => setCurrentView("results")}
            >
              <Play className="h-4 w-4 mr-2" />
              Execute All Rules
            </Button>
          </div>
          <div className="flex justify-end">
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total Records: <strong className="text-black">1,000</strong></span>
              <span>Total Weight: <strong className="text-black">25,432.5 kg</strong></span>
              <span>Avg Weight: <strong className="text-black">25.4 kg</strong></span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="border border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="border">Inb.Flight Date</TableHead>
                  <TableHead className="border">Outb.Flight Date</TableHead>
                  <TableHead className="border">Rec. ID</TableHead>
                  <TableHead className="border">Des. No.</TableHead>
                  <TableHead className="border">Rec. Numb.</TableHead>
                  <TableHead className="border">Orig. OE</TableHead>
                  <TableHead className="border">Dest. OE</TableHead>
                  <TableHead className="border">Inb. Flight No.</TableHead>
                  <TableHead className="border">Outb. Flight No.</TableHead>
                  <TableHead className="border">Mail Cat.</TableHead>
                  <TableHead className="border">Mail Class</TableHead>
                  <TableHead className="border text-right">Total kg</TableHead>
                  <TableHead className="border">Invoice</TableHead>
                  <TableHead className="border bg-yellow-200">Customer</TableHead>
                  <TableHead className="border bg-yellow-200">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 20 }, (_, index) => {
                  const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
                  const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
                  const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
                  const mailCats = ["A", "B", "C", "D", "E"]
                  const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
                  const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
                  
                  const year = 2025
                  const month = Math.floor(Math.random() * 12) + 1
                  const day = Math.floor(Math.random() * 28) + 1
                  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
                  
                  const inbDate = `${year} ${monthNames[month - 1]} ${day.toString().padStart(2, '0')}`
                  const outbDate = `${year} ${monthNames[month - 1]} ${(day + 1).toString().padStart(2, '0')}`
                  
                  const origOE = origins[Math.floor(Math.random() * origins.length)]
                  const destOE = destinations[Math.floor(Math.random() * destinations.length)]
                  const mailCat = mailCats[Math.floor(Math.random() * mailCats.length)]
                  const mailClass = mailClasses[Math.floor(Math.random() * mailClasses.length)]
                  
                  const desNo = (50700 + Math.floor(Math.random() * 100)).toString()
                  const recNumb = (Math.floor(Math.random() * 999) + 1).toString().padStart(3, '0')
                  const recId = `${origOE}${destOE}${mailCat}${mailClass}${desNo}${recNumb}${(70000 + Math.floor(Math.random() * 9999)).toString()}`
                  
                  const customers = [
                    "POST DANMARK A/S / QDKCPHA",
                    "DIRECT LINK WORLWIDE INC. / QDLW", 
                    "POSTNORD SVERIGE AB / QSTO",
                    "Premium Express Ltd",
                    "Nordic Post AS",
                    "Baltic Express Network",
                    "Cargo Masters International"
                  ]
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="border">{inbDate}</TableCell>
                      <TableCell className="border">{outbDate}</TableCell>
                      <TableCell className="border font-mono text-xs">{recId}</TableCell>
                      <TableCell className="border">{desNo}</TableCell>
                      <TableCell className="border">{recNumb}</TableCell>
                      <TableCell className="border">{origOE}</TableCell>
                      <TableCell className="border">{destOE}</TableCell>
                      <TableCell className="border">{flightNos[Math.floor(Math.random() * flightNos.length)]}</TableCell>
                      <TableCell className="border">{flightNos[Math.floor(Math.random() * flightNos.length)]}</TableCell>
                      <TableCell className="border">{mailCat}</TableCell>
                      <TableCell className="border">{mailClass}</TableCell>
                      <TableCell className="border text-right">{(Math.random() * 50 + 0.1).toFixed(1)}</TableCell>
                      <TableCell className="border">{invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)]}</TableCell>
                      <TableCell className="border text-xs bg-yellow-200">{customers[Math.floor(Math.random() * customers.length)]}</TableCell>
                      <TableCell className="border text-xs bg-yellow-200">{(Math.random() * 15 + 2.5).toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500">
              This data will be processed by the active automation rules to assign customers and rates
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Results View
  if (currentView === "results" && data) {
    return (
      <>
        {/* Navigation Button */}
        <div className="flex justify-start mb-4">
          <Button 
            variant="default"
            size="sm"
            onClick={() => setCurrentView("rules")}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preview
          </Button>
        </div>

        {/* Data Table Display */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-black flex items-center gap-2">
                <Play className="h-5 w-5" />
                Cargo Data Table
              </CardTitle>
            </div>
            <p className="text-gray-600 text-sm">
              Showing {data.data.length} cargo records with automation rules applied
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record ID</TableHead>
                    <TableHead>Flight Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Flight No.</TableHead>
                    <TableHead>Mail Cat.</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Assigned Team</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row: any, index: number) => {
                    // Apply rule matching logic to determine assigned team
                    const matchedRule = rules.find(rule => {
                      if (!rule.is_active) return false
                      return rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        const conditionValue = condition.value.toLowerCase()
                        
                        switch (condition.operator) {
                          case 'contains':
                            return fieldValue.includes(conditionValue)
                          case 'equals':
                            return fieldValue === conditionValue
                          case 'greater_than':
                            return parseFloat(fieldValue) > parseFloat(conditionValue)
                          case 'less_than':
                            return parseFloat(fieldValue) < parseFloat(conditionValue)
                          default:
                            return false
                        }
                      })
                    })

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {String(row["Rec. ID"] || row["Record ID"] || `REC-${index + 1}`).substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          {row["Inb.Flight Date"] || row["Flight Date"] || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{row["Orig. OE"] || "N/A"}</span>
                            <span>→</span>
                            <span>{row["Dest. OE"] || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row["Inb. Flight No."] || row["Flight No."] || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row["Mail Cat."] || row["Category"] || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row["Total kg"] || row["Weight"] || "0.0"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {String(row["Customer name / number"] || row["Customer"] || "Unknown").split("/")[0].trim()}
                        </TableCell>
                        <TableCell>
                          {matchedRule ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {matchedRule.actions.assignTo}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {matchedRule ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Processed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{data.data.length}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.data.filter((row: any) => 
                      rules.some(rule => rule.is_active && rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        return fieldValue.includes(condition.value.toLowerCase())
                      }))
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.data.length - data.data.filter((row: any) => 
                      rules.some(rule => rule.is_active && rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        return fieldValue.includes(condition.value.toLowerCase())
                      }))
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{rules.filter(r => r.is_active).length}</div>
                  <div className="text-sm text-gray-600">Rules Applied</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return null
}
