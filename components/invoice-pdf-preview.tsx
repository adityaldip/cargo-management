"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { generateInvoicePDF, type Invoice } from "@/lib/pdf-generator"

interface InvoicePdfPreviewProps {
  selectedInvoice: Invoice | null
}

export function InvoicePdfPreview({ selectedInvoice }: InvoicePdfPreviewProps) {
  if (!selectedInvoice) {
    return null
  }

  return (
    <div className="w-1/2">
      <Card className="bg-white border-gray-200 shadow-sm h-full pt-0" style={{ paddingBottom: 0 }}>
        <CardContent className="h-full p-0 flex flex-col">          
          <div className="bg-white border border-gray-200 rounded-lg px-3 pt-2 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between pb-2">
              <CardTitle className="text-black flex items-center gap-1 text-sm pb-2">
                <FileText className="h-3 w-3" />
                Invoice Preview
              </CardTitle>
              <Button 
                size="sm" 
                className="flex items-center gap-1 h-7 px-2 text-sm"
                onClick={() => generateInvoicePDF(selectedInvoice)}
              >
                <Download className="h-3 w-3" />
                Download PDF
              </Button>
            </div>                  
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-800 mb-1">ISSUED TO:</h2>
                  <div className="text-sm text-gray-700">
                    <div>{selectedInvoice.customer}</div>
                    <div>123 Business Street</div>
                    <div>Business City, BC 12345</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 mb-1">PAY TO:</h2>
                  <div className="text-sm text-gray-700">
                    <div>Cargo Management Ltd</div>
                    <div>Account Name: Cargo Management</div>
                    <div>Account No.: 1234 5678 9012</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-between w-40">
                  <span className="text-sm text-gray-700">INVOICE NO:</span>
                  <span className="text-sm font-semibold">{selectedInvoice.invoiceNumber}</span>
                </div>
              </div>
            </div>

            {/* Cargo Shipment Details Table */}
            <div className="mb-2">
              <div className="border-t border-gray-300 pt-2">
                <div className="grid grid-cols-5 gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <div>SECTOR</div>
                  <div>MAIL CAT.</div>
                  <div className="text-right">TOTAL KG</div>
                  <div className="text-right">RATE</div>
                  <div className="text-right">TOTAL EUR</div>
                </div>
                
                {/* Sample cargo data */}
                <div className="space-y-1">
                  {[
                    { sector: 'DUS RIX', mailCat: 'A,B', totalKg: 16.6, rate: 1.0, totalEur: 16.6 },
                    { sector: 'VNO FRA', mailCat: 'A,B', totalKg: 22.2, rate: 0.85, totalEur: 18.87 },
                    { sector: 'BUD ATH', mailCat: 'A,B', totalKg: 138.5, rate: 1.0, totalEur: 138.5 },
                    { sector: 'ATH RIX', mailCat: 'A,B', totalKg: 248.2, rate: 0.85, totalEur: 210.97 },
                    { sector: 'ATH ARN', mailCat: 'A,B', totalKg: 45.3, rate: 0.9, totalEur: 40.77 },
                    { sector: 'ATH KEF', mailCat: 'A,B', totalKg: 12.8, rate: 0.85, totalEur: 10.88 },
                    { sector: 'ATH RMO', mailCat: 'A,B', totalKg: 67.4, rate: 0.9, totalEur: 60.66 },
                    { sector: 'ATH LJU', mailCat: 'A,B', totalKg: 23.1, rate: 0.8, totalEur: 18.48 },
                    { sector: 'OSL TLL', mailCat: 'A,B', totalKg: 0.1, rate: 0.9, totalEur: 0.09 },
                    { sector: 'BUD VNO', mailCat: 'A,B', totalKg: 2490.7, rate: 0.8523908941, totalEur: 2123.05 }
                  ].map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 text-sm text-gray-700 py-0.5">
                      <div className="font-mono">{item.sector}</div>
                      <div>{item.mailCat}</div>
                      <div className="text-right">{item.totalKg}</div>
                      <div className="text-right">{item.rate}</div>
                      <div className="text-right font-semibold">€{item.totalEur.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-300 mt-2 pt-2">
                  <div className="grid grid-cols-5 gap-2 text-sm font-bold text-gray-800">
                    <div>TOTAL</div>
                    <div></div>
                    <div className="text-right">9952.7</div>
                    <div className="text-right">0.8511680248</div>
                    <div className="text-right">€8471.42</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
