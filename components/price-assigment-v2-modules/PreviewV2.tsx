"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PreviewTable } from "./PreviewTable"

export function PreviewV2() {
  const [previewData, setPreviewData] = useState<any[]>([])

  const handleDataChange = (data: any[]) => {
    setPreviewData(data)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <PreviewTable 
            data={previewData} 
            onDataChange={handleDataChange} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
