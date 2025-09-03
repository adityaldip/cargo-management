"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DollarSign, 
  Settings, 
  Plus, 
  Search, 
  GripVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plane,
  Package,
  MapPin,
  Weight,
  Eye,
  Calculator,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { ProcessedData } from "@/types/cargo-data"

interface AssignRatesProps {
  data: ProcessedData | null
  savedRateConditions?: any[]
  onSaveRateConditions?: (conditions: any[]) => void
}

interface RateRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  conditions: {
    field: "route" | "weight" | "mail_category" | "customer" | "flight_number" | "distance"
    operator: "equals" | "contains" | "greater_than" | "less_than" | "starts_with" | "ends_with" | "between"
    value: string
    value2?: string // for 'between' operator
  }[]
  actions: {
    rateType: "fixed" | "per_kg" | "distance_based" | "zone_based"
    baseRate: number
    multiplier?: number
    currency: "EUR" | "USD" | "GBP"
    tags: string[]
  }
  matchCount: number
  lastRun?: string
}

// Sample airBaltic rate automation rules
const SAMPLE_RATE_RULES: RateRule[] = [
  {
    id: "1",
    name: "EU Zone Standard Rate",
    description: "Standard rate for EU destinations under 25kg",
    isActive: true,
    priority: 1,
    conditions: [
      { field: "route", operator: "contains", value: "FRANK,DEBER,CZPRG,ITFCO" },
      { field: "weight", operator: "less_than", value: "25" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      rateType: "per_kg",
      baseRate: 4.50,
      multiplier: 1.0,
      currency: "EUR",
      tags: ["EU", "Standard", "Light"]
    },
    matchCount: 234,
    lastRun: "2025-01-28T12:00:00Z"
  },
  {
    id: "2", 
    name: "Nordic Express Premium",
    description: "Premium rates for Nordic routes with priority handling",
    isActive: true,
    priority: 2,
    conditions: [
      { field: "route", operator: "contains", value: "SEARNK,NOKRS,DKAAR,FICPH" },
      { field: "mail_category", operator: "equals", value: "A" },
      { field: "weight", operator: "greater_than", value: "10" }
    ],
    actions: {
      rateType: "per_kg",
      baseRate: 6.75,
      multiplier: 1.25,
      currency: "EUR",
      tags: ["Nordic", "Premium", "Express"]
    },
    matchCount: 89,
    lastRun: "2025-01-28T09:15:00Z"
  },
  {
    id: "3",
    name: "Heavy Cargo Discount",
    description: "Discounted rates for heavy shipments over 50kg",
    isActive: true,
    priority: 3,
    conditions: [
      { field: "weight", operator: "greater_than", value: "50" },
      { field: "mail_category", operator: "equals", value: "B" }
    ],
    actions: {
      rateType: "per_kg",
      baseRate: 3.25,
      multiplier: 0.85,
      currency: "EUR",
      tags: ["Heavy", "Discount", "Bulk"]
    },
    matchCount: 45,
    lastRun: "2025-01-28T10:30:00Z"
  },
  {
    id: "4",
    name: "Intercontinental Fixed Rate",
    description: "Fixed rate structure for intercontinental routes",
    isActive: true,
    priority: 4,
    conditions: [
      { field: "route", operator: "contains", value: "USNYC,USLAX,CAYVR,JPNRT" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      rateType: "fixed",
      baseRate: 125.00,
      currency: "EUR",
      tags: ["Intercontinental", "Fixed", "Long-haul"]
    },
    matchCount: 34,
    lastRun: "2025-01-28T11:45:00Z"
  },
  {
    id: "5",
    name: "Distance-Based Calculation",
    description: "Calculate rates based on flight distance for efficiency",
    isActive: true,
    priority: 5,
    conditions: [
      { field: "distance", operator: "between", value: "500", value2: "2000" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      rateType: "distance_based",
      baseRate: 0.08,
      multiplier: 1.0,
      currency: "EUR",
      tags: ["Distance", "Efficiency", "Calculated"]
    },
    matchCount: 156,
    lastRun: "2025-01-28T08:20:00Z"
  },
  {
    id: "6",
    name: "Zone-Based Regional",
    description: "Zone-based pricing for regional European routes",
    isActive: true,
    priority: 6,
    conditions: [
      { field: "route", operator: "contains", value: "DEBER,FRANK,NLAMR,BEGRU" },
      { field: "weight", operator: "between", value: "5", value2: "30" }
    ],
    actions: {
      rateType: "zone_based",
      baseRate: 35.00,
      multiplier: 1.15,
      currency: "EUR",
      tags: ["Zone", "Regional", "Europe"]
    },
    matchCount: 67,
    lastRun: "2025-01-28T07:30:00Z"
  }
]

interface RateConfig {
  key: string
  label: string
  visible: boolean
  order: number
}

export function AssignRates({ data, savedRateConditions, onSaveRateConditions }: AssignRatesProps) {
  const [activeTab, setActiveTab] = useState<"setup" | "configure" | "execute">("setup")
  const [rules, setRules] = useState<RateRule[]>(SAMPLE_RATE_RULES)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState<RateRule | null>(null)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("OR")
  const [filterConditions, setFilterConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([{ field: "route", operator: "equals", value: "" }])
  
  // State for expanded rule editing
  const [editingRuleConditions, setEditingRuleConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([])
  const [editingRuleLogic, setEditingRuleLogic] = useState<"AND" | "OR">("AND")

  // Rate configuration state
  const [rateConfigs, setRateConfigs] = useState<RateConfig[]>([
    { key: 'eu_zone_standard', label: 'EU Zone Standard Rate', visible: true, order: 1 },
    { key: 'nordic_express_premium', label: 'Nordic Express Premium', visible: true, order: 2 },
    { key: 'heavy_cargo_discount', label: 'Heavy Cargo Discount', visible: true, order: 3 },
    { key: 'intercontinental_fixed', label: 'Intercontinental Fixed Rate', visible: true, order: 4 },
    { key: 'distance_based_calculation', label: 'Distance-Based Calculation', visible: true, order: 5 },
    { key: 'zone_based_regional', label: 'Zone-Based Regional', visible: true, order: 6 },
  ])

  // Drag and drop state for rate configs
  const [draggedRateConfig, setDraggedRateConfig] = useState<string | null>(null)

  // Filter rules based on search and conditions
  const filteredRules = rules.filter(rule => {
    // First apply search filter
    const matchesSearch = !searchTerm || (
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.actions.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    if (!matchesSearch) return false
    
    // Then apply condition filters if any are set
    if (!showFilters || filterConditions.every(cond => !cond.value)) return true
    
    const activeConditions = filterConditions.filter(cond => cond.value.trim())
    if (activeConditions.length === 0) return true
    
    const conditionResults = activeConditions.map((filterCond) => {
      const ruleConditions = rule.conditions || []
      return ruleConditions.some(ruleCond => {
        const fieldMatch = ruleCond.field === filterCond.field
        
        if (!fieldMatch) return false
        
        const ruleValue = ruleCond.value.toLowerCase()
        const filterValue = filterCond.value.toLowerCase()
        
        switch (filterCond.operator) {
          case "contains":
            return ruleValue.includes(filterValue)
          case "equals":
            return ruleValue === filterValue
          case "starts_with":
            return ruleValue.startsWith(filterValue)
          case "ends_with":
            return ruleValue.endsWith(filterValue)
          default:
            return false
        }
      })
    })
    
    return filterLogic === "OR" 
      ? conditionResults.some(result => result)
      : conditionResults.every(result => result)
  })

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const handleEditRule = (rule: RateRule) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
      setEditingRuleConditions([])
    } else {
      setExpandedRule(rule.id)
      // Initialize editing state with current rule conditions
      const initialConditions = rule.conditions.map(cond => ({
        field: cond.field,
        operator: cond.operator,
        value: cond.value
      }))
      setEditingRuleConditions(initialConditions.length > 0 ? initialConditions : [{ field: "route", operator: "equals", value: "" }])
      setEditingRuleLogic("AND")
    }
  }

  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggedRule(ruleId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetRuleId: string) => {
    e.preventDefault()
    
    if (!draggedRule || draggedRule === targetRuleId) return

    const draggedIndex = rules.findIndex(r => r.id === draggedRule)
    const targetIndex = rules.findIndex(r => r.id === targetRuleId)
    
    const newRules = [...rules]
    const [draggedItem] = newRules.splice(draggedIndex, 1)
    newRules.splice(targetIndex, 0, draggedItem)
    
    // Update priorities based on new order
    const updatedRules = newRules.map((rule, index) => ({
      ...rule,
      priority: index + 1
    }))
    
    setRules(updatedRules)
    setDraggedRule(null)
  }

  const getStatusIcon = (rule: RateRule) => {
    if (!rule.isActive) return <Pause className="h-4 w-4 text-gray-400" />
    if (rule.matchCount > 100) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (rule.matchCount > 50) return <Play className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getRateTypeBadge = (rateType: string) => {
    const config = {
      fixed: { label: "Fixed", className: "bg-blue-100 text-blue-800" },
      per_kg: { label: "Per KG", className: "bg-green-100 text-green-800" },
      distance_based: { label: "Distance", className: "bg-purple-100 text-purple-800" },
      zone_based: { label: "Zone", className: "bg-orange-100 text-orange-800" }
    }
    return (
      <Badge className={config[rateType as keyof typeof config].className}>
        {config[rateType as keyof typeof config].label}
      </Badge>
    )
  }

  const getConditionIcon = (field: string) => {
    const icons = {
      route: MapPin,
      weight: Weight,
      mail_category: Package,
      customer: DollarSign,
      flight_number: Plane,
      distance: Calculator
    }
    const Icon = icons[field as keyof typeof icons] || Settings
    return <Icon className="h-3 w-3" />
  }

  const calculateTotalRevenue = () => {
    return rules.reduce((total, rule) => {
      if (!rule.isActive) return total
      return total + (rule.matchCount * rule.actions.baseRate * (rule.actions.multiplier || 1))
    }, 0)
  }

  const clearFilters = () => {
    setFilterConditions([{ field: "route", operator: "equals", value: "" }])
    setFilterLogic("OR")
    setShowFilters(false)
  }

  // Get unique values for each field type from sample rules
  const getFieldValues = (fieldType: string) => {
    const allValues = SAMPLE_RATE_RULES.flatMap(rule => 
      rule.conditions.map(cond => cond.value)
    )
    return [...new Set(allValues)]
  }

  // Helper functions for editing rule conditions
  const addEditingRuleCondition = () => {
    setEditingRuleConditions(prev => [...prev, { field: "route", operator: "equals", value: "" }])
  }

  const removeEditingRuleCondition = (index: number) => {
    setEditingRuleConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateEditingRuleCondition = (index: number, updates: Partial<typeof editingRuleConditions[0]>) => {
    setEditingRuleConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
  }

  // Export function
  const handleExport = () => {
    // Create sample data for export
    const sampleData = Array.from({ length: 100 }, (_, index) => {
      const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
      const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
      const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
      const mailCats = ["A", "B", "C", "D", "E"]
      const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
      const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
      const appliedRules = [
        "EU Zone Standard Rate",
        "Nordic Express Premium", 
        "Heavy Cargo Discount",
        "Intercontinental Fixed Rate",
        "Distance-Based Calculation",
        "Zone-Based Regional"
      ]

      const year = 2025
      const month = Math.floor(Math.random() * 12) + 1
      const day = Math.floor(Math.random() * 28) + 1
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
      
      const inbDate = `${year} ${monthNames[month - 1]} ${day.toString().padStart(2, '0')}`
      const outbDate = `${year} ${monthNames[month - 1]} ${(day + 1).toString().padStart(2, '0')}`
      
      const origOE = origins[Math.floor(Math.random() * origins.length)]
      const destOE = destinations[Math.floor(Math.random() * destinations.length)]
      const mailCat = mailCats[Math.floor(Math.random() * mailCats.length)]
      const mailClass = mailClasses[Math.floor(Math.random() * mailClasses.length)]
      
      const desNo = (50700 + Math.floor(Math.random() * 100)).toString()
      const recNumb = (Math.floor(Math.random() * 999) + 1).toString().padStart(3, '0')
      const recId = `${origOE}${destOE}${mailCat}${mailClass}${desNo}${recNumb}${(70000 + Math.floor(Math.random() * 9999)).toString()}`

      return {
        "Inb.Flight Date": inbDate,
        "Outb.Flight Date": outbDate,
        "Rec. ID": recId,
        "Des. No.": desNo,
        "Rec. Numb.": recNumb,
        "Orig. OE": origOE,
        "Dest. OE": destOE,
        "Inb. Flight No.": flightNos[Math.floor(Math.random() * flightNos.length)],
        "Outb. Flight No.": flightNos[Math.floor(Math.random() * flightNos.length)],
        "Mail Cat.": mailCat,
        "Mail Class": mailClass,
        "Total kg": (Math.random() * 50 + 0.1).toFixed(1),
        "Invoice": invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)],
        "Applied Rule": appliedRules[Math.floor(Math.random() * appliedRules.length)],
        "Rate": `€${(Math.random() * 15 + 2.5).toFixed(2)}`
      }
    })

    // Convert to CSV
    const headers = Object.keys(sampleData[0])
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'rate-assignments.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Rate configuration handlers
  const toggleRateConfigVisibility = (key: string) => {
    setRateConfigs(prev => 
      prev.map(config => 
        config.key === key ? { ...config, visible: !config.visible } : config
      )
    )
  }

  const updateRateConfigLabel = (key: string, label: string) => {
    setRateConfigs(prev => 
      prev.map(config => 
        config.key === key ? { ...config, label } : config
      )
    )
  }

  // Drag and drop handlers for rate configs
  const handleRateConfigDragStart = (e: React.DragEvent, configKey: string) => {
    setDraggedRateConfig(configKey)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleRateConfigDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleRateConfigDrop = (e: React.DragEvent, targetConfigKey: string) => {
    e.preventDefault()
    
    if (!draggedRateConfig || draggedRateConfig === targetConfigKey) return

    const draggedIndex = rateConfigs.findIndex(c => c.key === draggedRateConfig)
    const targetIndex = rateConfigs.findIndex(c => c.key === targetConfigKey)
    
    const newConfigs = [...rateConfigs]
    const [draggedItem] = newConfigs.splice(draggedIndex, 1)
    newConfigs.splice(targetIndex, 0, draggedItem)
    
    // Update order values based on new positions
    const updatedConfigs = newConfigs.map((config, index) => ({
      ...config,
      order: index + 1
    }))
    
    setRateConfigs(updatedConfigs)
    setDraggedRateConfig(null)
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Tabs */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "setup" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("setup")}
            className={
              activeTab === "setup"
                ? "bg-white shadow-sm text-black hover:bg-white"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            Set Up Rates
          </Button>
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("configure")}
            className={
              activeTab === "configure"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Configure Rates
          </Button>
          <Button
            variant={activeTab === "execute" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("execute")}
            className={
              activeTab === "execute"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Execute Rates
          </Button>
        </div>
      </div>

      {/* Set Up Rates Tab */}
      {activeTab === "setup" && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-black">Set Up Rates</CardTitle>
              <p className="text-sm text-gray-600">
                Configure rate fields and their display order
              </p>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              {/* Rate Configuration List */}
              <div className="space-y-1">
                {rateConfigs.map((config, index) => (
                  <div 
                    key={config.key} 
                    draggable
                    onDragStart={(e) => handleRateConfigDragStart(e, config.key)}
                    onDragOver={handleRateConfigDragOver}
                    onDrop={(e) => handleRateConfigDrop(e, config.key)}
                    className={`flex items-center gap-1 p-1 border border-gray-200 rounded-lg transition-all cursor-pointer hover:bg-gray-50 ${
                      draggedRateConfig === config.key ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab hover:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Visibility Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`rate-config-${config.key}`}
                        checked={config.visible}
                        onCheckedChange={() => toggleRateConfigVisibility(config.key)}
                      />
                      <Label
                        htmlFor={`rate-config-${config.key}`}
                        className={`text-sm ${config.visible ? 'text-black' : 'text-gray-500'}`}
                      >
                      </Label>
                    </div>

                    {/* Field Label Input */}
                    <div className="flex-1">
                      <Input
                        value={config.label}
                        onChange={(e) => updateRateConfigLabel(config.key, e.target.value)}
                        className="text-sm"
                        placeholder="Field label"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Configure Rules Tab */}
      {activeTab === "configure" && (
        <>
          {/* Rules Management */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-black flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Rate Assignment Rules
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Add new rule logic here
                      console.log("Add new rule")
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Rule
                  </Button>
                  <Button className="bg-black hover:bg-gray-800 text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Execute Rate Assignment
                  </Button>
                </div>
              </div>
            </CardHeader>

                      <CardContent>
            {/* Filter Section - Notion Style */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showFilters && filterConditions.some(c => c.value) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs h-8 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {filteredRules.length} of {rules.length} rules
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg">
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, rule.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rule.id)}
                    className={cn(
                      "flex items-center gap-4 p-3 transition-all cursor-pointer hover:bg-gray-50",
                      rule.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                      draggedRule === rule.id && "opacity-50",
                      expandedRule === rule.id && "bg-gray-50"
                    )}
                    onClick={() => handleEditRule(rule)}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab hover:cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Priority Badge */}
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                      {rule.priority}
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="scale-75"
                      />
                    </div>
                    
                    {/* Rule Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                    </div>

                    {/* Rate Info */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-black">
                        {rule.actions.currency} {rule.actions.baseRate.toFixed(2)}
                        {rule.actions.rateType === "per_kg" && "/kg"}
                      </p>
                      {rule.lastRun && (
                        <p className="text-xs text-gray-400">
                          Last run: {new Date(rule.lastRun).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRule(rule)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Copy rule logic
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Delete rule logic
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Edit Section */}
                  {expandedRule === rule.id && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="space-y-4">
                        {/* Notion-Style Filter Section */}
                        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                          {/* Filter Conditions */}
                          <div className="p-4 space-y-2">
                            {editingRuleConditions.map((condition, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group">
                                {index === 0 ? (
                                  <span className="text-sm font-medium text-gray-700 min-w-12">Where</span>
                                ) : (
                                  <Select 
                                    value={editingRuleLogic}
                                    onValueChange={(value) => setEditingRuleLogic(value as "AND" | "OR")}
                                  >
                                    <SelectTrigger className="h-8 min-w-16 max-w-16 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="AND">And</SelectItem>
                                      <SelectItem value="OR">Or</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}

                                <Select 
                                  value={condition.field}
                                  onValueChange={(value) => {
                                    updateEditingRuleCondition(index, { field: value, value: "" })
                                  }}
                                >
                                  <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                    <SelectValue placeholder="Property" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="route">Route</SelectItem>
                                    <SelectItem value="weight">Weight (kg)</SelectItem>
                                    <SelectItem value="mail_category">Mail Category</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="flight_number">Flight Number</SelectItem>
                                    <SelectItem value="distance">Distance (km)</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select 
                                  value={condition.operator}
                                  onValueChange={(value) => updateEditingRuleCondition(index, { operator: value })}
                                >
                                  <SelectTrigger className="h-8 min-w-24 max-w-32 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Is</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="starts_with">Starts with</SelectItem>
                                    <SelectItem value="ends_with">Ends with</SelectItem>
                                    <SelectItem value="greater_than">Greater than</SelectItem>
                                    <SelectItem value="less_than">Less than</SelectItem>
                                    <SelectItem value="between">Between</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select 
                                  value={condition.value}
                                  onValueChange={(value) => updateEditingRuleCondition(index, { value })}
                                >
                                  <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1">
                                    <SelectValue placeholder="Value" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {getFieldValues(condition.field).map((value) => (
                                      <SelectItem key={value} value={value}>
                                        {value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  {editingRuleConditions.length > 1 && index > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeEditingRuleCondition(index)}
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Rate Assignment Row */}
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium text-gray-700 min-w-12">Rate</span>
                                <Input 
                                  placeholder="Base rate"
                                  defaultValue={rule.actions.baseRate}
                                  className="h-8 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 w-24"
                                />
                                <Select defaultValue={rule.actions.currency}>
                                  <SelectTrigger className="h-8 w-20 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select defaultValue={rule.actions.rateType}>
                                  <SelectTrigger className="h-8 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1 min-w-32 max-w-48">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                                    <SelectItem value="per_kg">Per Kilogram</SelectItem>
                                    <SelectItem value="distance_based">Distance Based</SelectItem>
                                    <SelectItem value="zone_based">Zone Based</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Add Filter Button */}
                          <div className="px-4 pb-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={addEditingRuleCondition}
                              className="h-8 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Add condition
                            </Button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setExpandedRule(null)}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-black hover:bg-gray-800 text-white h-7 text-xs"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

              {filteredRules.length === 0 && (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No rate rules found matching your search criteria</p>
                </div>
              )}
            </CardContent>
          </Card>


        </>
      )}

      {/* Execute Rules Tab */}
      {activeTab === "execute" && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-black flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Execute Rate Assignment
                </CardTitle>
                <p className="text-sm text-gray-600">Rate assignment results for cargo data</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  className="bg-black text-white"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Execute Rates
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Total Records: <strong className="text-black">20</strong></span>
                <span>Applied Rules: <strong className="text-black">{rules.filter(r => r.isActive).length}</strong></span>
                <span>Est. Revenue: <strong className="text-black">€{calculateTotalRevenue().toFixed(0)}</strong></span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border">Inb.Flight Date</TableHead>
                    <TableHead className="border">Outb.Flight Date</TableHead>
                    <TableHead className="border">Rec. ID</TableHead>
                    <TableHead className="border">Des. No.</TableHead>
                    <TableHead className="border">Rec. Numb.</TableHead>
                    <TableHead className="border">Orig. OE</TableHead>
                    <TableHead className="border">Dest. OE</TableHead>
                    <TableHead className="border">Inb. Flight No.</TableHead>
                    <TableHead className="border">Outb. Flight No.</TableHead>
                    <TableHead className="border">Mail Cat.</TableHead>
                    <TableHead className="border">Mail Class</TableHead>
                    <TableHead className="border text-right">Total kg</TableHead>
                    <TableHead className="border">Invoice</TableHead>
                    <TableHead className="border bg-yellow-200">Applied Rule</TableHead>
                    <TableHead className="border text-right bg-yellow-200">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Generate paginated data
                    const totalItems = 100
                    const startIndex = (currentPage - 1) * itemsPerPage
                    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
                    
                    return Array.from({ length: endIndex - startIndex }, (_, i) => {
                      const index = startIndex + i
                      const origins = ["USFRAT", "GBLON", "DEFRAA", "FRPAR", "ITROM", "ESMADD", "NLAMS", "BEBRUB"]
                      const destinations = ["USRIXT", "USROMT", "USVNOT", "USCHIC", "USMIA", "USANC", "USHOU", "USDAL"]
                      const flightNos = ["BT234", "BT633", "BT341", "AF123", "LH456", "BA789", "KL012", "IB345"]
                      const mailCats = ["A", "B", "C", "D", "E"]
                      const mailClasses = ["7C", "7D", "7E", "7F", "7G", "8A", "8B", "8C"]
                      const invoiceTypes = ["Airmail", "Express", "Priority", "Standard", "Economy"]
                      const appliedRules = [
                        "EU Zone Standard Rate",
                        "Nordic Express Premium",
                        "Heavy Cargo Discount",
                        "Intercontinental Fixed Rate",
                        "Distance-Based Calculation",
                        "Zone-Based Regional"
                      ]

                      const year = 2025
                      const month = Math.floor(Math.random() * 12) + 1
                      const day = Math.floor(Math.random() * 28) + 1
                      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
                      
                      const inbDate = `${year} ${monthNames[month - 1]} ${day.toString().padStart(2, '0')}`
                      const outbDate = `${year} ${monthNames[month - 1]} ${(day + 1).toString().padStart(2, '0')}`
                      
                      const origOE = origins[Math.floor(Math.random() * origins.length)]
                      const destOE = destinations[Math.floor(Math.random() * destinations.length)]
                      const mailCat = mailCats[Math.floor(Math.random() * mailCats.length)]
                      const mailClass = mailClasses[Math.floor(Math.random() * mailClasses.length)]
                      
                      const desNo = (50700 + Math.floor(Math.random() * 100)).toString()
                      const recNumb = (Math.floor(Math.random() * 999) + 1).toString().padStart(3, '0')
                      const recId = `${origOE}${destOE}${mailCat}${mailClass}${desNo}${recNumb}${(70000 + Math.floor(Math.random() * 9999)).toString()}`

                      return (
                        <TableRow key={index}>
                          <TableCell className="border">{inbDate}</TableCell>
                          <TableCell className="border">{outbDate}</TableCell>
                          <TableCell className="border font-mono text-xs">{recId}</TableCell>
                          <TableCell className="border">{desNo}</TableCell>
                          <TableCell className="border">{recNumb}</TableCell>
                          <TableCell className="border">{origOE}</TableCell>
                          <TableCell className="border">{destOE}</TableCell>
                          <TableCell className="border">{flightNos[Math.floor(Math.random() * flightNos.length)]}</TableCell>
                          <TableCell className="border">{flightNos[Math.floor(Math.random() * flightNos.length)]}</TableCell>
                          <TableCell className="border">{mailCat}</TableCell>
                          <TableCell className="border">{mailClass}</TableCell>
                          <TableCell className="border text-right">{(Math.random() * 50 + 0.1).toFixed(1)}</TableCell>
                          <TableCell className="border">{invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)]}</TableCell>
                          <TableCell className="border text-xs bg-yellow-200">{appliedRules[Math.floor(Math.random() * appliedRules.length)]}</TableCell>
                          <TableCell className="border text-xs bg-yellow-200 text-right">€{(Math.random() * 15 + 2.5).toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })
                  })()}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, 100)} of 100 entries
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(100 / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(100 / itemsPerPage)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Rate assignment results showing applied rules and calculated rates for each cargo record
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
