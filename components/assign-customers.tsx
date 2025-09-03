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
import { CARGO_CODES } from "@/lib/cargo-codes"
import { SAMPLE_CUSTOMER_RULES, type CustomerRule } from "@/lib/sample-rules"
import type { ProcessedData } from "@/types/cargo-data"

interface AssignCustomersProps {
  data: ProcessedData | null
  savedPriorityConditions?: any[]
  onSavePriorityConditions?: (conditions: any[]) => void
}



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
  const [rules, setRules] = useState<CustomerRule[]>(SAMPLE_CUSTOMER_RULES)
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedRule, setSelectedRule] = useState<CustomerRule | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false)
  const [isCustomerEditorOpen, setIsCustomerEditorOpen] = useState(false)
  const [draggedRule, setDraggedRule] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("OR")
  const [filterConditions, setFilterConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([{ field: "orig_oe", operator: "equals", value: "" }])
  
  // State for expanded rule editing
  const [editingRuleConditions, setEditingRuleConditions] = useState<{
    field: string
    operator: string
    value: string
  }[]>([])
  const [editingRuleLogic, setEditingRuleLogic] = useState<"AND" | "OR">("AND")

  // Filter rules based on search and conditions
  const filteredRules = rules.filter(rule => {
    // First apply search filter
    const matchesSearch = !searchTerm || (
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.actions.assignTo.toLowerCase().includes(searchTerm.toLowerCase())
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
      setEditingRuleConditions([])
    } else {
      setExpandedRule(rule.id)
      // Initialize editing state with current rule conditions
      const initialConditions = rule.conditions.map(cond => ({
        field: cond.field,
        operator: cond.operator,
        value: cond.value
      }))
      setEditingRuleConditions(initialConditions.length > 0 ? initialConditions : [{ field: "orig_oe", operator: "equals", value: "" }])
      setEditingRuleLogic("AND")
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


  const clearFilters = () => {
    setFilterConditions([{ field: "orig_oe", operator: "equals", value: "" }])
    setFilterLogic("OR")
    setShowFilters(false)
  }

  // Get unique values for each field type from sample rules
  const getFieldValues = (fieldType: string) => {
    // Since we're using rule.where directly, we need to get all values from all rules
    const allValues = SAMPLE_CUSTOMER_RULES.flatMap(rule => 
      rule.conditions.map(cond => cond.value)
    )
        
    return [...new Set(allValues)]
  }

  // Get unique where options from sample rules
  const getWhereOptions = () => {
    const allWhereOptions = SAMPLE_CUSTOMER_RULES.flatMap(rule => rule.where)
    const uniqueOptions = [...new Set(allWhereOptions)].sort()
    
    return uniqueOptions.map(option => ({
      label: option,
      value: option.toLowerCase().replace(/\s+/g, '_').replace(/\./g, '')
    }))
  }

  // Helper functions for editing rule conditions
  const addEditingRuleCondition = () => {
    // Use the first available field option from the current rule's where array
    const firstField = getWhereOptions()[0]?.value || "orig_oe"
    setEditingRuleConditions(prev => [...prev, { field: firstField, operator: "equals", value: "" }])
  }

  const removeEditingRuleCondition = (index: number) => {
    setEditingRuleConditions(prev => prev.filter((_, i) => i !== index))
  }

  const updateEditingRuleCondition = (index: number, updates: Partial<typeof editingRuleConditions[0]>) => {
    setEditingRuleConditions(prev => prev.map((cond, i) => i === index ? { ...cond, ...updates } : cond))
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
          <div className="max-w-3xl mx-auto">
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
                        <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className=" ">
                          <TableCell className="py-1 px-1">
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
                                    // When field changes, clear the value since it may not be valid for the new field
                                    updateEditingRuleCondition(index, { field: value, value: "" })
                                  }}
                                >
                                  <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500">
                                    <SelectValue/>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rule.where.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
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
                                </SelectContent>
                              </Select>

                                <Select 
                                  value={condition.value}
                                  onValueChange={(value) => updateEditingRuleCondition(index, { value })}
                                >
                                  <SelectTrigger className="h-8 min-w-32 max-w-64 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1">
                                    <SelectValue/>
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {(() => {
                                      const values = getFieldValues(condition.field)
                                      console.log(`Rendering values for field ${condition.field}:`, values)
                                      return values.map((value) => (
                                        <SelectItem key={value} value={value}>
                                          {value}
                                        </SelectItem>
                                      ))
                                    })()}
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

                            {/* Customer Assignment Row */}
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 group border-t border-gray-100 mt-4 pt-4">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium text-gray-700 min-w-12">Customer</span>
                                <Select defaultValue={rule.actions.assignTo}>
                                  <SelectTrigger className="h-8 text-xs border-gray-200 hover:border-gray-300 focus:border-blue-500 flex-1 min-w-32 max-w-64">
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
                              Add filter rule
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
                <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No rules found matching your search criteria</p>
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
                      <TableHead className="border bg-yellow-200">Customer</TableHead>
                      <TableHead className="border bg-yellow-200">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                          <TableCell className="border text-xs bg-yellow-200">{customers[Math.floor(Math.random() * customers.length)]}</TableCell>
                          <TableCell className="border text-xs bg-yellow-200">{(Math.random() * 15 + 2.5).toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
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
