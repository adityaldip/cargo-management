"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Settings, Plus, Edit, Trash2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomers, useCustomerRules } from "@/hooks/use-supabase"
import { Database } from "@/types/database"

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerRule = Database['public']['Tables']['customer_rules']['Row']

interface AssignCustomersSupabaseProps {
  data: any | null
}

export function AssignCustomersSupabase({ data }: AssignCustomersSupabaseProps) {
  const [activeTab, setActiveTab] = useState<"customers" | "configure" | "execute">("customers")
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  
  // Use Supabase hooks for data management
  const {
    customers,
    loading: customersLoading,
    error: customersError,
    toggleCustomerActive,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers()

  const {
    rules,
    loading: rulesLoading,
    error: rulesError,
    toggleRuleActive,
    createRule,
    updateRule,
    deleteRule,
    updateRulePriority,
  } = useCustomerRules()

  const handleToggleCustomer = async (customerId: string, isActive: boolean) => {
    const result = await toggleCustomerActive(customerId, isActive)
    if (result.error) {
      console.error('Failed to toggle customer:', result.error)
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    const result = await toggleRuleActive(ruleId, isActive)
    if (result.error) {
      console.error('Failed to toggle rule:', result.error)
    }
  }

  const handleEditRule = (rule: CustomerRule) => {
    if (expandedRule === rule.id) {
      setExpandedRule(null)
    } else {
      setExpandedRule(rule.id)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      const result = await deleteCustomer(customerId)
      if (result.error) {
        console.error('Failed to delete customer:', result.error)
      }
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      const result = await deleteRule(ruleId)
      if (result.error) {
        console.error('Failed to delete rule:', result.error)
      }
    }
  }

  // Show loading state
  if (customersLoading || rulesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (customersError || rulesError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data:</p>
          <p className="text-sm text-gray-600">{customersError || rulesError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Tabs */}
      <div className="flex justify-start">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("customers")}
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
            onClick={() => setActiveTab("configure")}
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
            onClick={() => setActiveTab("execute")}
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

      {/* Configure Customers Tab */}
      {activeTab === "customers" && (
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent>
              <div className="flex items-center justify-between pb-2">
                <CardTitle className="text-black flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Customer Management
                  <Badge variant="outline" className="ml-2">
                    {customers?.length || 0} customers
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Handle new customer creation
                      console.log("Create new customer")
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
                      <TableHead className="h-8 py-1 text-xs">Priority</TableHead>
                      <TableHead className="h-8 py-1 text-xs">Shipments</TableHead>
                      <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="py-1 px-1">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={customer.is_active}
                              onCheckedChange={(checked) => handleToggleCustomer(customer.id, checked)}
                              className="scale-75"
                            />
                            <span className={cn(
                              "text-xs font-medium",
                              customer.is_active ? "text-green-600" : "text-gray-400"
                            )}>
                              {customer.is_active ? "Active" : "Inactive"}
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
                          <Badge 
                            variant={customer.priority === 'high' ? 'default' : 'outline'}
                            className={cn(
                              "text-xs px-1 py-0 h-5",
                              customer.priority === 'high' && "bg-red-100 text-red-800",
                              customer.priority === 'medium' && "bg-yellow-100 text-yellow-800",
                              customer.priority === 'low' && "bg-gray-100 text-gray-800"
                            )}
                          >
                            {customer.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <span className="text-sm font-medium">{customer.total_shipments}</span>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex gap-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => console.log('Edit customer:', customer.id)}
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

              {!customers?.length && (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No customers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configure Rules Tab */}
      {activeTab === "configure" && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-black flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Rules
                <Badge variant="outline" className="ml-2">
                  {rules?.length || 0} rules
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => console.log("Create new rule")}
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
              {rules?.map((rule) => (
                <div key={rule.id} className="border rounded-lg">
                  <div
                    className={cn(
                      "flex items-center gap-4 p-3 transition-all cursor-pointer hover:bg-gray-50",
                      rule.is_active ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50",
                      expandedRule === rule.id && "bg-gray-50"
                    )}
                    onClick={() => handleEditRule(rule)}
                  >
                    {/* Priority Badge */}
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                      {rule.priority}
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="scale-75"
                      />
                    </div>
                    
                    {/* Rule Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-black text-sm">{rule.name}</h3>
                      <p className="text-xs text-gray-500">{rule.description}</p>
                    </div>

                    {/* Match Count */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-black">{rule.match_count} matches</p>
                      {rule.last_run && (
                        <p className="text-xs text-gray-400">
                          Last run: {new Date(rule.last_run).toLocaleDateString()}
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
                          handleDeleteRule(rule.id)
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Edit Section - Simplified for example */}
                  {expandedRule === rule.id && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Rule editing interface would go here...
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setExpandedRule(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-black hover:bg-gray-800 text-white"
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

            {!rules?.length && (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No rules configured</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execute Rules Tab */}
      {activeTab === "execute" && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Execute Rules</CardTitle>
            <p className="text-sm text-gray-600">
              Process cargo data with the configured automation rules
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Play className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Rule execution interface would go here...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
