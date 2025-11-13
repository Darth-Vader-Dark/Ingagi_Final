"use client"

import { useEffect, useState } from "react"
import { GlobalLoading } from "@/components/global-loading"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ChefHat, Clock, AlertTriangle, CheckCircle, Flame, LogOut, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { isProOrAbove } from "@/lib/subscription-access"
import { AIHints } from "@/components/ai-hints"

type ItemStatus = "pending" | "preparing" | "ready"

interface KitchenItem {
  _id?: string
  name: string
  quantity: number
  notes?: string
  category?: string
  preparationTime?: number
  status?: ItemStatus
}

interface KitchenOrder {
  _id: string
  restaurantId: string
  customerName?: string
  tableNumber?: string
  items: KitchenItem[]
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  priority?: "normal" | "high" | "urgent"
  orderTime?: string
}

export default function KitchenDashboard() {
  const { user, logout } = useAuth()

  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tier, setTier] = useState<'core'|'pro'|'enterprise'|'unknown'>('unknown')

  useEffect(() => {
    if (!user?.restaurantId) return
    fetchOrders()
    ;(async () => {
      try {
        const res = await fetch(`/api/restaurant/${user?.restaurantId}/subscription`)
        if (res.ok) {
          const data = await res.json()
          setTier((data.subscription?.tier || 'core') as any)
        }
      } catch {}
    })()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [user?.restaurantId])

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/restaurant/${user?.restaurantId}/orders`)
      if (!res.ok) throw new Error("Failed to load orders")
      const data = await res.json()
      const normalized: KitchenOrder[] = (data.orders || [])
        .filter((o: any) => o.restaurantId === user?.restaurantId)
        .map((o: any) => ({
        ...o,
        items: (o.items || []).map((it: any) => ({
          ...it,
          status: (it.status as ItemStatus) || "pending",
        })),
      }))
      setOrders(normalized)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function updateOrderStatus(orderId: string, status: KitchenOrder["status"]) {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)))
    } catch (e) {
      console.error(e)
    }
  }

  function updateItemStatus(orderId: string, itemIndex: number, status: ItemStatus) {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              items: o.items.map((it, idx) => (idx === itemIndex ? { ...it, status } : it)),
            }
          : o,
      ),
    )
  }

  const totalActiveOrders = orders.length
  const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)
  const readyItems = orders.reduce((sum, o) => sum + o.items.filter((i) => i.status === "ready").length, 0)
  const urgentOrders = orders.filter((o) => o.priority === "urgent").length

  if (loading) {
    return <GlobalLoading />
  }

  return (
    <ProtectedRoute allowedRoles={["kitchen"]}>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Kitchen Dashboard</h1>
                <p className="text-muted-foreground mt-1">{user?.establishmentName || 'Establishment'} • {(user as any)?.establishmentType || 'Establishment'}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); fetchOrders() }} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActiveOrders}</div>
                <p className="text-xs text-muted-foreground">{totalItems} total items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready to Serve</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readyItems}</div>
                <p className="text-xs text-muted-foreground">Items completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Current average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{urgentOrders}</div>
                <p className="text-xs text-muted-foreground">High priority</p>
              </CardContent>
            </Card>

            {isProOrAbove(tier as any) ? (
              <AIHints 
                userRole="kitchen" 
                subscriptionTier={tier} 
                data={{ orders, restaurant }}
                className="col-span-1"
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upgrade for Analytics</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Pro unlocks advanced kitchen analytics</div>
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Active Orders</TabsTrigger>
              <TabsTrigger value="prep">Prep Station</TabsTrigger>
              <TabsTrigger value="menu" disabled>Menu Status</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                    <p className="text-muted-foreground">All caught up! No orders awaiting preparation.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => {
                    const readyCount = order.items.filter((i) => i.status === "ready").length
                    return (
                      <Card key={order._id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Order {order._id.slice(-6)}</CardTitle>
                              <CardDescription>
                                {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}
                                {order.customerName ? ` • ${order.customerName}` : ""}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant="outline">{order.items.length} items</Badge>
                              <Badge variant={order.status === "pending" ? "secondary" : "default"}>{order.status}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-bold text-primary">{item.quantity}</span>
                                    </div>
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      {item.notes && <p className="text-sm text-muted-foreground">Note: {item.notes}</p>}
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{item.preparationTime || 15} min</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <Badge variant={item.status === "ready" ? "default" : item.status === "preparing" ? "outline" : "secondary"}>
                                    {item.status || "pending"}
                                  </Badge>
                                  <div className="flex space-x-1">
                                    {(!item.status || item.status === "pending") && (
                                      <Button size="sm" onClick={() => updateItemStatus(order._id, idx, "preparing")}>Start</Button>
                                    )}
                                    {item.status === "preparing" && (
                                      <Button size="sm" onClick={() => updateItemStatus(order._id, idx, "ready")}>Complete</Button>
                                    )}
                                    {item.status === "ready" && (
                                      <Button size="sm" variant="outline" disabled>Ready</Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="mt-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Order Progress</span>
                                <span className="text-sm text-muted-foreground">{readyCount} / {order.items.length}</span>
                              </div>
                              <Progress value={(readyCount / order.items.length) * 100} className="h-2" />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                              {order.status === "pending" && (
                                <Button size="sm" onClick={() => updateOrderStatus(order._id, "confirmed")}>Confirm</Button>
                              )}
                              {order.status === "confirmed" && (
                                <Button size="sm" onClick={() => updateOrderStatus(order._id, "preparing")}>Start Preparing</Button>
                              )}
                              {order.status === "preparing" && readyCount === order.items.length && (
                                <Button size="sm" onClick={() => updateOrderStatus(order._id, "ready")}>Mark Ready</Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="prep" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preparation Station</CardTitle>
                  <CardDescription>Current items being prepared</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <Flame className="h-5 w-5 mr-2 text-orange-500" />
                          Hot Station
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {orders
                          .flatMap((o) => o.items.map((it) => ({ it, o })))
                          .filter(({ it }) => it.status === "preparing")
                          .map(({ it, o }, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{it.name}</p>
                                <p className="text-xs text-muted-foreground">{o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"} • {it.quantity}x</p>
                              </div>
                              <Badge variant="secondary">Cooking</Badge>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <ChefHat className="h-5 w-5 mr-2 text-blue-500" />
                          Cold Station
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {orders
                          .flatMap((o) => o.items.map((it) => ({ it, o })))
                          .filter(({ it }) => it.status === "preparing")
                          .map(({ it, o }, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{it.name}</p>
                                <p className="text-xs text-muted-foreground">{o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"} • {it.quantity}x</p>
                              </div>
                              <Badge variant="secondary">Preparing</Badge>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}


