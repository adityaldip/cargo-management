import type { CargoData, ProcessedData, FileProcessingResult } from "@/types/cargo-data"

// Mock data for demonstration - in real app this would parse Excel files
const mockMailSystemData: Partial<CargoData>[] = [
  {
    origOE: "USFRAT",
    destOE: "USRIXT",
    inbFlightNo: "BT234",
    mailCat: "A",
    mailClass: "7C",
    totalKg: 7.9,
    invoiceExtend: "Airmail",
    customer: "LV Post",
    date: "2023-08-09",
    sector: "RIX VIE",
    euromail: "EU",
    combined: "VIE EU",
    totalEur: 713.0,
    vatEur: 373.8,
  },
  {
    origOE: "USFRAT",
    destOE: "USRIXT",
    inbFlightNo: "BT234",
    mailCat: "A",
    mailClass: "7C",
    totalKg: 6.2,
    invoiceExtend: "Airmail",
    customer: "LV Post",
    date: "2023-08-09",
    sector: "RIX MAD",
    euromail: "NONEU",
    combined: "MAD NONEU",
    totalEur: 3862.0,
    vatEur: 2037.55,
  },
]

const mockMailAgentData: Partial<CargoData>[] = [
  {
    origOE: "USFRAT",
    destOE: "USROMT",
    inbFlightNo: "BT234",
    outbFlightNo: "BT633",
    mailCat: "A",
    mailClass: "7C",
    totalKg: 2.4,
    invoiceExtend: "Airmail",
  },
  {
    origOE: "USFRAT",
    destOE: "USVNOT",
    inbFlightNo: "BT234",
    outbFlightNo: "BT341",
    mailCat: "A",
    mailClass: "7C",
    totalKg: 5.7,
    invoiceExtend: "Airmail",
  },
]

export function processFile(file: File, fileType: "mail-system" | "mail-agent"): Promise<FileProcessingResult> {
  return new Promise((resolve) => {
    // Simulate file processing delay
    setTimeout(() => {
      try {
        const mockData = fileType === "mail-system" ? mockMailSystemData : mockMailAgentData

        const processedData: CargoData[] = mockData.map((item, index) => ({
          id: `${fileType}-${index}`,
          origOE: item.origOE || "",
          destOE: item.destOE || "",
          inbFlightNo: item.inbFlightNo || "",
          outbFlightNo: item.outbFlightNo,
          mailCat: item.mailCat || "",
          mailClass: item.mailClass || "",
          totalKg: item.totalKg || 0,
          invoiceExtend: item.invoiceExtend || "",
          customer: item.customer,
          date: item.date,
          sector: item.sector,
          euromail: item.euromail,
          combined: item.combined,
          totalEur: item.totalEur,
          vatEur: item.vatEur,
        }))

        // Identify missing fields
        const missingFields: string[] = []
        const warnings: string[] = []

        processedData.forEach((record, index) => {
          if (!record.customer) missingFields.push(`Row ${index + 1}: Missing customer`)
          if (!record.date) missingFields.push(`Row ${index + 1}: Missing date`)
          if (fileType === "mail-system" && !record.totalEur) {
            warnings.push(`Row ${index + 1}: Missing total EUR - rate calculation needed`)
          }
          if (fileType === "mail-agent" && !record.outbFlightNo) {
            warnings.push(`Row ${index + 1}: Missing outbound flight number`)
          }
        })

        // Calculate summary
        const totalKg = processedData.reduce((sum, record) => sum + record.totalKg, 0)
        const euRecords = processedData.filter((r) => r.euromail === "EU")
        const nonEuRecords = processedData.filter((r) => r.euromail === "NONEU")

        const euSubtotal = euRecords.reduce((sum, record) => sum + (record.totalEur || 0), 0)
        const nonEuSubtotal = nonEuRecords.reduce((sum, record) => sum + (record.totalEur || 0), 0)

        const result: ProcessedData = {
          data: processedData,
          missingFields: [...new Set(missingFields)],
          warnings: [...new Set(warnings)],
          summary: {
            totalRecords: processedData.length,
            euSubtotal,
            nonEuSubtotal,
            total: euSubtotal + nonEuSubtotal,
            totalKg,
          },
        }

        resolve({ success: true, data: result })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : "Failed to process file",
        })
      }
    }, 1500) // Simulate processing time
  })
}

export function combineProcessedData(datasets: ProcessedData[]): ProcessedData {
  const combinedData: CargoData[] = []
  const allMissingFields: string[] = []
  const allWarnings: string[] = []

  datasets.forEach((dataset) => {
    combinedData.push(...dataset.data)
    allMissingFields.push(...dataset.missingFields)
    allWarnings.push(...dataset.warnings)
  })

  // Recalculate summary for combined data
  const totalKg = combinedData.reduce((sum, record) => sum + record.totalKg, 0)
  const euRecords = combinedData.filter((r) => r.euromail === "EU")
  const nonEuRecords = combinedData.filter((r) => r.euromail === "NONEU")

  const euSubtotal = euRecords.reduce((sum, record) => sum + (record.totalEur || 0), 0)
  const nonEuSubtotal = nonEuRecords.reduce((sum, record) => sum + (record.totalEur || 0), 0)

  return {
    data: combinedData,
    missingFields: [...new Set(allMissingFields)],
    warnings: [...new Set(allWarnings)],
    summary: {
      totalRecords: combinedData.length,
      euSubtotal,
      nonEuSubtotal,
      total: euSubtotal + nonEuSubtotal,
      totalKg,
    },
  }
}
