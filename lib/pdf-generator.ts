import jsPDF from 'jspdf'

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
}

export const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF()
  
  // Set font
  doc.setFont('helvetica')
  
  // Company header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CARGO MANAGEMENT LTD', 20, 30)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('123 Business Street, Business City, BC 12345', 20, 40)
  doc.text('Phone: +1 (555) 123-4567 | Email: info@cargomgmt.com', 20, 45)
  
  // Invoice details (right side)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 150, 30)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('INVOICE NO:', 150, 40)
  doc.text(invoice.invoiceNumber, 180, 40)
  
  doc.text('DATE:', 150, 45)
  doc.text(new Date(invoice.date).toLocaleDateString('en-GB'), 180, 45)
  
  doc.text('DUE DATE:', 150, 50)
  doc.text(new Date(invoice.dueDate).toLocaleDateString('en-GB'), 180, 50)
  
  // Issued to section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ISSUED TO:', 20, 70)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.customer, 20, 80)
  doc.text('123 Business Street', 20, 85)
  doc.text('Business City, BC 12345', 20, 90)
  
  // Pay to section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PAY TO:', 20, 110)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Cargo Management Ltd', 20, 120)
  doc.text('Account Name: Cargo Management', 20, 125)
  doc.text('Account No.: 1234 5678 9012', 20, 130)
  
  // Cargo Shipment Details Table
  const startY = 150
  const lineHeight = 8
  const tableWidth = 170
  const colWidths = [30, 20, 20, 20, 30, 30, 30] // Sector, empty, empty, Mail Cat, Total KG, Rate, Total EUR
  
  // Table headers
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('SECTOR', 20, startY)
  doc.text('MAIL CAT.', 80, startY)
  doc.text('TOTAL KG', 110, startY)
  doc.text('RATE', 140, startY)
  doc.text('TOTAL EUR', 170, startY)
  
  // Draw line under headers
  doc.line(20, startY + 2, 200, startY + 2)
  
  // Sample cargo data based on invoice
  const cargoData = [
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
  ]
  
  // Line items
  doc.setFont('helvetica', 'normal')
  let currentY = startY + 10
  
  cargoData.forEach(item => {
    doc.text(item.sector, 20, currentY)
    doc.text(item.mailCat, 80, currentY)
    doc.text(item.totalKg.toString(), 110, currentY)
    doc.text(item.rate.toString(), 140, currentY)
    doc.text(`€${item.totalEur.toFixed(2)}`, 170, currentY)
    currentY += lineHeight
  })
  
  // Draw line under items
  doc.line(20, currentY + 2, 200, currentY + 2)
  
  // Summary section
  currentY += 10
  const totalKg = cargoData.reduce((sum, item) => sum + item.totalKg, 0)
  const totalEur = cargoData.reduce((sum, item) => sum + item.totalEur, 0)
  const avgRate = totalEur / totalKg
  
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', 20, currentY)
  doc.text('', 80, currentY) // Empty for mail cat
  doc.text(totalKg.toFixed(1), 110, currentY)
  doc.text(avgRate.toFixed(10), 140, currentY)
  doc.text(`€${totalEur.toFixed(2)}`, 170, currentY)
  
  // Additional invoice summary
  currentY += 15
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const subtotal = totalEur * 0.9
  const tax = totalEur * 0.1
  const finalTotal = totalEur
  
  doc.text('SUBTOTAL:', 120, currentY)
  doc.text(`€${subtotal.toFixed(2)}`, 180, currentY)
  currentY += lineHeight
  
  doc.text('Tax:', 120, currentY)
  doc.text('10%', 180, currentY)
  currentY += lineHeight
  
  // Total line
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 120, currentY)
  doc.text(`€${finalTotal.toFixed(2)}`, 180, currentY)
  
  // Footer
  currentY += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Thank you for your business!', 20, currentY)
  doc.text('Payment is due within 30 days of invoice date.', 20, currentY + 5)
  
  // Save the PDF
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
}
