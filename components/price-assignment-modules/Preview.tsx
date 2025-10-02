"use client"

import { useState } from "react"
import { UploadTable } from "./UploadTable"
import { GenerateTable } from "./GenerateTable"

// Dummy data for uploaded file section
const dummyUploadedData = [
  {
    origin: "USFRAT",
    destination: "USRIXT",
    inbound: "BT234",
    outbound: ""
  },
  {
    origin: "USFRAT",
    destination: "USROMT",
    inbound: "BT234",
    outbound: "BT633"
  },
  {
    origin: "USFRAT",
    destination: "USROMT",
    inbound: "BT234",
    outbound: "BT633"
  },
  {
    origin: "LTVNOA",
    destination: "CLSCLE",
    inbound: "BT965",
    outbound: "BT965"
  }
]

// Dummy data for system generated section
const dummyGeneratedData = [
  {
    origin: "FRA",
    beforeBT: "FRA → DUS",
    inbound: "BT234, DUS → RIX",
    outbound: "n/a",
    afterBT: "n/a",
    destination: "RIX",
    appliedRate: "DUS → RIX, €3.00"
  },
  {
    origin: "EVN",
    beforeBT: "(EVN -> RMO)",
    inbound: "BT421, (RMO -> RIX)",
    outbound: "BT651, (RIX -> LGW)",
    afterBT: "(LGW -> CVT)",
    destination: "CVT",
    appliedRate: "DUS → RIX, €3.00"
  },
  {
    origin: "VIE",
    beforeBT: "n/a",
    inbound: "BT272, (VIE -> RIX)",
    outbound: "BT651, (RIX -> RMO)",
    afterBT: "(RMO -> KIV)",
    destination: "KIV",
    appliedRate: "DUS → RIX, €3.00"
  },
  {
    origin: "VNO",
    beforeBT: "n/a",
    inbound: "n/a",
    outbound: "BT965 (VNO -> CDG)",
    afterBT: "(CDG -> SCL)",
    destination: "SCL",
    appliedRate: "VNO → CDG, €3.00"
  }
]

export function Preview() {
  const [uploadData, setUploadData] = useState(dummyUploadedData)
  const [refreshGenerateTable, setRefreshGenerateTable] = useState(0)

  const handleUploadDataChange = (data: any[]) => {
    setUploadData(data)
    // Trigger GenerateTable refresh
    setRefreshGenerateTable(prev => prev + 1)
  }

  return (
    <div className="space-y-4">
      {/* Upload and Generate Sections - Inline with 40-60 split */}
      <div className="grid grid-cols-10 gap-3">
        {/* Upload Section - 40% */}
        <div className="col-span-4">
          <UploadTable 
            data={uploadData} 
            onDataChange={handleUploadDataChange} 
          />
        </div>

        {/* Generate Section - 60% */}
        <div className="col-span-6">
          <GenerateTable data={dummyGeneratedData} refreshTrigger={refreshGenerateTable} />
        </div>
      </div>
    </div>
  )
}