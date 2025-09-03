// Sample customer rules data
export interface CustomerRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  where: string[]
  conditions: {
    logic: "or" | "and"
    field: "orig_dest_oe" | "flight_number" | "mail_category" | "mail_class" | "weight"
    operator: "equals" | "contains" | "greater_than" | "less_than" | "starts_with" | "ends_with"
    value: string
  }[]
  actions: {
    assignTo: string
    priority: "high" | "medium" | "low"
    tags: string[]
  }
  matchCount: number
  lastRun?: string
}

// Sample rules with proper field mappings and where fields
export const SAMPLE_CUSTOMER_RULES: CustomerRule[] = [
  // Orig.OE or Des.OE rules
  { id: "1", name: "DKCPHA", description: "Auto-assign routes", isActive: true, priority: 1, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or", field: "orig_dest_oe", operator: "equals", value: "DKCPHA" }], actions: { assignTo: "POST DANMARK A/S / QDKCPHA", priority: "high", tags: ["Denmark"] }, matchCount: 45, lastRun: "2025-01-28T12:00:00Z" },
  { id: "2", name: "DKCPHB", description: "Auto-assign routes", isActive: true, priority: 2, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or", field: "orig_dest_oe", operator: "equals", value: "DKCPHB" }], actions: { assignTo: "POST DANMARK A/S / QDKCPHA", priority: "high", tags: ["Denmark"] }, matchCount: 32, lastRun: "2025-01-28T11:45:00Z" },
  { id: "3", name: "DKCPHC", description: "Auto-assign routes", isActive: true, priority: 3, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or", field: "orig_dest_oe", operator: "equals", value: "DKCPHC" }], actions: { assignTo: "POST DANMARK A/S / QDKCPHA", priority: "high", tags: ["Denmark"] }, matchCount: 28, lastRun: "2025-01-28T11:30:00Z" },
  { id: "4", name: "DKCPHP", description: "Auto-assign routes", isActive: true, priority: 4, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or", field: "orig_dest_oe", operator: "equals", value: "DKCPHP" }], actions: { assignTo: "POST DANMARK A/S / QDKCPHA", priority: "high", tags: ["Denmark"] }, matchCount: 19, lastRun: "2025-01-28T11:15:00Z" },
  { id: "5", name: "ISREKA", description: "Auto-assign routes", isActive: true, priority: 5, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",  field: "orig_dest_oe", operator: "equals", value: "ISREKA" }], actions: { assignTo: "POST DANMARK A/S / QDKCPHA", priority: "medium", tags: ["Israel"] }, matchCount: 15, lastRun: "2025-01-28T11:00:00Z" },
  { id: "6", name: "SESTOK", description: "Auto-assign routes", isActive: true, priority: 6, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or", field: "orig_dest_oe", operator: "equals", value: "SESTOK" }], actions: { assignTo: "DIRECT LINK WORLWIDE INC. / QDLW", priority: "medium", tags: ["Sweden"] }, matchCount: 67, lastRun: "2025-01-28T10:45:00Z" },
  { id: "7", name: "USEWRZ", description: "Auto-assign routes", isActive: true, priority: 7, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or", field: "orig_dest_oe", operator: "equals", value: "USEWRZ" }], actions: { assignTo: "DIRECT LINK WORLWIDE INC. / QDLW", priority: "medium", tags: ["US"] }, matchCount: 39, lastRun: "2025-01-28T10:15:00Z" },
  { id: "8", name: "USCHIX", description: "Auto-assign routes", isActive: true, priority: 8, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "USCHIX" }], actions: { assignTo: "DIRECT LINK WORLWIDE INC. / QDLW", priority: "medium", tags: ["US"] }, matchCount: 39, lastRun: "2025-01-28T10:15:00Z" },
  { id: "9", name: "USLAXS", description: "Auto-assign routes", isActive: true, priority: 9, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "USLAXS" }], actions: { assignTo: "DIRECT LINK WORLWIDE INC. / QDLW", priority: "medium", tags: ["US"] }, matchCount: 51, lastRun: "2025-01-28T10:00:00Z" },
  { id: "10", name: "SEARND", description: "Auto-assign routes", isActive: true, priority: 10, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEARND" }], actions: { assignTo: "DIRECT LINK WORLWIDE INC. / QDLW", priority: "medium", tags: ["Sweden"] }, matchCount: 24, lastRun: "2025-01-28T09:45:00Z" },
  { id: "11", name: "SEMMAA", description: "Auto-assign routes", isActive: true, priority: 11, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAA" }], actions: { assignTo: "DIRECT LINK WORLWIDE INC. / QDLW", priority: "medium", tags: ["Sweden"] }, matchCount: 35, lastRun: "2025-01-28T09:40:00Z" },
  { id: "12", name: "SEMMAB", description: "Auto-assign routes", isActive: true, priority: 12, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAB" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 56, lastRun: "2025-01-28T09:30:00Z" },
  { id: "13", name: "SEMMAH", description: "Auto-assign routes", isActive: true, priority: 13, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAH" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 41, lastRun: "2025-01-28T09:25:00Z" },
  { id: "14", name: "SEMMAI", description: "Auto-assign routes", isActive: true, priority: 14, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAI" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 38, lastRun: "2025-01-28T09:20:00Z" },
  { id: "15", name: "SEMMAC", description: "Auto-assign routes", isActive: true, priority: 15, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAC" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 29, lastRun: "2025-01-28T09:15:00Z" },
  { id: "16", name: "SEMMAF", description: "Auto-assign routes", isActive: true, priority: 16, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAF" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 33, lastRun: "2025-01-28T09:10:00Z" },
  { id: "17", name: "SEMMAQ", description: "Auto-assign routes", isActive: true, priority: 17, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAQ" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 27, lastRun: "2025-01-28T09:05:00Z" },
  { id: "18", name: "SEMMAG", description: "Auto-assign routes", isActive: true, priority: 18, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "SEMMAG" }], actions: { assignTo: "POSTNORD SVERIGE AB / QSTO", priority: "high", tags: ["Sweden"] }, matchCount: 31, lastRun: "2025-01-28T09:00:00Z" },
  { id: "19", name: "NLHFDW", description: "Auto-assign routes", isActive: true, priority: 19, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "NLHFDW" }], actions: { assignTo: "POSTPLUS GROUP BV / QPPL", priority: "medium", tags: ["Netherlands"] }, matchCount: 33, lastRun: "2025-01-28T08:55:00Z" },
  { id: "20", name: "NLHFDS", description: "Auto-assign routes", isActive: true, priority: 20, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "NLHFDS" }], actions: { assignTo: "POSTPLUS GROUP BV / QPPL", priority: "medium", tags: ["Netherlands"] }, matchCount: 28, lastRun: "2025-01-28T08:50:00Z" },
  { id: "21", name: "NLHFDR", description: "Auto-assign routes", isActive: true, priority: 21, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "NLHFDR" }], actions: { assignTo: "POSTPLUS GROUP BV / QPPL", priority: "medium", tags: ["Netherlands"] }, matchCount: 25, lastRun: "2025-01-28T08:45:00Z" },
  { id: "22", name: "LV%", description: "Auto-assign routes", isActive: true, priority: 22, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "LV%" }], actions: { assignTo: "LATVIJAS PASTS VAS / QPASTS", priority: "high", tags: ["Latvia"] }, matchCount: 156, lastRun: "2025-01-28T08:40:00Z" },
  { id: "23", name: "TM%", description: "Auto-assign routes", isActive: true, priority: 23, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "TM%" }], actions: { assignTo: "LATVIJAS PASTS VAS / QPASTS", priority: "medium", tags: ["Turkmenistan"] }, matchCount: 42, lastRun: "2025-01-28T08:35:00Z" },
  { id: "24", name: "KG%", description: "Auto-assign routes", isActive: true, priority: 24, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "KG%" }], actions: { assignTo: "LATVIJAS PASTS VAS / QPASTS", priority: "medium", tags: ["Kyrgyzstan"] }, matchCount: 38, lastRun: "2025-01-28T08:30:00Z" },
  { id: "25", name: "BY%", description: "Auto-assign routes", isActive: true, priority: 25, where: ["Orig.OE", "Des.OE"], conditions: [{ logic: "or",field: "orig_dest_oe", operator: "equals", value: "BY%" }], actions: { assignTo: "BELPOCHTA RSA / QBEL", priority: "medium", tags: ["Belarus"] }, matchCount: 78, lastRun: "2025-01-28T08:25:00Z" },
  
  // Flight Number rules
  { id: "26", name: "BT620%", description: "Auto-assign routes", isActive: true, priority: 26, where: ["Inb. Flight No.", "Outb. Flight No."], conditions: [{ logic: "or",field: "flight_number", operator: "equals", value: "BT620%" }], actions: { assignTo: "Royal Postnl B.V. / QTNTP", priority: "high", tags: ["Flight"] }, matchCount: 34, lastRun: "2025-01-28T01:50:00Z" },
  { id: "27", name: "BT733", description: "Auto-assign routes", isActive: true, priority: 27, where: ["Inb. Flight No.", "Outb. Flight No."], conditions: [{ logic: "or",field: "flight_number", operator: "equals", value: "BT733" }], actions: { assignTo: "Azerbaijan Routes / BAK", priority: "medium", tags: ["Flight"] }, matchCount: 21, lastRun: "2025-01-28T01:45:00Z" },
  { id: "28", name: "BT69%", description: "Auto-assign routes", isActive: true, priority: 28, where: ["Inb. Flight No.", "Outb. Flight No."], conditions: [{ logic: "or",field: "flight_number", operator: "equals", value: "BT69%" }], actions: { assignTo: "KALES AIRLINE SERVICES PAR / QKALF", priority: "high", tags: ["Flight"] }, matchCount: 45, lastRun: "2025-01-28T01:40:00Z" },
  { id: "29", name: "BT658%", description: "Auto-assign routes", isActive: true, priority: 29, where: ["Inb. Flight No.", "Outb. Flight No."], conditions: [{ logic: "or",field: "flight_number", operator: "equals", value: "BT658%" }], actions: { assignTo: "AIRTRANS AVIATION LTD / QAAL", priority: "high", tags: ["Flight"] }, matchCount: 32, lastRun: "2025-01-28T01:35:00Z" },
  { id: "30", name: "BT65%", description: "Auto-assign routes", isActive: true, priority: 30, where: ["Inb. Flight No.", "Outb. Flight No."], conditions: [{ logic: "or",field: "flight_number", operator: "equals", value: "BT65%" }], actions: { assignTo: "WEXCO AIRFREIGHT LTD / QWEX", priority: "high", tags: ["Flight"] }, matchCount: 38, lastRun: "2025-01-28T01:30:00Z" },
  
  // Mail Category rules
  { id: "31", name: "U%", description: "Auto-assign routes", isActive: true, priority: 31, where: ["Mail Category"], conditions: [{ logic: "or",field: "mail_category", operator: "equals", value: "U%" }], actions: { assignTo: "CISMAT SRL / QCIS", priority: "high", tags: ["Mail"] }, matchCount: 156, lastRun: "2025-01-28T00:15:00Z" },
  { id: "32", name: "C%", description: "Auto-assign routes", isActive: true, priority: 32, where: ["Mail Category"], conditions: [{ logic: "or",field: "mail_category", operator: "equals", value: "C%" }], actions: { assignTo: "CISMAT SRL / QCIS", priority: "medium", tags: ["Mail"] }, matchCount: 134, lastRun: "2025-01-28T00:10:00Z" },
  { id: "33", name: "E%", description: "Auto-assign routes", isActive: true, priority: 33, where: ["Mail Category"], conditions: [{logic: "or", field: "mail_category", operator: "equals", value: "E%" }], actions: { assignTo: "CISMAT SRL / QCIS", priority: "medium", tags: ["Mail"] }, matchCount: 89, lastRun: "2025-01-28T00:05:00Z" },
  
  // Mail Class rules
  { id: "34", name: "BE%", description: "Auto-assign routes", isActive: true, priority: 34, where: ["Mail Class"], conditions: [{ logic: "or",field: "mail_class", operator: "equals", value: "BE%" }], actions: { assignTo: "MLC EXPERT SRL / QMLC", priority: "medium", tags: ["Mail-Class"] }, matchCount: 52, lastRun: "2025-01-28T00:00:00Z" },
  { id: "35", name: "AT%", description: "Auto-assign routes", isActive: true, priority: 35, where: ["Mail Class"], conditions: [{ logic: "or",field: "mail_class", operator: "equals", value: "AT%" }], actions: { assignTo: "MLC EXPERT SRL / QMLC", priority: "medium", tags: ["Mail-Class"] }, matchCount: 47, lastRun: "2025-01-27T23:55:00Z" }
]