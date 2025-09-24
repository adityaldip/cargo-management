import type { ProcessedData, CargoData } from "@/types/cargo-data"
import * as XLSX from 'xlsx'

export interface ExportOptions {
  format: "excel" | "csv" | "pdf"
  includeAnalysis: boolean
  groupBy?: "customer" | "route" | "date" | "none"
  includeCharts: boolean
  customFields?: string[]
}

export interface ReportData {
  summary: {
    totalRecords: number
    totalWeight: number
    totalRevenue: number
    euRevenue: number
    nonEuRevenue: number
    vatAmount: number
    dateRange: string
  }
  data: CargoData[]
  groupedData?: Record<string, CargoData[]>
  analysis?: {
    topRoutes: Array<{ route: string; weight: number; revenue: number; count: number }>
    topCustomers: Array<{ customer: string; weight: number; revenue: number; count: number }>
    monthlyTrends?: Array<{ month: string; weight: number; revenue: number }>
  }
}

export function prepareReportData(processedData: ProcessedData, options: ExportOptions): ReportData {
  const { data, summary } = processedData

  // Calculate additional summary metrics
  const totalVat = data.reduce((sum, record) => sum + (record.vatEur || 0), 0)
  const dateRange = getDateRange(data)

  const reportSummary = {
    totalRecords: summary.totalRecords,
    totalWeight: summary.totalKg,
    totalRevenue: summary.total,
    euRevenue: summary.euSubtotal,
    nonEuRevenue: summary.nonEuSubtotal,
    vatAmount: totalVat,
    dateRange,
  }

  // Group data if requested
  let groupedData: Record<string, CargoData[]> | undefined
  if (options.groupBy && options.groupBy !== "none") {
    groupedData = groupDataBy(data, options.groupBy)
  }

  // Generate analysis if requested
  let analysis: ReportData["analysis"] | undefined
  if (options.includeAnalysis) {
    analysis = generateAnalysis(data)
  }

  return {
    summary: reportSummary,
    data,
    groupedData,
    analysis,
  }
}

function getDateRange(data: CargoData[]): string {
  const dates = data
    .map((record) => record.date)
    .filter((date): date is string => !!date)
    .sort()

  if (dates.length === 0) return "No dates available"

  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]

  return firstDate === lastDate ? firstDate : `${firstDate} to ${lastDate}`
}

function groupDataBy(data: CargoData[], groupBy: "customer" | "route" | "date"): Record<string, CargoData[]> {
  return data.reduce(
    (groups, record) => {
      let key: string

      switch (groupBy) {
        case "customer":
          key = record.customer || "Unknown Customer"
          break
        case "route":
          key = `${record.origOE} → ${record.destOE}`
          break
        case "date":
          key = record.date || "Unknown Date"
          break
        default:
          key = "All Records"
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(record)

      return groups
    },
    {} as Record<string, CargoData[]>,
  )
}

function generateAnalysis(data: CargoData[]): ReportData["analysis"] {
  // Top routes analysis
  const routeStats = data.reduce(
    (acc, record) => {
      const route = `${record.origOE} → ${record.destOE}`
      if (!acc[route]) {
        acc[route] = { route, weight: 0, revenue: 0, count: 0 }
      }
      acc[route].weight += record.totalKg
      acc[route].revenue += record.totalEur || 0
      acc[route].count += 1
      return acc
    },
    {} as Record<string, { route: string; weight: number; revenue: number; count: number }>,
  )

  const topRoutes = Object.values(routeStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Top customers analysis
  const customerStats = data.reduce(
    (acc, record) => {
      const customer = record.customer || "Unknown"
      if (!acc[customer]) {
        acc[customer] = { customer, weight: 0, revenue: 0, count: 0 }
      }
      acc[customer].weight += record.totalKg
      acc[customer].revenue += record.totalEur || 0
      acc[customer].count += 1
      return acc
    },
    {} as Record<string, { customer: string; weight: number; revenue: number; count: number }>,
  )

  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    topRoutes,
    topCustomers,
  }
}

export function generateCSV(reportData: ReportData, options: ExportOptions): string {
  const { data, groupedData } = reportData

  let csv = ""

  // Add summary section
  csv += "CARGO MAIL PROCESSING REPORT\n"
  csv += `Generated: ${new Date().toLocaleString()}\n`
  csv += `Date Range: ${reportData.summary.dateRange}\n\n`

  csv += "SUMMARY\n"
  csv += `Total Records,${reportData.summary.totalRecords}\n`
  csv += `Total Weight (kg),${reportData.summary.totalWeight.toFixed(2)}\n`
  csv += `Total Revenue (EUR),${reportData.summary.totalRevenue.toFixed(2)}\n`
  csv += `EU Revenue (EUR),${reportData.summary.euRevenue.toFixed(2)}\n`
  csv += `Non-EU Revenue (EUR),${reportData.summary.nonEuRevenue.toFixed(2)}\n`
  csv += `VAT Amount (EUR),${reportData.summary.vatAmount.toFixed(2)}\n\n`

  // Add headers
  const headers = [
    "Origin OE",
    "Destination OE",
    "Inbound Flight",
    "Outbound Flight",
    "Mail Category",
    "Mail Class",
    "Total KG",
    "Invoice Extend",
    "Customer",
    "Date",
    "Sector",
    "Euromail",
    "Combined",
    "Total EUR",
    "VAT EUR",
  ]

  if (groupedData) {
    // Export grouped data
    Object.entries(groupedData).forEach(([groupName, records]) => {
      csv += `\n${groupName.toUpperCase()}\n`
      csv += headers.join(",") + "\n"

      records.forEach((record) => {
        const row = [
          record.origOE,
          record.destOE,
          record.inbFlightNo,
          record.outbFlightNo || "",
          record.mailCat,
          record.mailClass,
          record.totalKg.toString(),
          record.invoiceExtend,
          record.customer || "",
          record.date || "",
          record.sector || "",
          record.euromail || "",
          record.combined || "",
          (record.totalEur || 0).toFixed(2),
          (record.vatEur || 0).toFixed(2),
        ]
        csv += row.map((field) => `"${field}"`).join(",") + "\n"
      })
    })
  } else {
    // Export all data
    csv += "DETAILED DATA\n"
    csv += headers.join(",") + "\n"

    data.forEach((record) => {
      const row = [
        record.origOE,
        record.destOE,
        record.inbFlightNo,
        record.outbFlightNo || "",
        record.mailCat,
        record.mailClass,
        record.totalKg.toString(),
        record.invoiceExtend,
        record.customer || "",
        record.date || "",
        record.sector || "",
        record.euromail || "",
        record.combined || "",
        (record.totalEur || 0).toFixed(2),
        (record.vatEur || 0).toFixed(2),
      ]
      csv += row.map((field) => `"${field}"`).join(",") + "\n"
    })
  }

  // Add analysis section if requested
  if (options.includeAnalysis && reportData.analysis) {
    csv += "\nTOP ROUTES BY REVENUE\n"
    csv += "Route,Weight (kg),Revenue (EUR),Shipments\n"
    reportData.analysis.topRoutes.forEach((route) => {
      csv += `"${route.route}",${route.weight.toFixed(2)},${route.revenue.toFixed(2)},${route.count}\n`
    })

    csv += "\nTOP CUSTOMERS BY REVENUE\n"
    csv += "Customer,Weight (kg),Revenue (EUR),Shipments\n"
    reportData.analysis.topCustomers.forEach((customer) => {
      csv += `"${customer.customer}",${customer.weight.toFixed(2)},${customer.revenue.toFixed(2)},${customer.count}\n`
    })
  }

  return csv
}

export function generateBillingExcel(reportData: ReportData, options: ExportOptions): string {
  const { data, groupedData } = reportData

  // Create Excel-compatible CSV with billing focus
  let csv = ""

  // Billing header section
  csv += "CARGO MAIL BILLING REPORT\n"
  csv += `Invoice Date,${new Date().toLocaleDateString()}\n`
  csv += `Billing Period,${reportData.summary.dateRange}\n`
  csv += `Total Amount (EUR),${reportData.summary.totalRevenue.toFixed(2)}\n`
  csv += `VAT Amount (EUR),${reportData.summary.vatAmount.toFixed(2)}\n`
  csv += `Net Amount (EUR),${(reportData.summary.totalRevenue - reportData.summary.vatAmount).toFixed(2)}\n\n`

  if (groupedData && options.groupBy === "customer") {
    // Customer-based billing format
    Object.entries(groupedData).forEach(([customer, records]) => {
      const customerTotal = records.reduce((sum, record) => sum + (record.totalEur || 0), 0)
      const customerVat = records.reduce((sum, record) => sum + (record.vatEur || 0), 0)
      const customerWeight = records.reduce((sum, record) => sum + record.totalKg, 0)

      csv += `CUSTOMER: ${customer}\n`
      csv += `Total Weight: ${customerWeight.toFixed(2)} kg\n`
      csv += `Total Amount: ${customerTotal.toFixed(2)} EUR\n`
      csv += `VAT: ${customerVat.toFixed(2)} EUR\n`
      csv += `Net Amount: ${(customerTotal - customerVat).toFixed(2)} EUR\n\n`

      // Billing line items
      csv += "Date,Route,Flight,Mail Cat,Weight (kg),Rate (EUR/kg),Amount (EUR),VAT (EUR)\n"

      records.forEach((record) => {
        const rate = record.totalKg > 0 ? ((record.totalEur || 0) - (record.vatEur || 0)) / record.totalKg : 0
        csv +=
          [
            record.date || "",
            `${record.origOE}-${record.destOE}`,
            record.inbFlightNo,
            record.mailCat,
            record.totalKg.toFixed(2),
            rate.toFixed(3),
            ((record.totalEur || 0) - (record.vatEur || 0)).toFixed(2),
            (record.vatEur || 0).toFixed(2),
          ]
            .map((field) => `"${field}"`)
            .join(",") + "\n"
      })

      csv += `\nSubtotal for ${customer}: ${customerTotal.toFixed(2)} EUR\n\n`
    })
  } else {
    // Standard billing format
    csv += "BILLING LINE ITEMS\n"
    csv +=
      "Invoice Line,Date,Customer,Route,Flight,Mail Cat,Weight (kg),Rate (EUR/kg),Net Amount (EUR),VAT (EUR),Total (EUR)\n"

    data.forEach((record, index) => {
      const rate = record.totalKg > 0 ? ((record.totalEur || 0) - (record.vatEur || 0)) / record.totalKg : 0
      const netAmount = (record.totalEur || 0) - (record.vatEur || 0)

      csv +=
        [
          (index + 1).toString(),
          record.date || "",
          record.customer || "Unknown",
          `${record.origOE}-${record.destOE}`,
          record.inbFlightNo,
          record.mailCat,
          record.totalKg.toFixed(2),
          rate.toFixed(3),
          netAmount.toFixed(2),
          (record.vatEur || 0).toFixed(2),
          (record.totalEur || 0).toFixed(2),
        ]
          .map((field) => `"${field}"`)
          .join(",") + "\n"
    })
  }

  // Billing summary
  csv += "\nBILLING SUMMARY\n"
  csv += `Total Shipments,${reportData.summary.totalRecords}\n`
  csv += `Total Weight (kg),${reportData.summary.totalWeight.toFixed(2)}\n`
  csv += `Net Amount (EUR),${(reportData.summary.totalRevenue - reportData.summary.vatAmount).toFixed(2)}\n`
  csv += `VAT Amount (EUR),${reportData.summary.vatAmount.toFixed(2)}\n`
  csv += `Total Amount (EUR),${reportData.summary.totalRevenue.toFixed(2)}\n`

  return csv
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function generateFilename(options: ExportOptions, groupBy?: string): string {
  const timestamp = new Date().toISOString().split("T")[0]
  const groupSuffix = groupBy && groupBy !== "none" ? `_by_${groupBy}` : ""
  const analysisSuffix = options.includeAnalysis ? "_with_analysis" : ""

  return `cargo_mail_report_${timestamp}${groupSuffix}${analysisSuffix}.${options.format}`
}

export function generateBillingFilename(): string {
  const timestamp = new Date().toISOString().split("T")[0]
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
  return `billing_export_${invoiceNumber}_${timestamp}.csv`
}

export function generateXLS(data: CargoData[], options: ExportOptions, columns?: any[]): ArrayBuffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new()
  
  // If columns are provided, use them to determine order and labels
  let excelData: any[]
  
  if (columns && columns.length > 0) {
    // Use the same column order as CSV
    excelData = data.map((record) => {
      const row: any = {}
      columns.forEach((col) => {
        const value = formatCellValueForXLS(record, col.key)
        row[col.label] = value
      })
      return row
    })
  } else {
    // Fallback to default order if no columns provided
    excelData = data.map((record) => ({
      'Origin OE': record.origOE,
      'Destination OE': record.destOE,
      'Inbound Flight': record.inbFlightNo,
      'Outbound Flight': record.outbFlightNo || '',
      'Mail Category': record.mailCat,
      'Mail Class': record.mailClass,
      'Total KG': record.totalKg,
      'Invoice Extend': record.invoiceExtend,
      'Customer': record.customer || '',
      'Date': record.date || '',
      'Sector': record.sector || '',
      'Euromail': record.euromail || '',
      'Combined': record.combined || '',
      'Total EUR': record.totalEur || 0,
      'VAT EUR': record.vatEur || 0,
      'Record ID': record.recordId || '',
      'DES No': record.desNo || '',
      'REC Numb': record.recNumb || '',
      'Outbound Date': record.outbDate || ''
    }))
  }
  
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(excelData)
  
  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cargo Data')
  
  // Generate Excel file as ArrayBuffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  
  return excelBuffer
}

// Helper function to format cell values for XLS (same logic as CSV)
function formatCellValueForXLS(record: CargoData, key: string): string {
  switch (key) {
    case 'id':
      return record.id || ''
    case 'rec_id':
      return record.recordId || ''
    case 'orig_oe':
      return record.origOE || ''
    case 'dest_oe':
      return record.destOE || ''
    case 'inb_flight_no':
      return record.inbFlightNo || ''
    case 'outb_flight_no':
      return record.outbFlightNo || ''
    case 'mail_cat':
      return record.mailCat || ''
    case 'mail_class':
      return record.mailClass || ''
    case 'total_kg':
      return record.totalKg?.toString() || '0'
    case 'invoice':
      return record.invoiceExtend || ''
    case 'customer_name':
    case 'assigned_customer':
      return record.customer || ''
    case 'inb_flight_date':
      return record.date || ''
    case 'sector':
      return record.sector || ''
    case 'euromail':
      return record.euromail || ''
    case 'combined':
      return record.combined || ''
    case 'assigned_rate':
    case 'total_eur':
      return record.totalEur?.toString() || '0'
    case 'vat_eur':
      return record.vatEur?.toString() || '0'
    case 'des_no':
      return record.desNo || ''
    case 'rec_numb':
      return record.recNumb || ''
    case 'outb_flight_date':
      return record.outbDate || ''
    default:
      return ''
  }
}

export function downloadXLSFile(data: CargoData[], filename: string, options: ExportOptions, columns?: any[]) {
  const excelBuffer = generateXLS(data, options, columns)
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
