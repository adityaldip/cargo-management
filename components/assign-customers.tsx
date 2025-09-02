"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  UserCheck, 
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
  ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProcessedData } from "@/types/cargo-data"

interface AssignCustomersProps {
  data: ProcessedData | null
  savedPriorityConditions?: any[]
  onSavePriorityConditions?: (conditions: any[]) => void
}

interface CustomerRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  conditions: {
    field: "route" | "weight" | "mail_category" | "customer" | "flight_number"
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

// Sample airBaltic automation rules (based on Gorgias template)
const SAMPLE_RULES: CustomerRule[] = [
  {
    id: "1",
    name: "auto-close (general)",
    description: "Automatically close general cargo shipments after processing completion",
    isActive: true,
    priority: 1,
    conditions: [
      { field: "mail_category", operator: "equals", value: "C" },
      { field: "weight", operator: "less_than", value: "25" }
    ],
    actions: {
      assignTo: "General Processing Team",
      priority: "low",
      tags: ["Auto-close", "General", "Standard"]
    },
    matchCount: 156,
    lastRun: "2025-01-28T12:00:00Z"
  },
  {
    id: "2", 
    name: "Cargo Facts",
    description: "Auto-populate cargo documentation with flight and route details",
    isActive: true,
    priority: 2,
    conditions: [
      { field: "route", operator: "contains", value: "RIX,TLL,VNO" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      assignTo: "Documentation Team",
      priority: "medium", 
      tags: ["Documentation", "Auto-populate", "Facts"]
    },
    matchCount: 89,
    lastRun: "2025-01-28T09:15:00Z"
  },
  {
    id: "3",
    name: "auto assign agent / team",
    description: "Automatically assign cargo to appropriate handling agent based on route and priority",
    isActive: true,
    priority: 3,
    conditions: [
      { field: "route", operator: "contains", value: "FRANK,DEBER,CZPRG" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      assignTo: "Premium Express Team",
      priority: "high",
      tags: ["Auto-assign", "Agent", "Priority"]
    },
    matchCount: 45,
    lastRun: "2025-01-28T10:30:00Z"
  },
  {
    id: "4",
    name: "Whatsapp auto-message",
    description: "Send automated WhatsApp notifications for high-priority cargo updates",
    isActive: true,
    priority: 4,
    conditions: [
      { field: "mail_category", operator: "equals", value: "A" },
      { field: "weight", operator: "greater_than", value: "50" }
    ],
    actions: {
      assignTo: "Communication Team",
      priority: "high",
      tags: ["WhatsApp", "Auto-message", "Notifications"]
    },
    matchCount: 34,
    lastRun: "2025-01-28T11:45:00Z"
  },
  {
    id: "5",
    name: "#jeff-reading",
    description: "Auto-tag cargo requiring special handling review by Jeff's team",
    isActive: true,
    priority: 5,
    conditions: [
      { field: "weight", operator: "greater_than", value: "100" },
      { field: "mail_category", operator: "equals", value: "B" }
    ],
    actions: {
      assignTo: "Special Handling Team",
      priority: "medium",
      tags: ["Jeff-reading", "Special", "Review"]
    },
    matchCount: 12,
    lastRun: "2025-01-28T08:20:00Z"
  },
  {
    id: "6",
    name: "email campaigns",
    description: "Trigger automated email campaigns for customer cargo status updates",
    isActive: true,
    priority: 6,
    conditions: [
      { field: "customer", operator: "contains", value: "Premium,Express" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      assignTo: "Marketing Team",
      priority: "medium",
      tags: ["Email", "Campaign", "Customer-updates"]
    },
    matchCount: 67,
    lastRun: "2025-01-28T07:30:00Z"
  },
  {
    id: "7",
    name: "auto-close (OTP's)",
    description: "Automatically close One Time Password verified shipments",
    isActive: true,
    priority: 7,
    conditions: [
      { field: "customer", operator: "contains", value: "Verified" },
      { field: "mail_category", operator: "equals", value: "A" }
    ],
    actions: {
      assignTo: "Security Team",
      priority: "high",
      tags: ["Auto-close", "OTP", "Security"]
    },
    matchCount: 23,
    lastRun: "2025-01-28T06:15:00Z"
  },
  {
    id: "8",
    name: "auto assign team [receipts] & [reimburse]",
    description: "Auto-assign financial processing team for receipt handling and reimbursements",
    isActive: true,
    priority: 8,
    conditions: [
      { field: "customer", operator: "contains", value: "Corporate,Business" },
      { field: "weight", operator: "greater_than", value: "10" }
    ],
    actions: {
      assignTo: "Financial Processing Team",
      priority: "medium",
      tags: ["Receipts", "Reimburse", "Financial"]
    },
    matchCount: 41,
    lastRun: "2025-01-28T05:45:00Z"
  }
]

export function AssignCustomers({ data, savedPriorityConditions, onSavePriorityConditions }: AssignCustomersProps) {
  const [activeTab, setActiveTab] = useState<"configure" | "execute">("configure")
  const [currentView, setCurrentView] = useState<"rules" | "results">("rules")
  const [rules, setRules] = useState<CustomerRule[]>(SAMPLE_RULES)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState<CustomerRule | null>(null)
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)

  // Filter rules based on search
  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.actions.assignTo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const handleEditRule = (rule: CustomerRule) => {
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

  const getStatusIcon = (rule: CustomerRule) => {
    if (!rule.isActive) return <Pause className="h-4 w-4 text-gray-400" />
    if (rule.matchCount > 50) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (rule.matchCount > 10) return <Play className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { label: "High", className: "bg-red-100 text-red-800" },
      medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800" },
      low: { label: "Low", className: "bg-green-100 text-green-800" }
    }
    return (
      <Badge className={config[priority as keyof typeof config].className}>
        {config[priority as keyof typeof config].label}
      </Badge>
    )
  }

  const getConditionIcon = (field: string) => {
    const icons = {
      route: MapPin,
      weight: Weight,
      mail_category: Package,
      customer: UserCheck,
      flight_number: Plane
    }
    const Icon = icons[field as keyof typeof icons] || Settings
    return <Icon className="h-3 w-3" />
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* <p className="text-gray-600"></p> */}
      </div>

      {/* Configure/Execute Tabs - Always Visible */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "configure" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("configure")
              setCurrentView("rules")
            }}
            className={
              activeTab === "configure"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Configure Rules
          </Button>
          <Button
            variant={activeTab === "execute" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("execute")
              setCurrentView("rules")
            }}
            className={
              activeTab === "execute"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Execute Rules
          </Button>
        </div>
      </div>

      {/* Rules View */}
      {currentView === "rules" && (
        <>

      {/* Configure Rules Tab */}
      {activeTab === "configure" && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-black">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-black">{rules.reduce((sum, r) => sum + r.matchCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Match Rate</p>
                <p className="text-2xl font-bold text-black">{Math.round(rules.reduce((sum, r) => sum + r.matchCount, 0) / rules.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Management */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Automation Rules
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
                Execute Automation
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search rules by name, description, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                draggable
                onDragStart={(e) => handleDragStart(e, rule.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, rule.id)}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-lg transition-all cursor-pointer hover:bg-gray-50",
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
                    {/* {getStatusIcon(rule)} */}
                    {/* {getPriorityBadge(rule.actions.priority)} */}
                  </div>
                  {/* <p className="text-sm text-gray-600 truncate">{rule.description}</p> */}
                  
                  {/* Conditions Preview */}
                  {/* <div className="flex items-center gap-2 mt-2">
                    {rule.conditions.slice(0, 2).map((condition, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                        {getConditionIcon(condition.field)}
                        {condition.field}: {condition.value}
                      </Badge>
                    ))}
                    {rule.conditions.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{rule.conditions.length - 2} more
                      </Badge>
                    )}
                  </div> */}
                </div>

                {/* Assignment Info */}
                <div className="text-right">
                  {/* <p className="text-sm font-medium text-black">{rule.actions.assignTo}</p>
                  <p className="text-xs text-gray-500">{rule.matchCount} matches</p> */}
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
              <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No rules found matching your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Editor Modal */}
      <Dialog open={isRuleEditorOpen} onOpenChange={setIsRuleEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? `Edit Rule: ${selectedRule.name}` : "Create New Rule"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Rule Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input 
                  id="rule-name"
                  placeholder="e.g., High Priority EU Routes"
                  defaultValue={selectedRule?.name}
                />
              </div>
              <div>
                <Label htmlFor="rule-customer">Assign To Customer</Label>
                <Select defaultValue={selectedRule?.actions.assignTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Premium Express Ltd">Premium Express Ltd</SelectItem>
                    <SelectItem value="Nordic Post AS">Nordic Post AS</SelectItem>
                    <SelectItem value="Cargo Masters International">Cargo Masters International</SelectItem>
                    <SelectItem value="Baltic Express Network">Baltic Express Network</SelectItem>
                    <SelectItem value="General Mail Services">General Mail Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="rule-description">Description</Label>
              <Textarea 
                id="rule-description"
                placeholder="Describe what this rule does..."
                defaultValue={selectedRule?.description}
              />
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
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      placeholder="Value"
                      defaultValue={condition.value}
                      className="flex-1"
                    />
                    
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

            {/* Rule Actions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-priority">Priority Level</Label>
                <Select defaultValue={selectedRule?.actions.priority || "medium"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rule-tags">Tags</Label>
                <Input 
                  id="rule-tags"
                  placeholder="EU, Express, Priority (comma separated)"
                  defaultValue={selectedRule?.actions.tags.join(", ")}
                />
              </div>
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
            <CardTitle className="text-black flex items-center gap-2">
              <Play className="h-5 w-5" />
              Execute Automation Rules
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Run automation rules against your cargo data to automatically assign teams and process shipments.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Execution Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Ready to Execute</span>
                </div>
                <p className="text-sm text-green-700">
                  {rules.filter(r => r.isActive).length} active rules will be applied to {data?.data?.length || 0} cargo records
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Estimated Time</span>
                </div>
                <p className="text-sm text-blue-700">
                  ~2-3 minutes for full processing
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Last Execution</span>
                </div>
                <p className="text-sm text-purple-700">
                  Today at 12:00 PM
                </p>
              </div>
            </div>

            {/* Active Rules Preview */}
            <div>
              <h3 className="text-lg font-medium text-black mb-4">Rules to Execute ({rules.filter(r => r.isActive).length})</h3>
              <div className="space-y-2">
                {rules.filter(r => r.isActive).map((rule, index) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-black">{rule.name}</p>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-black">{rule.actions.assignTo}</p>
                      <p className="text-xs text-gray-500">Expected: ~{rule.matchCount} matches</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-gray-600">
                  This will process all cargo data and assign teams automatically
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Results
                </Button>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={() => setCurrentView("results")}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute All Rules
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Results View */}
      {currentView === "results" && data && (
        <>
          {/* Navigation Button */}
          <div className="flex justify-start mb-6">
            <Button 
              variant="default"
              onClick={() => setCurrentView("rules")}
              className="bg-black text-white hover:bg-gray-800"
            >
              Assign Customers
            </Button>
          </div>

          {/* Data Table Display */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-black flex items-center gap-2">
                <Play className="h-5 w-5" />
                Cargo Data Table
              </CardTitle>
            </div>
            <p className="text-gray-600 text-sm">
              Showing {data.data.length} cargo records with automation rules applied
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record ID</TableHead>
                    <TableHead>Flight Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Flight No.</TableHead>
                    <TableHead>Mail Cat.</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Assigned Team</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row: any, index) => {
                    // Apply rule matching logic to determine assigned team
                    const matchedRule = rules.find(rule => {
                      if (!rule.isActive) return false
                      return rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        const conditionValue = condition.value.toLowerCase()
                        
                        switch (condition.operator) {
                          case 'contains':
                            return fieldValue.includes(conditionValue)
                          case 'equals':
                            return fieldValue === conditionValue
                          case 'greater_than':
                            return parseFloat(fieldValue) > parseFloat(conditionValue)
                          case 'less_than':
                            return parseFloat(fieldValue) < parseFloat(conditionValue)
                          default:
                            return false
                        }
                      })
                    })

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {String(row["Rec. ID"] || row["Record ID"] || `REC-${index + 1}`).substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          {row["Inb.Flight Date"] || row["Flight Date"] || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{row["Orig. OE"] || "N/A"}</span>
                            <span>→</span>
                            <span>{row["Dest. OE"] || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row["Inb. Flight No."] || row["Flight No."] || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row["Mail Cat."] || row["Category"] || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row["Total kg"] || row["Weight"] || "0.0"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {String(row["Customer name / number"] || row["Customer"] || "Unknown").split("/")[0].trim()}
                        </TableCell>
                        <TableCell>
                          {matchedRule ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {matchedRule.actions.assignTo}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {matchedRule ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Processed
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">{data.data.length}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.data.filter((row: any) => 
                      rules.some(rule => rule.isActive && rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        return fieldValue.includes(condition.value.toLowerCase())
                      }))
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.data.length - data.data.filter((row: any) => 
                      rules.some(rule => rule.isActive && rule.conditions.some(condition => {
                        const fieldValue = String(row[condition.field] || '').toLowerCase()
                        return fieldValue.includes(condition.value.toLowerCase())
                      }))
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{rules.filter(r => r.isActive).length}</div>
                  <div className="text-sm text-gray-600">Rules Applied</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  )
}
