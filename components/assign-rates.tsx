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
  Calculator
} from "lucide-react"
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
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)

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

  // Filter rules based on search
  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.actions.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const handleEditRule = (rule: RateRule) => {
    setSelectedRule(rule)
    setIsRuleEditorOpen(true)
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
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Set Up Rates</CardTitle>
            <p className="text-sm text-gray-600">
              Configure rate fields and their display order
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRateConfigs(prev => 
                    prev.map(config => ({ ...config, visible: true }))
                  )}
                >
                  Show All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRateConfigs(prev => 
                    prev.map(config => ({ ...config, visible: false }))
                  )}
                >
                  Hide All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRateConfigs(prev => 
                    prev.map((config, index) => ({ ...config, order: index + 1 }))
                  )}
                >
                  Reset Order
                </Button>
              </div>

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
                        {config.visible ? 'Visible' : 'Hidden'}
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

                    {/* Order Display */}
                    <div className="text-sm text-gray-500 min-w-[60px]">
                      Order: {config.order}
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      variant={config.visible ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {config.visible ? "Shown" : "Hidden"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
                      setSelectedRule(null)
                      setIsRuleEditorOpen(true)
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
              <div className="space-y-1">
                {filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, rule.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rule.id)}
                    className={cn(
                      "flex items-center gap-4 p-1 border rounded-lg transition-all cursor-pointer hover:bg-gray-50",
                      rule.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                      draggedRule === rule.id && "opacity-50"
                    )}
                    onClick={() => handleEditRule(rule)}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab hover:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Priority Badge */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                      {rule.priority}
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Rule Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-black truncate">{rule.name}</h3>
                        {getRateTypeBadge(rule.actions.rateType)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{rule.description}</p>
                    </div>

                    {/* Rate Info */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-black">
                        {rule.actions.currency} {rule.actions.baseRate.toFixed(2)}
                        {rule.actions.rateType === "per_kg" && "/kg"}
                      </p>
                      <p className="text-xs text-gray-500">{rule.matchCount} matches</p>
                      {rule.lastRun && (
                        <p className="text-xs text-gray-400">
                          Last update: {new Date(rule.lastRun).toLocaleDateString()}
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Copy rule logic
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Delete rule logic
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

          {/* Rule Editor Modal */}
          <Dialog open={isRuleEditorOpen} onOpenChange={setIsRuleEditorOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedRule ? `Edit Rate Rule: ${selectedRule.name}` : "Create New Rate Rule"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Rule Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input 
                      id="rule-name"
                      placeholder="e.g., EU Premium Rate Structure"
                      defaultValue={selectedRule?.name}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-rate-type">Rate Type</Label>
                    <Select defaultValue={selectedRule?.actions.rateType || "per_kg"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rate type" />
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

                <div>
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea 
                    id="rule-description"
                    placeholder="Describe this rate rule..."
                    defaultValue={selectedRule?.description}
                  />
                </div>

                {/* Rate Configuration */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="base-rate">Base Rate</Label>
                    <Input 
                      id="base-rate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={selectedRule?.actions.baseRate}
                    />
                  </div>
                  <div>
                    <Label htmlFor="multiplier">Multiplier</Label>
                    <Input 
                      id="multiplier"
                      type="number"
                      step="0.01"
                      placeholder="1.00"
                      defaultValue={selectedRule?.actions.multiplier || 1.0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select defaultValue={selectedRule?.actions.currency || "EUR"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rule Conditions */}
                <div>
                  <Label>Conditions</Label>
                  <div className="space-y-2 mt-2">
                    {(selectedRule?.conditions || [{ field: "route", operator: "equals", value: "" }]).map((condition, idx) => (
                      <div key={idx} className="flex gap-2 items-center p-3 border rounded-lg">
                        <Select defaultValue={condition.field}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
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
                        
                        <Select defaultValue={condition.operator}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="starts_with">Starts with</SelectItem>
                            <SelectItem value="ends_with">Ends with</SelectItem>
                            <SelectItem value="greater_than">Greater than</SelectItem>
                            <SelectItem value="less_than">Less than</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input 
                          placeholder="Value"
                          defaultValue={condition.value}
                          className="flex-1"
                        />
                        
                        {condition.operator === "between" && (
                          <Input 
                            placeholder="Max value"
                            defaultValue={condition.value2}
                            className="flex-1"
                          />
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="rule-tags">Tags</Label>
                  <Input 
                    id="rule-tags"
                    placeholder="EU, Premium, Express (comma separated)"
                    defaultValue={selectedRule?.actions.tags.join(", ")}
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsRuleEditorOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-black hover:bg-gray-800 text-white">
                    {selectedRule ? "Update Rule" : "Create Rule"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              <Button
                className="bg-black text-white"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Rates
              </Button>
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
              <table className="w-full text-sm border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Inb.Flight Date</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Outb.Flight Date</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Rec. ID</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Des. No.</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Rec. Numb.</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Orig. OE</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Dest. OE</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Inb. Flight No.</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Outb. Flight No.</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Mail Cat.</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Mail Class</th>
                    <th className="border border-gray-300 p-1 text-right text-black font-medium">Total kg</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium">Invoice</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium bg-yellow-200">Applied Rule</th>
                    <th className="border border-gray-300 p-1 text-right text-black font-medium bg-yellow-200">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }, (_, index) => {
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
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1 text-gray-900">{inbDate}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{outbDate}</td>
                        <td className="border border-gray-300 p-1 text-gray-900 font-mono text-xs">{recId}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{desNo}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{recNumb}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{origOE}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{destOE}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{flightNos[Math.floor(Math.random() * flightNos.length)]}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{flightNos[Math.floor(Math.random() * flightNos.length)]}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{mailCat}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{mailClass}</td>
                        <td className="border border-gray-300 p-1 text-gray-900 text-right">{(Math.random() * 50 + 0.1).toFixed(1)}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)]}</td>
                        <td className="border border-gray-300 p-1 text-gray-900 text-xs bg-yellow-200">{appliedRules[Math.floor(Math.random() * appliedRules.length)]}</td>
                        <td className="border border-gray-300 p-1 text-gray-900 text-xs bg-yellow-200 text-right">€{(Math.random() * 15 + 2.5).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-2 text-center">
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
