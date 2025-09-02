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

interface Customer {
  id: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  contactPerson: string
  priority: "high" | "medium" | "low"
  isActive: boolean
  createdDate: string
  totalShipments: number
}

// Sample customers data
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "Premium Express Ltd",
    code: "PREM001",
    email: "contact@premiumexpress.com",
    phone: "+371 2345 6789",
    address: "Riga, Latvia",
    contactPerson: "Anna Berzina",
    priority: "high",
    isActive: true,
    createdDate: "2023-01-15",
    totalShipments: 245
  },
  {
    id: "2",
    name: "Nordic Post AS",
    code: "NORD002",
    email: "info@nordicpost.ee",
    phone: "+372 5678 9012",
    address: "Tallinn, Estonia",
    contactPerson: "Erik Saar",
    priority: "high",
    isActive: true,
    createdDate: "2023-02-20",
    totalShipments: 189
  },
  {
    id: "3",
    name: "Baltic Express Network",
    code: "BALT003",
    email: "support@balticexpress.lt",
    phone: "+370 6789 0123",
    address: "Vilnius, Lithuania",
    contactPerson: "Ruta Kazlauskas",
    priority: "medium",
    isActive: true,
    createdDate: "2023-03-10",
    totalShipments: 156
  },
  {
    id: "4",
    name: "Cargo Masters International",
    code: "CARG004",
    email: "operations@cargomasters.com",
    phone: "+49 30 1234 5678",
    address: "Berlin, Germany",
    contactPerson: "Hans Mueller",
    priority: "medium",
    isActive: true,
    createdDate: "2023-04-05",
    totalShipments: 134
  },
  {
    id: "5",
    name: "General Mail Services",
    code: "GENM005",
    email: "service@generalmail.com",
    phone: "+33 1 2345 6789",
    address: "Paris, France",
    contactPerson: "Marie Dubois",
    priority: "low",
    isActive: false,
    createdDate: "2023-05-12",
    totalShipments: 78
  }
]

export function AssignCustomers({ data, savedPriorityConditions, onSavePriorityConditions }: AssignCustomersProps) {
  const [activeTab, setActiveTab] = useState<"customers" | "configure" | "execute">("customers")
  const [currentView, setCurrentView] = useState<"rules" | "results">("rules")
  const [rules, setRules] = useState<CustomerRule[]>(SAMPLE_RULES)
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState<CustomerRule | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  // Filter rules based on search
  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.actions.assignTo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const handleEditRule = (rule: CustomerRule) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
    } else {
      setExpandedRule(rule.id)
    }
  }

  const handleToggleCustomer = (customerId: string) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId ? { ...customer, isActive: !customer.isActive } : customer
    ))
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsCustomerEditorOpen(true)
  }

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== customerId))
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
    <div className="space-y-4 pt-2">
      {/* Configure/Execute Tabs - Always Visible */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setActiveTab("customers")
              setCurrentView("rules")
            }}
            className={
              activeTab === "customers"
                ? "bg-black text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            }
          >
            Configure Customers
          </Button>
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

      {/* Configure Customers Tab */}
      {activeTab === "customers" && (
        <>
          {/* Customer Management */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent>
            <div className="flex items-center justify-between pb-2">
                <CardTitle className="text-black flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Customer Management
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setIsCustomerEditorOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Customer
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1 text-xs">Status</TableHead>
                      <TableHead className="h-8 py-1 text-xs">Customer</TableHead>
                      <TableHead className="h-8 py-1 text-xs">Code</TableHead>
                      <TableHead className="h-8 py-1 text-xs">Shipments</TableHead>
                      <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="h-10">
                        <TableCell className="py-1 px-2">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={customer.isActive}
                              onCheckedChange={() => handleToggleCustomer(customer.id)}
                              className="scale-75"
                            />
                            <span className={cn(
                              "text-xs font-medium",
                              customer.isActive ? "text-green-600" : "text-gray-400"
                            )}>
                              {customer.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div>
                            <p className="font-medium text-black text-sm leading-tight">{customer.name}</p>
                            <p className="text-xs text-gray-500 leading-tight">{customer.address}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                            {customer.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <span className="font-medium text-sm">{customer.totalShipments}</span>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex gap-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditCustomer(customer)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No customers found matching your search criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Configure Rules Tab */}
      {activeTab === "configure" && (
        <>
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
        </CardHeader>

        <CardContent>
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

                  {/* Assignment Info */}
                  <div className="text-right">
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
                      {/* Conditions Section */}
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <Label className="text-xs font-medium text-gray-700">Where</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Select defaultValue={rule.conditions[0]?.field || "mail_category"}>
                              <SelectTrigger className="h-8 text-xs w-80">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mail_category">Mail Category</SelectItem>
                                <SelectItem value="route">Orig. OE</SelectItem>
                                <SelectItem value="weight">Weight (kg)</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="flight_number">Flight Number</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select defaultValue={rule.conditions[0]?.operator || "equals"}>
                              <SelectTrigger className="h-8 text-xs w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">is</SelectItem>
                                <SelectItem value="contains">contains</SelectItem>
                                <SelectItem value="greater_than">&gt;</SelectItem>
                                <SelectItem value="less_than">&lt;</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              defaultValue={rule.conditions[0]?.value || "C"}
                              className="h-8 text-xs w-48"
                              placeholder="Value"
                            />
                          </div>
                        </div>

                        <div className="w-64">
                          <Label className="text-xs font-medium text-gray-700">Customer</Label>
                          <Select defaultValue="">
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue placeholder="Select customer..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="premium-express">Premium Express Ltd</SelectItem>
                              <SelectItem value="nordic-post">Nordic Post AS</SelectItem>
                              <SelectItem value="baltic-express">Baltic Express Network</SelectItem>
                              <SelectItem value="cargo-masters">Cargo Masters International</SelectItem>
                              <SelectItem value="general-mail">General Mail Services</SelectItem>
                              <SelectItem value="euro-logistics">Euro Logistics GmbH</SelectItem>
                              <SelectItem value="air-freight">Air Freight Solutions</SelectItem>
                            </SelectContent>
                          </Select>
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

      {/* Customer Editor Modal */}
      <Dialog open={isCustomerEditorOpen} onOpenChange={setIsCustomerEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? `Edit Customer: ${selectedCustomer.name}` : "Create New Customer"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input 
                  id="customer-name"
                  placeholder="e.g., Premium Express Ltd"
                  defaultValue={selectedCustomer?.name}
                />
              </div>
              <div>
                <Label htmlFor="customer-code">Customer Code</Label>
                <Input 
                  id="customer-code"
                  placeholder="e.g., PREM001"
                  defaultValue={selectedCustomer?.code}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input 
                  id="customer-email"
                  type="email"
                  placeholder="contact@example.com"
                  defaultValue={selectedCustomer?.email}
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input 
                  id="customer-phone"
                  placeholder="+371 2345 6789"
                  defaultValue={selectedCustomer?.phone}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer-address">Address</Label>
              <Input 
                id="customer-address"
                placeholder="City, Country"
                defaultValue={selectedCustomer?.address}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-contact">Contact Person</Label>
                <Input 
                  id="customer-contact"
                  placeholder="John Doe"
                  defaultValue={selectedCustomer?.contactPerson}
                />
              </div>
              <div>
                <Label htmlFor="customer-priority">Priority Level</Label>
                <Select defaultValue={selectedCustomer?.priority || "medium"}>
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
            </div>

            {/* Customer Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="customer-active"
                defaultChecked={selectedCustomer?.isActive ?? true}
              />
              <Label htmlFor="customer-active">Active Customer</Label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCustomerEditorOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-black hover:bg-gray-800 text-white">
                {selectedCustomer ? "Update Customer" : "Create Customer"}
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
                <CardTitle className="text-black">Cargo Data Preview</CardTitle>
                <p className="text-sm text-gray-600">Preview of cargo data that will be processed by automation rules</p>
              </div>
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => setCurrentView("results")}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute All Rules
              </Button>
            </div>
            <div className="flex justify-end">
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Total Records: <strong className="text-black">1,000</strong></span>
                <span>Total Weight: <strong className="text-black">25,432.5 kg</strong></span>
                <span>Avg Weight: <strong className="text-black">25.4 kg</strong></span>
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
                    <th className="border border-gray-300 p-2 text-left text-black font-medium bg-yellow-200">Customer</th>
                    <th className="border border-gray-300 p-1 text-left text-black font-medium bg-yellow-200">Rate</th>
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
                    
                    const customers = [
                      "POST DANMARK A/S / QDKCPHA",
                      "DIRECT LINK WORLWIDE INC. / QDLW", 
                      "POSTNORD SVERIGE AB / QSTO",
                      "Premium Express Ltd",
                      "Nordic Post AS",
                      "Baltic Express Network",
                      "Cargo Masters International"
                    ]
                    
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
                        <td className="border border-gray-300 p-1 text-right text-gray-900">{(Math.random() * 50 + 0.1).toFixed(1)}</td>
                        <td className="border border-gray-300 p-1 text-gray-900">{invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)]}</td>
                        <td className="border border-gray-300 p-1 text-gray-900 text-xs bg-yellow-200">{customers[Math.floor(Math.random() * customers.length)]}</td>
                        <td className="border border-gray-300 p-1 text-gray-900 text-xs bg-yellow-200">{(Math.random() * 15 + 2.5).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-500">
                This data will be processed by the active automation rules to assign customers and rates
              </p>
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
          <div className="flex justify-start mb-4">
            <Button 
              variant="default"
              size="sm"
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
