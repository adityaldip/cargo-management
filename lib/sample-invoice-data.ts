import type { Invoice } from "@/lib/pdf-generator"

// Sample invoice data
export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2025-001",
    customer: "AirMail Limited",
    date: "2025-01-15",
    dueDate: "2025-02-14",
    amount: 2847.50,
    status: "paid",
    items: 25,
    totalWeight: 156.8,
    route: "USFRAT → USRIXT",
    paymentMethod: "Bank Transfer"
  },
  {
    id: "2",
    invoiceNumber: "INV-2025-002",
    customer: "Euro Express",
    date: "2025-01-18",
    dueDate: "2025-02-17",
    amount: 4125.75,
    status: "pending",
    items: 18,
    totalWeight: 234.6,
    route: "DKCPHA → FRANK"
  },
  {
    id: "3",
    invoiceNumber: "INV-2025-003",
    customer: "Nordic Post",
    date: "2025-01-10",
    dueDate: "2025-02-09",
    amount: 3456.80,
    status: "overdue",
    items: 32,
    totalWeight: 287.3,
    route: "SEARNK → OSLO"
  },
  {
    id: "4",
    invoiceNumber: "INV-2025-004",
    customer: "Central Mail",
    date: "2025-01-22",
    dueDate: "2025-02-21",
    amount: 5802.30,
    status: "draft",
    items: 42,
    totalWeight: 892.4,
    route: "CZPRG → DEBER"
  },
  {
    id: "5",
    invoiceNumber: "INV-2025-005",
    customer: "Scan Mail",
    date: "2025-01-25",
    dueDate: "2025-02-24",
    amount: 3458.20,
    status: "pending",
    items: 28,
    totalWeight: 456.7,
    route: "SEARNK → OSLOG"
  }
]

// Pre-existing customer data for demo purposes
export const preExistingCustomers = [
  {
    customer: "AirMail Limited / ZZXDA14",
    totalKg: 245.8,
    totalEur: 1250.75,
    parcels: 45,
    euRevenue: 850.25,
    nonEuRevenue: 400.5,
    routes: new Set(["USFRAT → USRIXT", "USFRAT → USROMT", "USFRAT → USVNOT"]),
  },
  {
    customer: "Euro Express",
    totalKg: 312.4,
    totalEur: 1564.2,
    parcels: 52,
    euRevenue: 1100.15,
    nonEuRevenue: 464.05,
    routes: new Set(["DKCPHA → FRANK", "GBLON → FRANK"]),
  },
  {
    customer: "Nordic Post",
    totalKg: 189.3,
    totalEur: 945.2,
    parcels: 32,
    euRevenue: 945.2,
    nonEuRevenue: 0,
    routes: new Set(["SEARNK → OSLO", "DKCPH → GBLON"]),
  },
  {
    customer: "Central Mail",
    totalKg: 456.7,
    totalEur: 2283.5,
    parcels: 78,
    euRevenue: 1825.8,
    nonEuRevenue: 457.7,
    routes: new Set(["CZPRG → DEBER", "CZPRG → FRANK"]),
  },
  {
    customer: "Scan Mail",
    totalKg: 203.1,
    totalEur: 1015.5,
    parcels: 35,
    euRevenue: 1015.5,
    nonEuRevenue: 0,
    routes: new Set(["SEARNK → OSLOG", "SEARNK → DKCPH"]),
  }
]
