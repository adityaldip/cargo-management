"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Swal from 'sweetalert2'

// Dummy data for preview table
const dummyPreviewData = [
  {
    id: "1",
    origin: "USFRAT",
    destination: "USRIXT",
    beforeBT: "FRA → DUS",
    inbound: "BT234, DUS → RIX",
    outbound: "BT601, RIX → AMS",
    afterBT: "n/a",
    finalDestination: "RIX",
    sectorRates: "All rates available",
    appliedRate: "DUS → RIX, €3.00",
    is_valid_inbound: true,
    is_valid_outbound: true
  },
  {
    id: "2",
    origin: "USFRAT",
    destination: "USROMT",
    beforeBT: "(EVN -> RMO)",
    inbound: "BT421, (RMO -> RIX)",
    outbound: "BT651, (RIX -> LGW)",
    afterBT: "(LGW -> CVT)",
    finalDestination: "CVT",
    sectorRates: "All rates available",
    appliedRate: "DUS → RIX, €3.00",
    is_valid_inbound: true,
    is_valid_outbound: true
  },
  {
    id: "3",
    origin: "USFRAT",
    destination: "USROMT",
    beforeBT: "n/a",
    inbound: "BT272, (VIE -> RIX)",
    outbound: "BT651, (RIX -> RMO)",
    afterBT: "(RMO -> KIV)",
    finalDestination: "KIV",
    sectorRates: "All rates available",
    appliedRate: "DUS → RIX, €3.00",
    is_valid_inbound: true,
    is_valid_outbound: true
  },
  {
    id: "4",
    origin: "LTVNOA",
    destination: "CLSCLE",
    beforeBT: "n/a",
    inbound: "n/a",
    outbound: "BT965 (VNO -> CDG)",
    afterBT: "(CDG -> SCL)",
    finalDestination: "SCL",
    sectorRates: "All rates available",
    appliedRate: "VNO → CDG, €3.00",
    is_valid_inbound: true,
    is_valid_outbound: true
  }
]

interface PreviewTableProps {
  data?: any[]
  onDataChange?: (data: any[]) => void
}

export function PreviewTable({ data = dummyPreviewData, onDataChange }: PreviewTableProps) {
  const [tableData, setTableData] = useState(data)

  const handleEdit = (record: any) => {
    // TODO: Implement edit functionality
    console.log('Edit record:', record)
  }

  const handleDeleteWithConfirmation = async (id: string, origin: string, destination: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${origin} → ${destination}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      const newData = tableData.filter(item => item.id !== id)
      setTableData(newData)
      onDataChange?.(newData)

      Swal.fire({
        title: 'Deleted!',
        text: 'Record has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    }
  }

  return (
    <div className="w-full">
      <div className="text-xs text-gray-500 w-full flex justify-center items-center mb-2">
        <p className="w-full text-center font-bold text-black">Preview Data</p>
      </div>
      <div className="w-full border-b border-black mb-2"></div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="text-xs py-1 min-w-[60px]">Origin</TableHead>
              <TableHead className="text-xs py-1 min-w-[60px]">Destination</TableHead>
              <TableHead className="text-xs py-1 min-w-[80px]">Before BT</TableHead>
              <TableHead className="text-xs py-1 min-w-[100px]">Inbound</TableHead>
              <TableHead className="text-xs py-1 min-w-[100px]">Outbound</TableHead>
              <TableHead className="text-xs py-1 min-w-[80px]">After BT</TableHead>
              <TableHead className="text-xs py-1 min-w-[60px]">Final Dest</TableHead>
              <TableHead className="text-xs py-1 min-w-[100px]">Sector Rates</TableHead>
              <TableHead className="text-xs py-1 min-w-[100px]">Applied Rate</TableHead>
              <TableHead className="text-xs py-1 min-w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id} className="h-8">
                <TableCell className="py-1 text-xs h-8">
                  {row.origin}
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  {row.destination}
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  {row.beforeBT || "n/a"}
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  <span className={!row.is_valid_inbound ? "text-red-500" : ""}>
                    {row.inbound || "n/a"}
                  </span>
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  <span className={!row.is_valid_outbound ? "text-red-500" : ""}>
                    {row.outbound || "n/a"}
                  </span>
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  {row.afterBT || "n/a"}
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  {row.finalDestination}
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  {row.sectorRates}
                </TableCell>
                <TableCell className="py-1 text-xs h-8">
                  {row.appliedRate}
                </TableCell>
                <TableCell className="py-1 h-8">
                  <div className="flex gap-0.5">
                    <Button
                      onClick={() => handleEdit(row)}
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteWithConfirmation(row.id, row.origin, row.destination)}
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
