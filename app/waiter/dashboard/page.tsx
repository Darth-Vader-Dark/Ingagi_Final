"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertCircle, Users, ShoppingBag, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Order {
  id: string
  tableNumber: string
  customerName: string
  items: Array<{ name: string; quantity: number; notes?: string }>
  total: number
  status: "pending" | "preparing" | "ready" | "served"
  priority: "normal" | "high" | "urgent"
  orderTime: string
  estimatedTime?: string
}

interface Table {
  number: string
  status: "available" | "occupied" | "reserved" | "cleaning"
  customers: number
  waiter: string
  orderValue: number
}

const MOCK_ORDERS: Order[] = [
  {
    id: "ord_001",
    tableNumber: "5",
    customerName: "John Doe",
    items: [
      { name: "Igikoma Grilled Beef", quantity: 2 },
      { name: "Urwagwa Traditional Beer", quantity: 1, notes: "Extra cold" },
    ],
    total: 27000,
    status: "ready",
    priority: "high",
    orderTime: "14:30",
    estimatedTime: "14:45",
  },
  {
    id: "ord_002",
    tableNumber: "3",
    customerName: "Jane Smith",
    items: [{ name: "Ubwoba Fish Curry", quantity: 1, notes: "Mild spice" }],
    total: 9500,
    status: "preparing",
    priority: "normal",
    orderTime: "14:45",
    estimatedTime: "15:00",
  },
  {
    id: "ord_003",
    tableNumber: "8",
    customerName: "Mike Johnson",
    items: [
      { name: "Ikinyama Appetizer", quantity: 2 },
      { name: "Igikoma Grilled Beef", quantity: 1 },
    ],
    total: 21000,
    status: "pending",
    priority: "urgent",
    orderTime: "15:00",
  },
]

const MOCK_TABLES: Table[] = [
  { number: "1", status: "available", customers: 0, waiter: "", orderValue: 0 },
  { number: "2", status: "occupied", customers: 4, waiter: "Alice", orderValue: 45000 },
  { number: "3", status: "occupied", customers: 2, waiter: "Alice", orderValue: 9500 },
  { number: "4", status: "cleaning", customers: 0, waiter: "", orderValue: 0 },
  { number: "5", status: "occupied", customers: 3, waiter: "Alice", orderValue: 27000 },
  { number: "6", status: "reserved", customers: 0, waiter: "Alice", orderValue: 0 },
  { number: "7", status: "available", customers: 0, waiter: "", orderValue: 0 },
  { number: "8", status: "occupied", customers: 2, waiter: "Alice", orderValue: 21000 },
]

export default function WaiterDashboard() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES)

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "preparing":
        return "outline"
      case "ready":
        return "default"
      case "served":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: Order["priority"]) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTableStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "outline"
      case "occupied":
        return "default"
      case "reserved":
        return "secondary"
      case "cleaning":
        return "destructive"
      default:
        return "outline"
    }
  }

  const myTables = tables.filter((table) => table.waiter === user?.name || table.status === "available")
  const myOrders = orders.filter((order) => myTables.some((table) => table.number === order.tableNumber))

  return (
    <ProtectedRoute allowedRoles={["waiter"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Waiter Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage tables and orders</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Welcome, {user?.name}</p>
                  <p className="text-xs text-muted-foreground">Waiter</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tables</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myTables.filter((t) => t.status === "occupied").length}</div>
                <p className="text-xs text-muted-foreground">
                  {myTables.filter((t) => t.status === "available").length} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myOrders.filter((o) => o.status !== "served").length}</div>
                <p className="text-xs text-muted-foreground">
                  {myOrders.filter((o) => o.status === "ready").length} ready
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  RWF {myTables.reduce((sum, table) => sum + table.orderValue, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Today's shift</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Orders</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myOrders.filter((o) => o.priority === "urgent").length}</div>
                <p className="text-xs text-muted-foreground">Needs immediate attention</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="requests">Customer Requests</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Orders</CardTitle>
                  <CardDescription>Manage your table orders and update status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Details</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.customerName} • {order.orderTime}
                              </div>
                              {order.estimatedTime && (
                                <div className="text-xs text-muted-foreground">Est: {order.estimatedTime}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Table {order.tableNumber}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.quantity}x {item.name}
                                  {item.notes && (
                                    <div className="text-xs text-muted-foreground">Note: {item.notes}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">RWF {order.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value as Order["status"])}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="served">Served</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(order.priority)}>{order.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            {order.status === "ready" && (
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, "served")}>
                                Mark Served
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tables Tab */}
            <TabsContent value="tables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Table Overview</CardTitle>
                  <CardDescription>Monitor table status and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {tables.map((table) => (
                      <Card
                        key={table.number}
                        className={`text-center ${
                          table.waiter === user?.name || table.status === "available" ? "border-primary" : "opacity-60"
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Table {table.number}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Badge variant={getTableStatusColor(table.status)} className="w-full">
                            {table.status}
                          </Badge>
                          {table.status === "occupied" && (
                            <>
                              <p className="text-sm text-muted-foreground">{table.customers} customers</p>
                              <p className="text-xs font-medium">RWF {table.orderValue.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Waiter: {table.waiter}</p>
                            </>
                          )}
                          {table.status === "reserved" && <p className="text-xs text-muted-foreground">Reserved</p>}
                          {table.status === "cleaning" && (
                            <p className="text-xs text-muted-foreground">Being cleaned</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Requests Tab */}
            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Requests</CardTitle>
                  <CardDescription>Handle special requests and customer service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Table 5 - Additional napkins</p>
                            <p className="text-sm text-muted-foreground">Requested 5 minutes ago</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm">Complete</Button>
                            <Button size="sm" variant="outline">
                              Assign to Staff
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Table 3 - Food allergy concern</p>
                            <p className="text-sm text-muted-foreground">Customer has nut allergy - urgent</p>
                            <p className="text-xs text-muted-foreground">Requested 2 minutes ago</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="destructive">
                              Handle Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Table 8 - Check please</p>
                            <p className="text-sm text-muted-foreground">Ready to pay</p>
                            <p className="text-xs text-muted-foreground">Requested 1 minute ago</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm">Bring Check</Button>
                          </div>
                        </div>
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
