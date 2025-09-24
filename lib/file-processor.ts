import * as XLSX from 'xlsx'
import type { CargoData, ProcessedData, FileProcessingResult } from "@/types/cargo-data"
import { applyIgnoreRules, type IgnoreRule } from "./ignore-rules-utils"

// Column mapping for different file types
const MAIL_AGENT_COLUMN_MAP: Record<string, keyof CargoData> = {
  'Inb.Flight Date': 'date',
  'Outb.Flight Date': 'outbDate',
  'Rec. ID': 'recordId',
  'Des. No.': 'desNo',
  'Rec. Numb.': 'recNumb',
  'Orig. OE': 'origOE',
  'Dest. OE': 'destOE',
  'Inb. Flight No.': 'inbFlightNo',
  'Outb. Flight No.': 'outbFlightNo',
  'Mail Cat.': 'mailCat',
  'Mail Class': 'mailClass',
  'Total kg': 'totalKg',
  'Invoice': 'invoiceExtend',
  'Customer name / number': 'customer',
}

const MAIL_SYSTEM_COLUMN_MAP: Record<string, keyof CargoData> = {
  'Flight Date': 'date',
  'Record ID': 'recordId',
  'Destination': 'desNo',
  'Record Number': 'recNumb',
  'Origin OE': 'origOE',
  'Destination OE': 'destOE',
  'Flight Number': 'inbFlightNo',
  'Outbound Flight': 'outbFlightNo',
  'Mail Category': 'mailCat',
  'Mail Classification': 'mailClass',
  'Weight kg': 'totalKg',
  'Invoice Type': 'invoiceExtend',
  'Customer Info': 'customer',
}

interface ExcelRow {
  [key: string]: any
}

function parseCSVFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        if (!data) {
          reject(new Error('Failed to read CSV file'))
          return
        }

        // Split into lines and handle different line endings
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== '')
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'))
          return
        }

        // Parse CSV with basic comma separation (handles quoted values)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          
          result.push(current.trim())
          return result
        }

        // Get headers from first line
        const headers = parseCSVLine(lines[0])
        
        // Convert remaining lines to objects
        const rows: ExcelRow[] = lines.slice(1).map(line => {
          const values = parseCSVLine(line)
          const obj: ExcelRow = {}
          
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          
          return obj
        }).filter(row => {
          // Filter out completely empty rows
          return Object.values(row).some(value => value !== '')
        })

        resolve(rows)
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'))
    }

    reader.readAsText(file, 'utf-8')
  })
}

// Unified file parser that handles both Excel and CSV files
function parseFile(file: File): Promise<ExcelRow[]> {
  const fileExtension = file.name.toLowerCase().split('.').pop()
  
  if (fileExtension === 'csv') {
    return parseCSVFile(file)
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcelFile(file)
  } else {
    return Promise.reject(new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv files'))
  }
}

function parseExcelFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('Failed to read file'))
          return
        }

        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        
        if (!sheetName) {
          reject(new Error('No sheets found in Excel file'))
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false 
        }) as any[][]

        if (jsonData.length < 2) {
          reject(new Error('Excel file must contain at least a header row and one data row'))
          return
        }

        // Get headers from first row
        const headers = jsonData[0] as string[]
        
        // Convert rows to objects
        const rows: ExcelRow[] = jsonData.slice(1).map(row => {
          const obj: ExcelRow = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        }).filter(row => {
          // Filter out completely empty rows
          return Object.values(row).some(value => value !== '')
        })

        resolve(rows)
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

function mapExcelRowToCargoData(row: ExcelRow, columnMap: Record<string, keyof CargoData>, index: number): CargoData {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const cargoData: Partial<CargoData> = {
    id: `row-${timestamp}-${index}-${random}`,
  }

  // Map columns based on the provided mapping
  Object.entries(columnMap).forEach(([excelColumn, cargoField]) => {
    const value = row[excelColumn]
    
    if (value !== undefined && value !== '') {
      switch (cargoField) {
        case 'totalKg':
          cargoData[cargoField] = parseFloat(String(value)) || 0
          break
        case 'totalEur':
        case 'vatEur':
          cargoData[cargoField] = parseFloat(String(value)) || undefined
          break
        default:
          cargoData[cargoField] = String(value).trim()
      }
    }
  })

  // Set defaults for required fields
  return {
    id: cargoData.id || `row-${timestamp}-${index}-${random}`,
    origOE: cargoData.origOE || '',
    destOE: cargoData.destOE || '',
    inbFlightNo: cargoData.inbFlightNo || '',
    outbFlightNo: cargoData.outbFlightNo,
    mailCat: cargoData.mailCat || '',
    mailClass: cargoData.mailClass || '',
    totalKg: cargoData.totalKg || 0,
    invoiceExtend: cargoData.invoiceExtend || '',
    customer: cargoData.customer,
    date: cargoData.date,
    sector: cargoData.sector,
    euromail: cargoData.euromail,
    combined: cargoData.combined,
    totalEur: cargoData.totalEur,
    vatEur: cargoData.vatEur,
    recordId: cargoData.recordId,
    desNo: cargoData.desNo,
    recNumb: cargoData.recNumb,
    outbDate: cargoData.outbDate,
  }
}

export async function processFile(
  file: File, 
  fileType: "mail-system" | "mail-agent" | "upload-excel",
  ignoreRules?: IgnoreRule[],
  onProgress?: (progress: number, message: string, stats?: { currentRow: number, totalRows: number, processedRows: number }) => void
): Promise<FileProcessingResult> {
  try {
    onProgress?.(0, "Reading file...", { currentRow: 0, totalRows: 0, processedRows: 0 })
    
    // Parse the file (Excel or CSV)
    const excelRows = await parseFile(file)
    
    if (excelRows.length === 0) {
      return {
        success: false,
        error: "No data found in Excel file"
      }
    }

    onProgress?.(30, `Found ${excelRows.length} rows, processing data...`, { currentRow: 0, totalRows: excelRows.length, processedRows: 0 })

    // Get the appropriate column mapping
    const columnMap = fileType === "mail-system" ? MAIL_SYSTEM_COLUMN_MAP : MAIL_AGENT_COLUMN_MAP
    
    // Convert Excel rows to CargoData with progress tracking
    let processedData: CargoData[] = []
    const totalRows = excelRows.length
    
    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i]
      processedData.push(mapExcelRowToCargoData(row, columnMap, i))
      
      // Update progress every 100 rows or at the end
      if (i % 100 === 0 || i === excelRows.length - 1) {
        const progress = 30 + Math.floor((i / totalRows) * 50) // 30-80% for data processing
        onProgress?.(progress, `Processing row ${i + 1} of ${totalRows}...`, { 
          currentRow: i + 1, 
          totalRows: totalRows, 
          processedRows: i + 1 
        })
        
        // Add a small delay to allow UI updates for large files
        if (i % 500 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
    }

    onProgress?.(80, "Applying ignore rules...", { currentRow: totalRows, totalRows: totalRows, processedRows: totalRows })

    // Apply ignore rules if provided
    if (ignoreRules && ignoreRules.length > 0) {
      const originalCount = processedData.length
      processedData = applyIgnoreRules(processedData, ignoreRules)
      const ignoredCount = originalCount - processedData.length
      
      if (ignoredCount > 0) {
        console.log(`✓ Applied ignore rules: ${ignoredCount} records filtered out (${originalCount} → ${processedData.length})`)
      }
    }

    onProgress?.(90, "Finalizing data...", { currentRow: totalRows, totalRows: totalRows, processedRows: processedData.length })

    // Identify missing fields and warnings
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
      if (!record.origOE) missingFields.push(`Row ${index + 1}: Missing origin OE`)
      if (!record.destOE) missingFields.push(`Row ${index + 1}: Missing destination OE`)
      if (!record.inbFlightNo) missingFields.push(`Row ${index + 1}: Missing inbound flight number`)
      if (record.totalKg === 0) warnings.push(`Row ${index + 1}: Weight is zero`)
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

    onProgress?.(100, "Upload complete!", { currentRow: totalRows, totalRows: totalRows, processedRows: processedData.length })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process file",
    }
  }
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

// Helper function to get available columns from a file (Excel or CSV)
export async function getExcelColumns(file: File): Promise<string[]> {
  try {
    const excelRows = await parseFile(file)
    if (excelRows.length > 0) {
      return Object.keys(excelRows[0])
    }
    return []
  } catch (error) {
    console.error('Error getting file columns:', error)
    return []
  }
}

// Helper function to get sample data from a file (Excel or CSV)
export async function getExcelSampleData(file: File, maxSamples: number = 3): Promise<Record<string, string[]>> {
  try {
    const excelRows = await parseFile(file)
    const sampleData: Record<string, string[]> = {}
    
    if (excelRows.length > 0) {
      const columns = Object.keys(excelRows[0])
      
      columns.forEach(column => {
        sampleData[column] = excelRows
          .slice(0, maxSamples)
          .map(row => String(row[column] || ''))
      })
    }
    
    return sampleData
  } catch (error) {
    console.error('Error getting file sample data:', error)
    return {}
  }
}

// Interface for column mappings
export interface ColumnMappingRule {
  excelColumn: string
  mappedTo: string | null
  finalColumn: string
  status: "mapped" | "unmapped" | "warning"
  sampleData: string[]
}

// Apply column mappings to raw Excel data
export async function processFileWithMappings(
  file: File, 
  fileType: "mail-system" | "mail-agent" | "upload-excel",
  mappings: ColumnMappingRule[],
  ignoreRules?: IgnoreRule[],
  onProgress?: (progress: number, message: string, stats?: { currentRow: number, totalRows: number, processedRows: number }) => void
): Promise<FileProcessingResult> {
  try {
    onProgress?.(10, "Reading file...", { currentRow: 0, totalRows: 0, processedRows: 0 })
    
    // Parse the file (Excel or CSV)
    const excelRows = await parseFile(file)
    
    if (excelRows.length === 0) {
      return {
        success: false,
        error: "No data found in file"
      }
    }

    onProgress?.(20, `Found ${excelRows.length} rows, applying mappings...`, { currentRow: 0, totalRows: excelRows.length, processedRows: 0 })

    // Create a mapping lookup for faster processing
    const mappingLookup: Record<string, string> = {}
    mappings.forEach(mapping => {
      if (mapping.mappedTo && mapping.status === 'mapped') {
        mappingLookup[mapping.excelColumn] = mapping.mappedTo
      }
    })
    
    onProgress?.(30, "Processing data with custom mappings...", { currentRow: 0, totalRows: excelRows.length, processedRows: 0 })

    // Convert Excel rows to CargoData using the user's mappings with progress tracking
    let processedData: CargoData[] = []
    const totalRows = excelRows.length
    
    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i]
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const cargoData: Partial<CargoData> = {
        id: `${fileType}-${timestamp}-${i}-${random}`,
      }

      // Apply user mappings
      Object.entries(row).forEach(([excelColumn, value]) => {
        const mappedColumn = mappingLookup[excelColumn]
        if (mappedColumn && value !== undefined && value !== '') {
          // Map to CargoData fields based on the mapped column name
          const cargoField = getCargoFieldFromMappedColumn(mappedColumn)
          if (cargoField) {
            switch (cargoField) {
              case 'totalKg':
                cargoData[cargoField] = parseFloat(String(value)) || 0
                break
              case 'totalEur':
              case 'vatEur':
                cargoData[cargoField] = parseFloat(String(value)) || undefined
                break
              default:
                cargoData[cargoField] = String(value).trim()
            }
          }
        }
      })

      // Set defaults for required fields
      const finalCargoData = {
        id: cargoData.id || `${fileType}-${timestamp}-${i}-${random}`,
        origOE: cargoData.origOE || '',
        destOE: cargoData.destOE || '',
        inbFlightNo: cargoData.inbFlightNo || '',
        outbFlightNo: cargoData.outbFlightNo,
        mailCat: cargoData.mailCat || '',
        mailClass: cargoData.mailClass || '',
        totalKg: cargoData.totalKg || 0,
        invoiceExtend: cargoData.invoiceExtend || '',
        customer: cargoData.customer,
        date: cargoData.date,
        sector: cargoData.sector,
        euromail: cargoData.euromail,
        combined: cargoData.combined,
        totalEur: cargoData.totalEur,
        vatEur: cargoData.vatEur,
        recordId: cargoData.recordId,
        desNo: cargoData.desNo,
        recNumb: cargoData.recNumb,
        outbDate: cargoData.outbDate,
      }
      
      processedData.push(finalCargoData)
      
      // Update progress every 100 rows or at the end
      if (i % 100 === 0 || i === excelRows.length - 1) {
        const progress = 30 + Math.floor((i / totalRows) * 50) // 30-80% for data processing
        onProgress?.(progress, `Processing row ${i + 1} of ${totalRows}...`, { 
          currentRow: i + 1, 
          totalRows: totalRows, 
          processedRows: i + 1 
        })
        
        // Add a small delay to allow UI updates for large files
        if (i % 500 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
    }

    onProgress?.(80, "Applying ignore rules...", { currentRow: totalRows, totalRows: totalRows, processedRows: totalRows })

    // Apply ignore rules if provided
    if (ignoreRules && ignoreRules.length > 0) {
      const originalCount = processedData.length
      processedData = applyIgnoreRules(processedData, ignoreRules)
      const ignoredCount = originalCount - processedData.length
      
      if (ignoredCount > 0) {
        console.log(`✓ Applied ignore rules: ${ignoredCount} records filtered out (${originalCount} → ${processedData.length})`)
      }
    }

    onProgress?.(90, "Finalizing data...", { currentRow: totalRows, totalRows: totalRows, processedRows: processedData.length })

    // Identify missing fields and warnings
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
      if (!record.origOE) missingFields.push(`Row ${index + 1}: Missing origin OE`)
      if (!record.destOE) missingFields.push(`Row ${index + 1}: Missing destination OE`)
      if (!record.inbFlightNo) missingFields.push(`Row ${index + 1}: Missing inbound flight number`)
      if (record.totalKg === 0) warnings.push(`Row ${index + 1}: Weight is zero`)
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

    onProgress?.(100, "Upload complete!", { currentRow: totalRows, totalRows: totalRows, processedRows: processedData.length })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process file with mappings",
    }
  }
}

// Helper function to map display column names to CargoData field names
function getCargoFieldFromMappedColumn(mappedColumn: string): keyof CargoData | null {
  const mappingTable: Record<string, keyof CargoData> = {
    // Mail Agent column mappings
    'Inb.Flight Date': 'date',
    'Outb.Flight Date': 'outbDate',
    'Rec. ID': 'recordId',
    'Des. No.': 'desNo',
    'Rec. Numb.': 'recNumb',
    'Orig. OE': 'origOE',
    'Dest. OE': 'destOE',
    'Inb. Flight No. | STA': 'inbFlightNo',
    'Outb. Flight No. | STD': 'outbFlightNo',
    'Mail Cat.': 'mailCat',
    'Mail Class': 'mailClass',
    'Total kg': 'totalKg',
    'Invoice': 'invoiceExtend',
    'Customer name / number': 'customer',
    // Mail System column mappings (original predefined)
    'Flight Date': 'date',
    'Record ID': 'recordId',
    'Destination': 'desNo',
    'Record Number': 'recNumb',
    'Origin OE': 'origOE',
    'Destination OE': 'destOE',
    'Flight Number': 'inbFlightNo',
    'Outbound Flight': 'outbFlightNo',
    'Mail Category': 'mailCat',
    'Mail Classification': 'mailClass',
    'Weight kg': 'totalKg',
    'Invoice Type': 'invoiceExtend',
    'Customer Info': 'customer',
  }
  
  return mappingTable[mappedColumn] || null
}