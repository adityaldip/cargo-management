"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown, Edit, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomerWithCodes } from "./types"

interface CustomerTableProps {
  customers: CustomerWithCodes[]
  loading: boolean
  customerSearchTerm: string
  setCustomerSearchTerm: (term: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void
  customerCodeAssignmentEnabled: boolean
  setCustomerCodeAssignmentEnabled: (enabled: boolean) => void
  togglingCustomers: Set<string>
  onToggleCustomer: (customerId: string) => void
  onToggleCustomerCode: (customerId: string, codeId: string | number) => void
  onEditCustomer: (customer: CustomerWithCodes) => void
  onDeleteCustomer: (customerId: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function CustomerTable({
  customers,
  loading,
  customerSearchTerm,
  setCustomerSearchTerm,
  statusFilter,
  setStatusFilter,
  customerCodeAssignmentEnabled,
  setCustomerCodeAssignmentEnabled,
  togglingCustomers,
  onToggleCustomer,
  onToggleCustomerCode,
  onEditCustomer,
  onDeleteCustomer,
  onRefresh,
  isRefreshing
}: CustomerTableProps) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showAll, setShowAll] = useState(false)

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(customerSearchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [customerSearchTerm])

  // Memoized filtered customers for better performance
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer => {
        // Search filter
        const matchesSearch = customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          customer.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (customer.codes && customer.codes.some(code => 
            code.product && typeof code.product === 'string' && code.product.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          ))
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'active' && customer.is_active) ||
          (statusFilter === 'inactive' && !customer.is_active)
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name)
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [customers, debouncedSearchTerm, statusFilter, sortOrder])

  // Pagination logic with performance optimization
  const totalItems = filteredCustomers.length
  const displayItems = showAll ? filteredCustomers : filteredCustomers.slice(0, itemsPerPage)
  const hasMoreItems = filteredCustomers.length > itemsPerPage

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Search and Code Assignment Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search contractees by name, code, or product..."
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            className="w-full pr-8"
          />
          {customerSearchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={customerCodeAssignmentEnabled}
            onCheckedChange={setCustomerCodeAssignmentEnabled}
            className="scale-75"
          />
          <span className="text-sm text-gray-600">Allow Product Assignment</span>
        </div>
      </div>
      
      {/* Results Summary */}
      {filteredCustomers.length > 0 && (
        <div className="mb-3 text-sm text-gray-600">
          Showing {filteredCustomers.length} contractee{filteredCustomers.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' && ` (${statusFilter} only)`}
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
          {!customerCodeAssignmentEnabled && (
            <span className="ml-2 text-orange-600 font-medium">
              • Product Assignment Disabled
            </span>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="h-8 py-1 text-xs">Status</TableHead>
              <TableHead className="h-8 py-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSortToggle}
                  className="h-6 px-1 text-xs font-medium hover:bg-gray-100"
                >
                  Contractee
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="h-8 py-1 text-xs">Code</TableHead>
              <TableHead className="h-8 py-1 text-xs">Products</TableHead>
              <TableHead className="h-8 py-1 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((customer) => (
              <TableRow key={customer.id} className="">
                <TableCell className="py-1 px-1">
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <Switch
                        checked={customer.is_active}
                        onCheckedChange={() => onToggleCustomer(customer.id)}
                        disabled={togglingCustomers.has(customer.id)}
                        className="scale-75"
                      />
                      {togglingCustomers.has(customer.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      customer.is_active ? "text-green-600" : "text-gray-400"
                    )}>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div>
                    <p className="font-medium text-black text-sm leading-tight">{customer.name}</p>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <Badge variant="outline" className="font-mono text-xs px-1 py-0 h-5">
                    {customer.code}
                  </Badge>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="flex flex-wrap gap-1">
                    {/* Display products from customer_codes table */}
                    {customer.codes && customer.codes.length > 0 ? customer.codes.map((codeItem, index) => (
                      <div key={codeItem.id || index} className="flex items-center gap-1">
                        <Switch
                          checked={codeItem.is_active}
                          onCheckedChange={() => onToggleCustomerCode(customer.id, codeItem.id || index)}
                          disabled={!customerCodeAssignmentEnabled}
                          className="scale-50"
                        />
                        <Badge 
                          variant={codeItem.is_active ? "secondary" : "outline"} 
                          className={cn(
                            "text-xs px-1 py-0 h-5",
                            !codeItem.is_active && "opacity-50"
                          )}
                        >
                          {codeItem.product || 'No Product'}
                        </Badge>
                      </div>
                    )) : (
                      <span className="text-xs text-gray-400">No products</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2">
                  <div className="flex gap-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditCustomer(customer)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDeleteCustomer(customer.id)}
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

      {/* Performance Controls */}
      {filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setShowAll(false)
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {showAll ? `Showing all ${totalItems} entries` : `Showing ${displayItems.length} of ${totalItems} entries`}
            </span>
            
            {hasMoreItems && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
              >
                Show All
              </Button>
            )}
            
            {showAll && hasMoreItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            )}
          </div>
        </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No contractees found matching your search criteria</p>
        </div>
      )}
    </div>
  )
}
