"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Package, AlertTriangle, TrendingDown, LogOut, RefreshCw } from "lucide-react"
import { GlobalLoading } from "@/components/global-loading"
import { isProOrAbove } from "@/lib/subscription-access"
import { useAuth } from "@/hooks/use-auth"
import { AIHints } from "@/components/ai-hints"

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  costPerUnit: number
  supplier: string
  lastRestocked: string
  expiryDate?: string
}

interface Supplier {
  id: string
  name: string
  contact: string
  email: string
  rating: number
  deliveryTime: string
  items: string[]
}

const MOCK_INVENTORY: InventoryItem[] = []

const MOCK_SUPPLIERS: Supplier[] = []

export default function InventoryDashboard() {
  const { user, logout } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS)
  const [showRestockDialog, setShowRestockDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [restockQuantity, setRestockQuantity] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tier, setTier] = useState<'core'|'pro'|'enterprise'|'unknown'>('unknown')

  useEffect(() => {
    if (!user?.restaurantId) return
    fetchInventory()
    const interval = setInterval(fetchInventory, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId])

  useEffect(() => {
    (async () => {
      if (!user?.restaurantId) return
      try {
        const res = await fetch(`/api/restaurant/${user.restaurantId}/subscription`)
        if (res.ok) {
          const data = await res.json()
          const status = data.subscription?.status
          const tierResp = data.subscription?.tier
          setTier(((status === 'expired') ? 'core' : (tierResp || 'core')) as any)
        }
      } catch {}
    })()
  }, [user?.restaurantId])

  async function fetchInventory() {
    try {
      const res = await fetch(`/api/inventory?restaurantId=${user?.restaurantId}`)
      if (!res.ok) throw new Error("Failed to load inventory")
      const data = await res.json()
      setInventory(Array.isArray(data.inventory) ? data.inventory : [])
    } catch (e) {
      console.error(e)
      // Fallback to mock if needed
      if (inventory.length === 0) setInventory(MOCK_INVENTORY)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStock)
  const expiringItems = inventory.filter((item) => {
    if (!item.expiryDate) return false
    const expiryDate = new Date(item.expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysUntilExpiry <= 3
  })

  const totalValue = inventory.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)
  const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0)

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100
    if (percentage <= 25) return "critical"
    if (percentage <= 50) return "low"
    if (percentage <= 75) return "medium"
    return "good"
  }

  const getStockColor = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive"
      case "low":
        return "secondary"
      case "medium":
        return "outline"
      default:
        return "default"
    }
  }

  const handleRestock = (item: InventoryItem) => {
    setSelectedItem(item)
    setRestockQuantity(item.minStock - item.currentStock + 10) // Suggest restocking to above minimum
    setShowRestockDialog(true)
  }

  async function confirmRestock() {
    if (!selectedItem || !user?.restaurantId) return
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: restockQuantity,
          action: "add",
          restaurantId: user.restaurantId,
        }),
      })
      if (!res.ok) throw new Error("Failed to restock")
      const data = await res.json()
      const newStock = data.newStock as number | undefined

      setInventory((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                currentStock: typeof newStock === "number" ? newStock : item.currentStock + restockQuantity,
                lastRestocked: new Date().toISOString().split("T")[0],
              }
            : item,
        ),
      )
    } catch (e) {
      console.error(e)
    } finally {
      setShowRestockDialog(false)
      setSelectedItem(null)
      setRestockQuantity(0)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["inventory"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Inventory Dashboard</h1>
                <p className="text-muted-foreground mt-1">{user?.establishmentName || 'Establishment'} • {(user as any)?.establishmentType || 'Establishment'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setRefreshing(true); fetchInventory() }}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <div className="text-right">
                  <p className="text-sm font-medium">Welcome, {user?.name}</p>
                  <p className="text-xs text-muted-foreground">Inventory Staff</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => logout()}
                  disabled={loading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && <GlobalLoading label="Loading inventory..." />}
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">{inventory.length} different products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RWF {totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Current stock value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">Items need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{expiringItems.length}</div>
                <p className="text-xs text-muted-foreground">Items expire in 3 days</p>
              </CardContent>
            </Card>

            {isProOrAbove(tier as any) ? (
              <AIHints 
                userRole="inventory" 
                subscriptionTier={tier} 
                data={{ inventory, suppliers }}
                className="col-span-1"
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upgrade for Analytics</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Pro unlocks advanced inventory analytics</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Alerts */}
          {(lowStockItems.length > 0 || expiringItems.length > 0) && (
            <div className="mb-8 space-y-4">
              {lowStockItems.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-red-800 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Low Stock Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lowStockItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.currentStock} {item.unit} remaining
                            </p>
                          </div>
                          <Button size="sm" onClick={() => handleRestock(item)}>
                            Restock
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {expiringItems.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-800 flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2" />
                      Expiring Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {expiringItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Expires: {item.expiryDate}</p>
                          </div>
                          <Badge variant="destructive">Urgent</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Inventory Tab Content */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Current Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventory.map((item) => {
                      const stockLevel = getStockLevel(item)
                      return (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{item.name}</h3>
                              <Badge variant={getStockColor(stockLevel)}>
                                {item.currentStock} {item.unit}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                Category: {item.category} | Supplier: {item.supplier}
                              </p>
                              <p>
                                Cost: RWF {item.costPerUnit.toLocaleString()}/{item.unit}
                              </p>
                              <p>Last restocked: {item.lastRestocked}</p>
                              {item.expiryDate && <p>Expires: {item.expiryDate}</p>}
                            </div>
                          </div>
                          <div className="ml-4 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleRestock(item)}>
                              Restock
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suppliers Tab Content */}
            <TabsContent value="suppliers">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Directory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium">{supplier.name}</h3>
                          <Badge variant="outline">★ {supplier.rating}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Contact: {supplier.contact}</p>
                          <p>Email: {supplier.email}</p>
                          <p>Delivery: {supplier.deliveryTime}</p>
                          <p>Items: {supplier.items.join(", ")}</p>
                        </div>
                        <Button className="w-full mt-3 bg-transparent" variant="outline">
                          Contact Supplier
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab Content */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Stock Movement</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Items restocked this week:</span>
                          <span className="font-medium">12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Items consumed this week:</span>
                          <span className="font-medium">45</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Waste/expired items:</span>
                          <span className="font-medium text-red-600">3</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Cost Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Weekly inventory cost:</span>
                          <span className="font-medium">RWF 245,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly average:</span>
                          <span className="font-medium">RWF 980,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost per serving:</span>
                          <span className="font-medium">RWF 1,200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Restock Dialog */}
          {showRestockDialog && selectedItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle>Restock {selectedItem.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Minimum Stock: {selectedItem.minStock} {selectedItem.unit}
                    </p>
                    <label className="block text-sm font-medium mb-2">Restock Quantity</label>
                    <input
                      type="number"
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(Number(e.target.value))}
                      className="w-full p-2 border rounded"
                      min="1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={confirmRestock} className="flex-1">
                      Confirm Restock
                    </Button>
                    <Button variant="outline" onClick={() => setShowRestockDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
