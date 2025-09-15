import jsPDF from 'jspdf'
import type { CargoInvoiceItem } from '@/types/cargo-data'

export interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  date: string
  dueDate: string
  amount: number
  status: "paid" | "pending" | "overdue" | "draft"
  items: number
  totalWeight: number
  route: string
  paymentMethod?: string
  currency?: string
  itemsDetails?: CargoInvoiceItem[]
  // Customer details from database
  customer_id?: string
  customer_code?: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  customer_contact_person?: string
  customer_city?: string
  customer_state?: string
  customer_postal_code?: string
  customer_country?: string
  customer_accounting_label?: string
}

export const generateInvoicePDF = (invoice: Invoice) => {
  // Validate invoice data
  if (!invoice) {
    console.error('No invoice data provided to generateInvoicePDF')
    return
  }

  const doc = new jsPDF()
  
  // Set font
  doc.setFont('helvetica')
  
  // Invoice details (right side) - better positioned
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 140, 10)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('INVOICE NO:', 140, 17)
  doc.setFont('helvetica', 'bold')
  doc.text(String(invoice.invoiceNumber || 'N/A'), 160, 17)
  
  // Issued to section - moved closer to edge
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ISSUED TO:', 10, 10)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(String(invoice.customer || 'Unknown Customer'), 10, 16)
  
  // Use real customer address data if available
  if (invoice.customer_address) {
    doc.text(String(invoice.customer_address), 10, 21)
  } else {
    doc.text('123 Business Street', 10, 21)
  }
  
  // Build city, state, postal code line
  let cityStatePostal = ''
  if (invoice.customer_city) cityStatePostal += invoice.customer_city
  if (invoice.customer_city && invoice.customer_state) cityStatePostal += ', '
  if (invoice.customer_state) cityStatePostal += invoice.customer_state
  if (invoice.customer_postal_code) cityStatePostal += ` ${invoice.customer_postal_code}`
  
  if (cityStatePostal) {
    doc.text(cityStatePostal, 10, 26)
  } else {
    doc.text('Business City, BC 12345', 10, 26)
  }
  
  // Add country if available
  if (invoice.customer_country) {
    doc.text(String(invoice.customer_country), 10, 31)
  }
  
  // Pay to section - moved closer to edge
  const payToY = invoice.customer_country ? 37 : 32
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PAY TO:', 10, payToY)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('AirBaltic', 10, payToY + 6)
  doc.text('Account Name: AirBaltic', 10, payToY + 11)
  doc.text('Account No.: 1234 5678 9012', 10, payToY + 16)
  
  // Cargo Shipment Details Table
  const startY = invoice.customer_country ? 65 : 60
  const lineHeight = 4
  const maxRowsPerPage = 45 // Maximum rows that can fit on one page
  
  // Use real cargo data if available, otherwise use sample data
  const cargoData = invoice.itemsDetails && invoice.itemsDetails.length > 0 ? 
    invoice.itemsDetails.map(item => ({
      sector: item.route,
      mailCat: item.mailCat,
      totalKg: item.weight,
      rate: item.rateInfo?.base_rate || item.rate,
      totalEur: item.amount
    })) :
    [
      { sector: '50723 → 2', mailCat: 'A', totalKg: 0.2, rate: 4.5, totalEur: 0.90 },
      { sector: '50723 → 11', mailCat: 'A', totalKg: 0.4, rate: 4.5, totalEur: 1.80 },
      { sector: '50723 → 17', mailCat: 'A', totalKg: 0.6, rate: 4.5, totalEur: 2.70 }
    ]
  
  // Calculate totals for all data
  const totalKg = cargoData.reduce((sum, item) => sum + item.totalKg, 0)
  const totalEur = cargoData.reduce((sum, item) => sum + item.totalEur, 0)
  
  // Split data into pages
  const itemsPerPage = maxRowsPerPage
  const totalPages = Math.ceil(cargoData.length / itemsPerPage)
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage()
      
      // Add page header for subsequent pages
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', 140, 10)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('INVOICE NO:', 140, 17)
      doc.setFont('helvetica', 'bold')
      doc.text(String(invoice.invoiceNumber || 'N/A'), 160, 17)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${page + 1} of ${totalPages}`, 10, 10)
    }
    
    // Get data for this page
    const startIndex = page * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, cargoData.length)
    const pageData = cargoData.slice(startIndex, endIndex)
    
    // Use different Y position for first page vs subsequent pages
    const tableStartY = page === 0 ? startY : 25
    
    // Table headers (only draw once per page) - expanded width
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('SECTOR', 10, tableStartY)
    doc.text('MAIL CAT.', 50, tableStartY)
    doc.text('TOTAL KG', 85, tableStartY)
    doc.text('RATE', 125, tableStartY)
    doc.text(`TOTAL ${invoice.currency || 'EUR'}`, 170, tableStartY)
    
    // Draw line under headers - extended to use more width
    doc.line(10, tableStartY + 1, 210, tableStartY + 1)
    
    // Line items
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    let currentY = tableStartY + 5
    
    pageData.forEach(item => {
      doc.text(String(item.sector || 'N/A'), 10, currentY)
      doc.text(String(item.mailCat || 'N/A'), 50, currentY)
      doc.text(`${Number(item.totalKg || 0).toFixed(1)} kg`, 85, currentY)
      doc.text(`${invoice.currency || '€'}${Number(item.rate || 0).toFixed(2)}`, 125, currentY)
      doc.text(`${invoice.currency || '€'}${Number(item.totalEur || 0).toFixed(2)}`, 170, currentY)
      currentY += lineHeight
    })
    
    // Draw line under items - extended width
    doc.line(10, currentY + 1, 210, currentY + 1)
    
    // Summary section (only on last page)
    if (page === totalPages - 1) {
      currentY += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('TOTAL', 10, currentY)
      doc.text('', 50, currentY) // Empty for mail cat
      doc.text(`${totalKg.toFixed(1)} kg`, 85, currentY)
      doc.text('', 125, currentY) // Empty for rate
      doc.text(`${invoice.currency || '€'}${totalEur.toFixed(2)}`, 170, currentY)
      
      // Add summary note
      currentY += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(`Total items: ${cargoData.length} | Total pages: ${totalPages}`, 10, currentY)
    }
  }
  
  // Save the PDF
  doc.save(`invoice-${String(invoice.invoiceNumber || 'unknown')}.pdf`)
}
