"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus, Edit, Trash2, Save, Route, Users, MapPin } from "lucide-react"
import type { RateSettings, RateRule } from "@/types/rate-settings"

interface SettingsModalProps {
  settings: RateSettings
  onSettingsChange: (settings: RateSettings) => void
  isOpen?: boolean
  onClose?: () => void
}

export function SettingsModal({ settings, onSettingsChange, isOpen: externalIsOpen, onClose }: SettingsModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = onClose
    ? (open: boolean) => {
        if (!open) onClose()
      }
    : setInternalIsOpen

  const [editingRule, setEditingRule] = useState<RateRule | null>(null)
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [activeTab, setActiveTab] = useState<"manual" | "routes" | "customers" | "general">("manual")

  const handleGeneralSettingsChange = (key: keyof RateSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  const handleRuleChange = (ruleId: string, updates: Partial<RateRule>) => {
    const updatedRules = settings.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule))
    onSettingsChange({
      ...settings,
      rules: updatedRules,
    })
  }

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = settings.rules.filter((rule) => rule.id !== ruleId)
    onSettingsChange({
      ...settings,
      rules: updatedRules,
    })
  }

  const handleCreateRule = (newRule: Omit<RateRule, "id">) => {
    const rule: RateRule = {
      ...newRule,
      id: `rule-${Date.now()}`,
    }
    onSettingsChange({
      ...settings,
      rules: [...settings.rules, rule],
    })
    setIsCreatingRule(false)
  }

  const getRouteRules = () => {
    return settings.rules.filter((rule) => rule.route && rule.route.trim() !== "")
  }

  const getCustomerRules = () => {
    return settings.rules.filter((rule) => rule.customer && rule.customer.trim() !== "")
  }

  const getUniqueRoutes = () => {
    const routes = new Set(settings.rules.map((rule) => rule.route).filter(Boolean))
    return Array.from(routes)
  }

  const getUniqueCustomers = () => {
    const customers = new Set(settings.rules.map((rule) => rule.customer).filter(Boolean))
    return Array.from(customers)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {externalIsOpen === undefined && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10 bg-transparent"
          >
            <Settings className="h-4 w-4 mr-2" />
            Rate Settings
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black border-orange-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-orange-500 text-xl">Mail Route & Rate Management</DialogTitle>
          <p className="text-gray-400">Configure rates for different routes, customers, and mail categories</p>
        </DialogHeader>

        <div className="flex space-x-1 mb-6 bg-black border border-orange-500/20 rounded-lg p-1">
          <Button
            variant={activeTab === "manual" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("manual")}
            className={
              activeTab === "manual"
                ? "bg-orange-500 hover:bg-orange-600 text-black"
                : "text-orange-300 hover:text-orange-500 hover:bg-orange-500/10"
            }
          >
            <MapPin className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
          <Button
            variant={activeTab === "routes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("routes")}
            className={
              activeTab === "routes"
                ? "bg-orange-500 hover:bg-orange-600 text-black"
                : "text-orange-300 hover:text-orange-500 hover:bg-orange-500/10"
            }
          >
            <Route className="h-4 w-4 mr-2" />
            Routes & Rates
          </Button>
          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("customers")}
            className={
              activeTab === "customers"
                ? "bg-orange-500 hover:bg-orange-600 text-black"
                : "text-orange-300 hover:text-orange-500 hover:bg-orange-500/10"
            }
          >
            <Users className="h-4 w-4 mr-2" />
            Customer Rates
          </Button>
          <Button
            variant={activeTab === "general" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("general")}
            className={
              activeTab === "general"
                ? "bg-orange-500 hover:bg-orange-600 text-black"
                : "text-orange-300 hover:text-orange-500 hover:bg-orange-500/10"
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            General Settings
          </Button>
        </div>

        <div className="space-y-6">
          {activeTab === "manual" && (
            <div className="space-y-6">
              <Card className="bg-black border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-orange-500 text-lg">Manual Route & Rate Entry</CardTitle>
                  <p className="text-gray-400 text-sm">Add routes and rates before uploading any files</p>
                </CardHeader>
                <CardContent>
                  <ManualRouteEntry onAddRule={handleCreateRule} />
                </CardContent>
              </Card>

              {settings.rules.length > 0 && (
                <Card className="bg-black border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-500 text-lg">
                      Configured Routes ({settings.rules.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {settings.rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-3 bg-gray-900/50 rounded border border-orange-500/10 hover:border-orange-500/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white text-sm">{rule.name}</span>
                            <div className="flex items-center gap-1">
                              {!rule.active && (
                                <Badge variant="secondary" className="bg-gray-700 text-xs">
                                  Inactive
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRule(rule)}
                                className="text-gray-400 hover:text-orange-500 h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 space-y-1">
                            {rule.route && (
                              <div className="text-orange-300">Route: {rule.route.replace("-", " → ")}</div>
                            )}
                            {rule.customer && <div>Customer: {rule.customer}</div>}
                            <div className="font-medium text-orange-300">
                              {rule.ratePerKg} {rule.currency}/kg
                            </div>
                            <div>
                              Min: {rule.minimumCharge} {rule.currency}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ... existing code for other tabs ... */}

          {activeTab === "routes" && (
            <div className="space-y-6">
              <Card className="bg-black border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-orange-500 text-lg">Route-Based Rates</CardTitle>
                    <p className="text-gray-400 text-sm">Configure rates for specific mail routes</p>
                  </div>
                  <Button
                    onClick={() => setIsCreatingRule(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-black"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Route Rate
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {getUniqueRoutes().map((route) => {
                      const routeRules = settings.rules.filter((rule) => rule.route === route)
                      return (
                        <Card key={route} className="bg-black border-orange-500/10">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-orange-400 text-base flex items-center gap-2">
                              <Route className="h-4 w-4" />
                              {route?.replace("-", " → ")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {routeRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-orange-500/10"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">{rule.name}</span>
                                    {!rule.active && (
                                      <Badge variant="secondary" className="bg-gray-700 text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 space-y-1">
                                    {rule.customer && <div>Customer: {rule.customer}</div>}
                                    {rule.mailCategory && <div>Category: {rule.mailCategory}</div>}
                                    {rule.euromail && <div>Type: {rule.euromail}</div>}
                                    <div className="text-orange-300">
                                      {rule.ratePerKg} {rule.currency}/kg (min: {rule.minimumCharge} {rule.currency})
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={rule.active}
                                    onCheckedChange={(checked) => handleRuleChange(rule.id, { active: checked })}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingRule(rule)}
                                    className="text-gray-400 hover:text-orange-500 h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-6">
              <Card className="bg-black border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-orange-500 text-lg">Customer-Specific Rates</CardTitle>
                    <p className="text-gray-400 text-sm">Configure special rates for specific customers</p>
                  </div>
                  <Button
                    onClick={() => setIsCreatingRule(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-black"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer Rate
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {getUniqueCustomers().map((customer) => {
                      const customerRules = settings.rules.filter((rule) => rule.customer === customer)
                      return (
                        <Card key={customer} className="bg-black border-orange-500/10">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-orange-400 text-base flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {customer}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {customerRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-orange-500/10"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">{rule.name}</span>
                                    {!rule.active && (
                                      <Badge variant="secondary" className="bg-gray-700 text-xs">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 space-y-1">
                                    {rule.route && <div>Route: {rule.route.replace("-", " → ")}</div>}
                                    {rule.mailCategory && <div>Category: {rule.mailCategory}</div>}
                                    {rule.euromail && <div>Type: {rule.euromail}</div>}
                                    <div className="text-orange-300">
                                      {rule.ratePerKg} {rule.currency}/kg (min: {rule.minimumCharge} {rule.currency})
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={rule.active}
                                    onCheckedChange={(checked) => handleRuleChange(rule.id, { active: checked })}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingRule(rule)}
                                    className="text-gray-400 hover:text-orange-500 h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* General Settings Tab */}
          {activeTab === "general" && (
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-500 text-lg">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-orange-300">Default Currency</Label>
                    <Select
                      value={settings.defaultCurrency}
                      onValueChange={(value) => handleGeneralSettingsChange("defaultCurrency", value)}
                    >
                      <SelectTrigger className="bg-black border-orange-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-orange-500/30">
                        <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                          Any
                        </SelectItem>
                        <SelectItem value="EUR" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                          EUR
                        </SelectItem>
                        <SelectItem value="USD" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                          USD
                        </SelectItem>
                        <SelectItem value="GBP" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                          GBP
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-orange-300">VAT Rate (%)</Label>
                    <Input
                      type="number"
                      value={settings.vatRate}
                      onChange={(e) => handleGeneralSettingsChange("vatRate", Number.parseFloat(e.target.value))}
                      className="bg-black border-orange-500/30 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-orange-300">Apply VAT to Calculations</Label>
                  <Switch
                    checked={settings.applyVAT}
                    onCheckedChange={(checked) => handleGeneralSettingsChange("applyVAT", checked)}
                  />
                </div>

                <div>
                  <Label className="text-orange-300">Rounding Precision (decimal places)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    value={settings.roundingPrecision}
                    onChange={(e) => handleGeneralSettingsChange("roundingPrecision", Number.parseInt(e.target.value))}
                    className="bg-black border-orange-500/30 text-white w-32"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rule Creation/Edit Modal */}
        {(isCreatingRule || editingRule) && (
          <RuleEditor
            rule={editingRule}
            onSave={(rule) => {
              if (editingRule) {
                handleRuleChange(editingRule.id, rule)
                setEditingRule(null)
              } else {
                handleCreateRule(rule)
              }
            }}
            onCancel={() => {
              setIsCreatingRule(false)
              setEditingRule(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ... existing code for ManualRouteEntry and RuleEditor components ...

interface ManualRouteEntryProps {
  onAddRule: (rule: Omit<RateRule, "id">) => void
}

function ManualRouteEntry({ onAddRule }: ManualRouteEntryProps) {
  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    destination: "",
    customer: "",
    mailCategory: "",
    mailClass: "",
    euromail: "" as "EU" | "NONEU" | "",
    ratePerKg: "",
    minimumCharge: "",
    currency: "EUR",
    conditions: "",
    validFrom: new Date().toISOString().split("T")[0],
    validTo: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const route = formData.origin && formData.destination ? `${formData.origin}-${formData.destination}` : ""

    const rule: Omit<RateRule, "id"> = {
      name: formData.name || `${formData.origin} → ${formData.destination}`,
      route,
      customer: formData.customer || undefined,
      mailCategory: formData.mailCategory || undefined,
      mailClass: formData.mailClass || undefined,
      euromail: formData.euromail || undefined,
      ratePerKg: Number.parseFloat(formData.ratePerKg),
      minimumCharge: Number.parseFloat(formData.minimumCharge),
      currency: formData.currency,
      validFrom: formData.validFrom,
      validTo: formData.validTo || undefined,
      active: true,
    }

    onAddRule(rule)

    // Reset form
    setFormData({
      name: "",
      origin: "",
      destination: "",
      customer: "",
      mailCategory: "",
      mailClass: "",
      euromail: "",
      ratePerKg: "",
      minimumCharge: "",
      currency: "EUR",
      conditions: "",
      validFrom: new Date().toISOString().split("T")[0],
      validTo: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-orange-300">Rule Name (optional)</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Auto-generated from origin → destination"
            className="bg-black border-orange-500/30 text-white"
          />
        </div>
        <div>
          <Label className="text-orange-300">Customer (optional)</Label>
          <Input
            value={formData.customer}
            onChange={(e) => setFormData((prev) => ({ ...prev, customer: e.target.value }))}
            placeholder="e.g., LV Post"
            className="bg-black border-orange-500/30 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-orange-300">Origin *</Label>
          <Input
            value={formData.origin}
            onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value.toUpperCase() }))}
            placeholder="e.g., USFRAT"
            className="bg-black border-orange-500/30 text-white"
            required
          />
        </div>
        <div>
          <Label className="text-orange-300">Destination *</Label>
          <Input
            value={formData.destination}
            onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value.toUpperCase() }))}
            placeholder="e.g., USRIXT"
            className="bg-black border-orange-500/30 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-orange-300">Mail Category</Label>
          <Select
            value={formData.mailCategory}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, mailCategory: value }))}
          >
            <SelectTrigger className="bg-black border-orange-500/30 text-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-black border-orange-500/30">
              <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                Any
              </SelectItem>
              <SelectItem value="A" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                A
              </SelectItem>
              <SelectItem value="B" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                B
              </SelectItem>
              <SelectItem value="C" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                C
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-orange-300">Mail Class</Label>
          <Input
            value={formData.mailClass}
            onChange={(e) => setFormData((prev) => ({ ...prev, mailClass: e.target.value }))}
            placeholder="e.g., 7C"
            className="bg-black border-orange-500/30 text-white"
          />
        </div>

        <div>
          <Label className="text-orange-300">EU/Non-EU</Label>
          <Select
            value={formData.euromail}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, euromail: value as "EU" | "NONEU" | "" }))}
          >
            <SelectTrigger className="bg-black border-orange-500/30 text-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-black border-orange-500/30">
              <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                Any
              </SelectItem>
              <SelectItem value="EU" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                EU
              </SelectItem>
              <SelectItem value="NONEU" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                Non-EU
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-orange-300">Rate per KG *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.ratePerKg}
            onChange={(e) => setFormData((prev) => ({ ...prev, ratePerKg: e.target.value }))}
            placeholder="0.00"
            className="bg-black border-orange-500/30 text-white"
            required
          />
        </div>

        <div>
          <Label className="text-orange-300">Minimum Charge *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.minimumCharge}
            onChange={(e) => setFormData((prev) => ({ ...prev, minimumCharge: e.target.value }))}
            placeholder="0.00"
            className="bg-black border-orange-500/30 text-white"
            required
          />
        </div>

        <div>
          <Label className="text-orange-300">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
          >
            <SelectTrigger className="bg-black border-orange-500/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-orange-500/30">
              <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                Any
              </SelectItem>
              <SelectItem value="EUR" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                EUR
              </SelectItem>
              <SelectItem value="USD" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                USD
              </SelectItem>
              <SelectItem value="GBP" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                GBP
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-orange-300">Valid From</Label>
          <Input
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
            className="bg-black border-orange-500/30 text-white"
          />
        </div>

        <div>
          <Label className="text-orange-300">Valid To (optional)</Label>
          <Input
            type="date"
            value={formData.validTo}
            onChange={(e) => setFormData((prev) => ({ ...prev, validTo: e.target.value }))}
            className="bg-black border-orange-500/30 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-orange-300">Additional Conditions (optional)</Label>
        <Input
          value={formData.conditions}
          onChange={(e) => setFormData((prev) => ({ ...prev, conditions: e.target.value }))}
          placeholder="e.g., Minimum weight 5kg, Express service only"
          className="bg-black border-orange-500/30 text-white"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black">
          <Plus className="h-4 w-4 mr-2" />
          Add Route & Rate
        </Button>
      </div>
    </form>
  )
}

interface RuleEditorProps {
  rule?: RateRule | null
  onSave: (rule: Omit<RateRule, "id">) => void
  onCancel: () => void
}

function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [formData, setFormData] = useState<Omit<RateRule, "id">>({
    name: rule?.name || "",
    route: rule?.route || "",
    customer: rule?.customer || "",
    mailCategory: rule?.mailCategory || "",
    mailClass: rule?.mailClass || "",
    euromail: rule?.euromail,
    ratePerKg: rule?.ratePerKg || 0,
    minimumCharge: rule?.minimumCharge || 0,
    currency: rule?.currency || "EUR",
    validFrom: rule?.validFrom || new Date().toISOString().split("T")[0],
    validTo: rule?.validTo || "",
    active: rule?.active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black border border-orange-500/20 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-orange-500 mb-4">{rule ? "Edit Rate Rule" : "Create Rate Rule"}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-orange-300">Rule Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-black border-orange-500/30 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-orange-300">Route (optional)</Label>
              <Input
                value={formData.route}
                onChange={(e) => setFormData((prev) => ({ ...prev, route: e.target.value }))}
                placeholder="e.g., USFRAT-USRIXT"
                className="bg-black border-orange-500/30 text-white"
              />
            </div>

            <div>
              <Label className="text-orange-300">Customer (optional)</Label>
              <Input
                value={formData.customer}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer: e.target.value }))}
                className="bg-black border-orange-500/30 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-orange-300">Mail Category</Label>
              <Select
                value={formData.mailCategory}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, mailCategory: value }))}
              >
                <SelectTrigger className="bg-black border-orange-500/30 text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-black border-orange-500/30">
                  <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    Any
                  </SelectItem>
                  <SelectItem value="A" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    A
                  </SelectItem>
                  <SelectItem value="B" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    B
                  </SelectItem>
                  <SelectItem value="C" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    C
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-orange-300">Mail Class</Label>
              <Input
                value={formData.mailClass}
                onChange={(e) => setFormData((prev) => ({ ...prev, mailClass: e.target.value }))}
                placeholder="e.g., 7C"
                className="bg-black border-orange-500/30 text-white"
              />
            </div>

            <div>
              <Label className="text-orange-300">EU/Non-EU</Label>
              <Select
                value={formData.euromail || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, euromail: value as "EU" | "NONEU" | undefined }))
                }
              >
                <SelectTrigger className="bg-black border-orange-500/30 text-white">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-black border-orange-500/30">
                  <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    Any
                  </SelectItem>
                  <SelectItem value="EU" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    EU
                  </SelectItem>
                  <SelectItem value="NONEU" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    Non-EU
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-orange-300">Rate per KG</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.ratePerKg}
                onChange={(e) => setFormData((prev) => ({ ...prev, ratePerKg: Number.parseFloat(e.target.value) }))}
                className="bg-black border-orange-500/30 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-orange-300">Minimum Charge</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.minimumCharge}
                onChange={(e) => setFormData((prev) => ({ ...prev, minimumCharge: Number.parseFloat(e.target.value) }))}
                className="bg-black border-orange-500/30 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-orange-300">Currency</Label>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
              >
                <SelectTrigger className="bg-black border-orange-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-orange-500/30">
                  <SelectItem value="any" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    Any
                  </SelectItem>
                  <SelectItem value="EUR" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    EUR
                  </SelectItem>
                  <SelectItem value="USD" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    USD
                  </SelectItem>
                  <SelectItem value="GBP" className="text-white hover:bg-orange-500/20 focus:bg-orange-500/20">
                    GBP
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-orange-300">Valid From</Label>
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
                className="bg-black border-orange-500/30 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-orange-300">Valid To (optional)</Label>
              <Input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData((prev) => ({ ...prev, validTo: e.target.value }))}
                className="bg-black border-orange-500/30 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
              />
              <Label className="text-orange-300">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-orange-500/50 text-orange-300 bg-transparent hover:bg-orange-500/10"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black">
                <Save className="h-4 w-4 mr-2" />
                Save Rule
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
