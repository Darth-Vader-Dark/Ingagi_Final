"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { GlobalLoading } from "@/components/global-loading"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ChefHat, Clock, AlertTriangle, CheckCircle, Flame, LogOut, RefreshCw,
  Timer, TrendingUp, Bell, Eye, PlayCircle, PauseCircle, Package,
  Utensils, Users, DollarSign, BarChart3, Filter, Settings as SettingsIcon,
  Volume2, Palette, Building2
} from "lucide-react"
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
  price?: number
}

interface KitchenOrder {
  _id: string
  restaurantId: string
  customerName?: string
  phone?: string
  tableNumber?: string
  items: KitchenItem[]
  total?: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  priority?: "normal" | "high" | "urgent"
  orderTime?: string
  createdAt?: string
  specialRequests?: string
  allergies?: string[]
}

export default function KitchenDashboard() {
  const { user, logout } = useAuth()

  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tier, setTier] = useState<'core'|'pro'|'enterprise'|'unknown'>('unknown')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    soundNotifications: true,
    showTimers: true,
    compactView: false,
    theme: 'light' as 'light' | 'dark',
    language: 'en'
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previousOrderCount = useRef(0)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

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

  // Play sound for new orders
  useEffect(() => {
    if (orders.length > previousOrderCount.current && previousOrderCount.current > 0) {
      playNewOrderSound()
      setNotification({ type: 'success', message: `${orders.length - previousOrderCount.current} new order(s) received!` })
    }
    previousOrderCount.current = orders.length
  }, [orders.length])

  const playNewOrderSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/orders?restaurantId=${user?.restaurantId}`)
      if (!res.ok) throw new Error("Failed to load orders")
      const data = await res.json()
      const normalized: KitchenOrder[] = (data.orders || [])
        .filter((o: any) => o.restaurantId === user?.restaurantId)
        .filter((o: any) => o.status !== 'served' && o.status !== 'cancelled')
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
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)))
      setNotification({ type: 'success', message: `Order updated to ${status}` })
      await fetchOrders()
    } catch (e) {
      console.error(e)
      setNotification({ type: 'error', message: 'Failed to update order' })
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

  // Calculate order wait time
  const getOrderWaitTime = (orderTime: string) => {
    const orderDate = new Date(orderTime)
    const diff = Math.floor((currentTime.getTime() - orderDate.getTime()) / 1000)
    
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const getWaitTimeColor = (orderTime: string) => {
    const orderDate = new Date(orderTime)
    const minutes = Math.floor((currentTime.getTime() - orderDate.getTime()) / 60000)
    
    if (minutes > 30) return 'text-red-600'
    if (minutes > 15) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Calculate statistics
  const getStats = () => {
    const totalActiveOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const preparingOrders = orders.filter(o => o.status === 'preparing').length
    const readyOrders = orders.filter(o => o.status === 'ready').length
    const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)
    const readyItems = orders.reduce((sum, o) => sum + o.items.filter((i) => i.status === "ready").length, 0)
    const urgentOrders = orders.filter((o) => o.priority === "urgent").length
    const avgWaitTime = orders.length > 0 
      ? orders.reduce((sum, o) => {
          const diff = Math.floor((currentTime.getTime() - new Date(o.createdAt || o.orderTime || '').getTime()) / 60000)
          return sum + diff
        }, 0) / orders.length
      : 0
    
    return {
      totalActiveOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      totalItems,
      readyItems,
      urgentOrders,
      avgWaitTime: Math.round(avgWaitTime)
    }
  }

  const getFilteredOrders = () => {
    if (filterStatus === 'all') return orders
    return orders.filter(o => o.status === filterStatus)
  }

  const stats = getStats()

  if (loading) {
    return <GlobalLoading />
  }

  return (
    <ProtectedRoute allowedRoles={["kitchen"]}>
      <div className="min-h-screen bg-background">
        {/* Hidden audio element for new order sound */}
        <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <ChefHat className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Kitchen Dashboard</h1>
                    <p className="text-muted-foreground mt-1">{user?.establishmentName || 'Establishment'} • {(user as any)?.establishmentType || 'Establishment'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); fetchOrders() }} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="outline" 
                  size="sm"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
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
          {/* Notifications */}
          {notification && (
            <div className={`mb-6 p-4 rounded-lg border ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {notification.message}
              </p>
            </div>
          )}

          {/* Urgent Orders Alert */}
          {stats.urgentOrders > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <Flame className="h-5 w-5 text-red-600 mr-2 animate-pulse" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    {stats.urgentOrders} Urgent Order{stats.urgentOrders > 1 ? 's' : ''}!
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    High priority orders need immediate attention
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={() => {
                const pending = orders.filter(o => o.status === 'pending')
                if (pending.length > 0) {
                  setNotification({ type: 'success', message: `${pending.length} order(s) waiting to start` })
                } else {
                  setNotification({ type: 'error', message: 'No pending orders' })
                }
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <Clock className="h-5 w-5" />
              <span>Check Pending</span>
            </Button>
            <Button
              onClick={() => {
                const ready = orders.filter(o => o.status === 'ready')
                if (ready.length > 0) {
                  setNotification({ type: 'success', message: `${ready.length} order(s) ready for service!` })
                } else {
                  setNotification({ type: 'error', message: 'No orders ready' })
                }
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Ready Orders</span>
            </Button>
            <Button
              onClick={() => {
                playNewOrderSound()
                setNotification({ type: 'success', message: 'Sound test successful!' })
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <Bell className="h-5 w-5" />
              <span>Test Sound</span>
            </Button>
            <Button
              onClick={() => {
                setNotification({ 
                  type: 'success', 
                  message: `${stats.totalActiveOrders} active • ${stats.avgWaitTime} min avg wait`
                })
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Stats</span>
            </Button>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalActiveOrders}</div>
                <p className="text-xs text-muted-foreground">{stats.totalItems} total items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready to Serve</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.readyOrders}</div>
                <p className="text-xs text-muted-foreground">{stats.readyItems} items ready</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgWaitTime}m</div>
                <p className="text-xs text-muted-foreground">Current average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
                <Flame className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.urgentOrders}</div>
                <p className="text-xs text-muted-foreground">High priority</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preparing</CardTitle>
                <Utensils className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.preparingOrders}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            {isProOrAbove(tier as any) && (
              <AIHints 
                userRole="kitchen" 
                subscriptionTier={tier} 
                data={{ 
                  activeOrders: stats.totalActiveOrders,
                  urgentOrders: stats.urgentOrders,
                  avgWaitTime: stats.avgWaitTime
                }}
                className="col-span-1"
              />
            )}
          </div>

          {/* Order Status Groups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Pending Orders */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Pending ({stats.pendingOrders})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {orders.filter(o => o.status === 'pending').slice(0, 5).map(order => (
                    <div key={order._id} className="bg-white p-2 rounded border mb-2 text-xs">
                      <div className="font-semibold">
                        {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
                      </div>
                      <div className={`font-mono ${getWaitTimeColor(order.createdAt || order.orderTime || '')}`}>
                        {getOrderWaitTime(order.createdAt || order.orderTime || '')}
                      </div>
                    </div>
                  ))}
                  {stats.pendingOrders === 0 && (
                    <p className="text-xs text-muted-foreground">No pending orders</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Preparing Orders */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4 text-blue-600" />
                  Preparing ({stats.preparingOrders})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {orders.filter(o => o.status === 'preparing').slice(0, 5).map(order => (
                    <div key={order._id} className="bg-white p-2 rounded border mb-2 text-xs">
                      <div className="font-semibold">
                        {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
                      </div>
                      <div className={`font-mono ${getWaitTimeColor(order.createdAt || order.orderTime || '')}`}>
                        {getOrderWaitTime(order.createdAt || order.orderTime || '')}
                      </div>
                    </div>
                  ))}
                  {stats.preparingOrders === 0 && (
                    <p className="text-xs text-muted-foreground">No orders being prepared</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Ready Orders */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-600 animate-pulse" />
                  Ready ({stats.readyOrders})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {orders.filter(o => o.status === 'ready').slice(0, 5).map(order => (
                    <div key={order._id} className="bg-white p-2 rounded border mb-2 text-xs">
                      <div className="font-semibold">
                        {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
                      </div>
                      <div className={`font-mono ${getWaitTimeColor(order.createdAt || order.orderTime || '')}`}>
                        {getOrderWaitTime(order.createdAt || order.orderTime || '')}
                      </div>
                    </div>
                  ))}
                  {stats.readyOrders === 0 && (
                    <p className="text-xs text-muted-foreground">No orders ready</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>Manage and track order preparation</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filterStatus === 'preparing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('preparing')}
                  >
                    Preparing
                  </Button>
                  <Button
                    variant={filterStatus === 'ready' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('ready')}
                  >
                    Ready
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getFilteredOrders().length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders to show</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredOrders().map((order) => (
                    <div
                      key={order._id}
                      className={`border rounded-lg p-4 ${
                        order.priority === 'urgent' ? 'border-red-300 bg-red-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {order.tableNumber ? `Table ${order.tableNumber}` : order.customerName}
                            </h3>
                            {order.priority === 'urgent' && (
                              <Badge variant="destructive" className="animate-pulse">
                                <Flame className="h-3 w-3 mr-1" />
                                URGENT
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              <span className={getWaitTimeColor(order.createdAt || order.orderTime || '')}>
                                {getOrderWaitTime(order.createdAt || order.orderTime || '')}
                              </span>
                            </span>
                            {order.phone && (
                              <span>{order.phone}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            order.status === 'ready' ? 'default' :
                            order.status === 'preparing' ? 'secondary' :
                            'outline'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium">{item.quantity}× {item.name}</span>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={item.status === 'pending' ? 'default' : 'outline'}
                                onClick={() => updateItemStatus(order._id, idx, 'pending')}
                                className="text-xs px-2"
                              >
                                Pending
                              </Button>
                              <Button
                                size="sm"
                                variant={item.status === 'preparing' ? 'default' : 'outline'}
                                onClick={() => updateItemStatus(order._id, idx, 'preparing')}
                                className="text-xs px-2"
                              >
                                Preparing
                              </Button>
                              <Button
                                size="sm"
                                variant={item.status === 'ready' ? 'default' : 'outline'}
                                onClick={() => updateItemStatus(order._id, idx, 'ready')}
                                className="text-xs px-2"
                              >
                                Ready
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Special Requests */}
                      {order.specialRequests && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <span className="font-semibold">Special Requests:</span> {order.specialRequests}
                        </div>
                      )}

                      {/* Allergies */}
                      {order.allergies && order.allergies.length > 0 && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <span className="font-semibold text-red-800">⚠️ Allergies:</span> {order.allergies.join(', ')}
                        </div>
                      )}

                      {/* Order Actions */}
                      <div className="flex gap-2 pt-3 border-t">
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => updateOrderStatus(order._id, 'preparing')}
                            className="flex-1"
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            onClick={() => updateOrderStatus(order._id, 'ready')}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <div className="flex-1 text-center py-2 bg-green-100 text-green-800 rounded font-semibold">
                            <CheckCircle className="h-4 w-4 inline mr-2" />
                            Ready for Service
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Kitchen Settings
            </DialogTitle>
            <DialogDescription>
              Customize your kitchen dashboard preferences
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-180px)] pr-4">
            <div className="space-y-4 py-2">
            {/* Auto Refresh Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Auto Refresh
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh orders
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoRefresh: checked })
                  }
                />
              </div>

              {settings.autoRefresh && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="refresh-interval" className="text-sm">
                    Refresh Interval (seconds)
                  </Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) =>
                      setSettings({ ...settings, refreshInterval: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="refresh-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Notifications Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Sound Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play sound when new orders arrive
                  </p>
                </div>
                <Switch
                  checked={settings.soundNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, soundNotifications: checked })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Display Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Show Timers
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display preparation time and wait times
                  </p>
                </div>
                <Switch
                  checked={settings.showTimers}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showTimers: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Compact View
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show orders in a compact layout
                  </p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, compactView: checked })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="theme" className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: 'light' | 'dark') =>
                    setSettings({ ...settings, theme: value })
                  }
                >
                  <SelectTrigger id="theme" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="language" className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Language
                </Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, language: value })
                  }
                >
                  <SelectTrigger id="language" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="rw">Kinyarwanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSettings({
                  autoRefresh: true,
                  refreshInterval: 30,
                  soundNotifications: true,
                  showTimers: true,
                  compactView: false,
                  theme: 'light',
                  language: 'en'
                })
              }}
            >
              Reset to Defaults
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                setShowSettings(false)
                setNotification({ type: 'success', message: 'Settings saved successfully' })
                setTimeout(() => setNotification(null), 3000)
              }}
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

