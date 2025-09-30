"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { generateInvoicePDF, type Invoice } from "@/lib/pdf-generator"
import type { CargoInvoice, CargoInvoiceItem } from "@/types/cargo-data"

interface InvoicePdfPreviewProps {
  selectedInvoice: Invoice | CargoInvoice | null
}

export function InvoicePdfPreview({ selectedInvoice }: InvoicePdfPreviewProps) {
  if (!selectedInvoice) {
    return null
  }


  return (
    <div className="w-1/2 h-[calc(100vh-2rem)] flex flex-col">
      <Card className="bg-white border-gray-200 shadow-sm flex-1 pt-0" style={{ paddingBottom: 0 }}>
        <CardContent className="h-full p-0 flex flex-col">          
          <div className="bg-white border border-gray-200 rounded-lg px-3 pt-2 flex-1 flex flex-col min-h-0">
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
                    <div className="font-semibold">{selectedInvoice.customer}</div>
                    {(() => {
                      // Check if this is a CargoInvoice with customer details
                      const isCargoInvoice = 'customer_address' in selectedInvoice
                      
                      if (isCargoInvoice) {
                        const customer = selectedInvoice as CargoInvoice
                        return (
                          <>
                            {customer.customer_address && <div>{customer.customer_address}</div>}
                            {(customer.customer_city || customer.customer_state || customer.customer_postal_code) && (
                              <div>
                                {customer.customer_city && customer.customer_city}
                                {customer.customer_city && customer.customer_state && ', '}
                                {customer.customer_state && customer.customer_state}
                                {customer.customer_postal_code && ` ${customer.customer_postal_code}`}
                              </div>
                            )}
                            {customer.customer_country && <div>{customer.customer_country}</div>}
                            {customer.customer_contact_person && (
                              <div className="mt-1 text-xs text-gray-600">
                                Contact: {customer.customer_contact_person}
                              </div>
                            )}
                            {customer.customer_email && (
                              <div className="text-xs text-gray-600">
                                Email: {customer.customer_email}
                              </div>
                            )}
                            {customer.customer_phone && (
                              <div className="text-xs text-gray-600">
                                Phone: {customer.customer_phone}
                              </div>
                            )}
                          </>
                        )
                      } else {
                        // Fallback to hardcoded values for non-cargo invoices
                        return (
                          <>
                            <div>123 Business Street</div>
                            <div>Business City, BC 12345</div>
                          </>
                        )
                      }
                    })()}
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 mb-1">PAY TO:</h2>
                  <div className="text-sm text-gray-700">
                    <div>AirBaltic</div>
                    <div>Account Name: AirBaltic</div>
                    <div>Account No.: 1234 5678 9012</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <span className="text-sm text-gray-700">INVOICE NO:</span>
                  <span className="text-sm font-semibold">{selectedInvoice.invoiceNumber}</span>
                </div>
              </div>
            </div>

            {/* Cargo Shipment Details Table */}
            <div className="mb-2 flex-1 flex flex-col">
              <div className="border-t border-gray-300 pt-2 flex-1 flex flex-col">
                {/* Fixed Header */}
                <div className="grid grid-cols-5 gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <div>SECTOR</div>
                  <div>MAIL CAT.</div>
                  <div className="text-right">TOTAL KG</div>
                  <div className="text-right">RATE</div>
                  <div className="text-right">TOTAL {selectedInvoice.currency || 'EUR'}</div>
                </div>
                
                {/* Scrollable cargo data */}
                <div className="flex-1 overflow-y-auto space-y-1 max-h-96">
                  {(() => {
                    // Check if this is a CargoInvoice with real data
                    const isCargoInvoice = 'itemsDetails' in selectedInvoice && selectedInvoice.itemsDetails
                    // Handle the case where length might be undefined due to proxy or serialization issues
                    const itemsDetails = selectedInvoice.itemsDetails
                    const hasValidItemsDetails = itemsDetails && 
                        Array.isArray(itemsDetails) && 
                        (itemsDetails.length > 0 || (itemsDetails.length === undefined && itemsDetails[0] !== undefined))
                    
                    
                    if (isCargoInvoice && hasValidItemsDetails) {
                      // Use real cargo data
                      return selectedInvoice.itemsDetails?.map((item: CargoInvoiceItem, index: number) => (
                        <div key={item.id || index} className="grid grid-cols-5 gap-2 text-sm text-gray-700 py-0.5">
                          <div className="font-mono">{item.route}</div>
                          <div>{item.mailCat}</div>
                          <div className="text-right">{item.weight} kg</div>
                          <div className="text-right">{selectedInvoice.currency || '€'}{(item.rateInfo?.base_rate || item.rate).toFixed(2)}</div>
                          <div className="text-right font-semibold">
                            {selectedInvoice.currency || '€'}{item.amount.toFixed(2)}
                          </div>
                        </div>
                      ))
                    } else {
                      // Check if it's an empty array vs no data
                      const isEmptyArray = Array.isArray(selectedInvoice.itemsDetails) && selectedInvoice.itemsDetails.length === 0
                      
                      return (
                        <div className="text-center py-4 text-gray-500 space-y-2">
                          <div>
                            {isEmptyArray ? 'No cargo items found for this invoice' : 'No cargo data available'}
                          </div>
                          <div className="text-xs text-gray-400">
                            This invoice has no associated cargo items in the database.
                          </div>
                          <div className="text-xs text-gray-400">
                            Debug: itemsDetails = {JSON.stringify(selectedInvoice.itemsDetails)}
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>
                
                {/* Fixed Footer */}
                <div className="border-t border-gray-300 mt-2 pt-2">
                  <div className="grid grid-cols-5 gap-2 text-sm font-bold text-gray-800">
                    <div>TOTAL</div>
                    <div></div>
                    <div className="text-right">
                      {(() => {
                        const isCargoInvoice = 'itemsDetails' in selectedInvoice && selectedInvoice.itemsDetails
                        if (isCargoInvoice && selectedInvoice.itemsDetails && selectedInvoice.itemsDetails.length > 0) {
                          return selectedInvoice.itemsDetails.reduce((sum, item) => sum + item.weight, 0).toFixed(1)
                        }
                        return '0.0'
                      })()}
                    </div>
                    <div className="text-right">
                      {/* {(() => {
                        const isCargoInvoice = 'itemsDetails' in selectedInvoice && selectedInvoice.itemsDetails
                        if (isCargoInvoice && selectedInvoice.itemsDetails && selectedInvoice.itemsDetails.length > 0) {
                          const totalWeight = selectedInvoice.itemsDetails.reduce((sum, item) => sum + item.weight, 0)
                          const totalAmount = selectedInvoice.itemsDetails.reduce((sum, item) => sum + item.amount, 0)
                          // Show average rate per kg
                          const avgRate = totalWeight > 0 ? totalAmount / totalWeight : 0
                          return `€${avgRate.toFixed(2)}/kg`
                        }
                        return '€0.00/kg'
                      })()} */}
                    </div>
                    <div className="text-right">
                      {(() => {
                        const isCargoInvoice = 'itemsDetails' in selectedInvoice && selectedInvoice.itemsDetails
                        if (isCargoInvoice && selectedInvoice.itemsDetails && selectedInvoice.itemsDetails.length > 0) {
                          const totalAmount = selectedInvoice.itemsDetails.reduce((sum, item) => sum + item.amount, 0)
                          return `${selectedInvoice.currency || '€'}${totalAmount.toFixed(2)}`
                        }
                        return '€0.00'
                      })()}
                    </div>
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
