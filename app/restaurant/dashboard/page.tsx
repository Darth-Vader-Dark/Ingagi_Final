"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Crown,
  UserPlus,
  ShoppingBag,
  Settings,
  Upload,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  phone: string
  status: "active" | "inactive"
  createdAt: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  available: boolean
  isAlcoholic?: boolean
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  tableNumber?: string
  createdAt: string
}

interface RestaurantStats {
  totalOrders: number
  totalRevenue: number
  activeEmployees: number
  menuItems: number
  avgRating: number
  isPremium: boolean
}

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp_001",
    name: "Alice Uwimana",
    email: "alice@kigaliheights.com",
    role: "manager",
    phone: "+250 788 111 222",
    status: "active",
    createdAt: "2025-01-10",
  },
  {
    id: "emp_002",
    name: "Bob Nkurunziza",
    email: "bob@kigaliheights.com",
    role: "waiter",
    phone: "+250 788 333 444",
    status: "active",
    createdAt: "2025-01-12",
  },
  {
    id: "emp_003",
    name: "Carol Mukamana",
    email: "carol@kigaliheights.com",
    role: "kitchen",
    phone: "+250 788 555 666",
    status: "active",
    createdAt: "2025-01-15",
  },
]

const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Igikoma Grilled Beef",
    description: "Premium local beef grilled to perfection with traditional spices",
    price: 12000,
    category: "Main Course",
    image: "/placeholder.svg?height=200&width=300",
    available: true,
  },
  {
    id: "2",
    name: "Ubwoba Fish Curry",
    description: "Fresh tilapia in coconut curry sauce with local vegetables",
    price: 9500,
    category: "Main Course",
    image: "/placeholder.svg?height=200&width=300",
    available: true,
  },
  {
    id: "3",
    name: "Urwagwa Traditional Beer",
    description: "Locally brewed traditional banana beer",
    price: 3000,
    category: "Beverages",
    image: "/placeholder.svg?height=200&width=300",
    available: true,
    isAlcoholic: true,
  },
]

const MOCK_ORDERS: Order[] = [
  {
    id: "ord_001",
    customerName: "John Doe",
    customerPhone: "+250 788 999 888",
    items: [
      { name: "Igikoma Grilled Beef", quantity: 2, price: 12000 },
      { name: "Urwagwa Traditional Beer", quantity: 1, price: 3000 },
    ],
    total: 27000,
    status: "preparing",
    tableNumber: "5",
    createdAt: "2025-01-25T14:30:00Z",
  },
  {
    id: "ord_002",
    customerName: "Jane Smith",
    customerPhone: "+250 788 777 666",
    items: [{ name: "Ubwoba Fish Curry", quantity: 1, price: 9500 }],
    total: 9500,
    status: "ready",
    createdAt: "2025-01-25T15:15:00Z",
  },
]

const MOCK_STATS: RestaurantStats = {
  totalOrders: 156,
  totalRevenue: 2500000,
  activeEmployees: 3,
  menuItems: 15,
  avgRating: 4.8,
  isPremium: true,
}

const REVENUE_DATA = [
  { day: "Mon", revenue: 85000, orders: 12 },
  { day: "Tue", revenue: 92000, orders: 15 },
  { day: "Wed", revenue: 78000, orders: 11 },
  { day: "Thu", revenue: 105000, orders: 18 },
  { day: "Fri", revenue: 125000, orders: 22 },
  { day: "Sat", revenue: 145000, orders: 28 },
  { day: "Sun", revenue: 135000, orders: 25 },
]

const ORDER_STATUS_DATA = [
  { name: "Completed", value: 65, color: "#059669" },
  { name: "Preparing", value: 20, color: "#10b981" },
  { name: "Ready", value: 10, color: "#34d399" },
  { name: "Cancelled", value: 5, color: "#ef4444" },
]

export default function RestaurantAdminDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS)
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [stats, setStats] = useState<RestaurantStats>(MOCK_STATS)
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [showMenuDialog, setShowMenuDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
  })
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
    isAlcoholic: false,
    image: "",
  })

  const handleAddEmployee = async () => {
    const employee: Employee = {
      id: `emp_${Date.now()}`,
      ...newEmployee,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    }

    setEmployees([...employees, employee])
    setNewEmployee({ name: "", email: "", role: "", phone: "" })
    setShowEmployeeDialog(false)

    // In production, this would generate login credentials and send email
    alert(`Employee added! Login credentials sent to ${employee.email}`)
  }

  const handleAddMenuItem = async () => {
    const menuItem: MenuItem = {
      id: Date.now().toString(),
      ...newMenuItem,
      image: newMenuItem.image || "/placeholder.svg?height=200&width=300",
    }

    setMenuItems([...menuItems, menuItem])
    setNewMenuItem({
      name: "",
      description: "",
      price: 0,
      category: "",
      available: true,
      isAlcoholic: false,
      image: "",
    })
    setShowMenuDialog(false)
  }

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, available: !item.available } : item)))
  }

  return (
    <ProtectedRoute allowedRoles={["restaurant_admin"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Restaurant Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage your restaurant operations</p>
              </div>
              <div className="flex items-center space-x-4">
                {stats.isPremium && (
                  <Badge variant="default" className="bg-primary">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium">Kigali Heights Restaurant</p>
                  <p className="text-xs text-muted-foreground">Welcome, {user?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RWF {stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeEmployees}</div>
                <p className="text-xs text-muted-foreground">All active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgRating}</div>
                <p className="text-xs text-muted-foreground">127 reviews</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Revenue</CardTitle>
                    <CardDescription>Revenue and orders for the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={REVENUE_DATA}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            name === "revenue" ? `RWF ${value.toLocaleString()}` : value,
                            name === "revenue" ? "Revenue" : "Orders",
                          ]}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} />
                        <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>Current order status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ORDER_STATUS_DATA}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {ORDER_STATUS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customerName}</div>
                              <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.items.length} items</TableCell>
                          <TableCell>RWF {order.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "preparing"
                                    ? "secondary"
                                    : order.status === "ready"
                                      ? "outline"
                                      : "destructive"
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Manage incoming orders and update status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Details</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.tableNumber && `Table ${order.tableNumber} • `}
                                {new Date(order.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customerName}</div>
                              <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.quantity}x {item.name}
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
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Menu Management</CardTitle>
                      <CardDescription>Add, edit, and manage your menu items</CardDescription>
                    </div>
                    <Button onClick={() => setShowMenuDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <CardDescription className="text-sm">{item.category}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Switch
                                checked={item.available}
                                onCheckedChange={() => toggleMenuItemAvailability(item.id)}
                                size="sm"
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-primary">RWF {item.price.toLocaleString()}</span>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {item.isAlcoholic && (
                            <Badge variant="outline" className="text-xs mt-2">
                              21+
                            </Badge>
                          )}
                          {!item.available && (
                            <Badge variant="destructive" className="text-xs mt-2">
                              Out of Stock
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Employee Management</CardTitle>
                      <CardDescription>Manage your restaurant staff and their roles</CardDescription>
                    </div>
                    <Button onClick={() => setShowEmployeeDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-muted-foreground">{employee.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {employee.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee.phone}</TableCell>
                          <TableCell>
                            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customize Tab */}
            <TabsContent value="customize" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Customization</CardTitle>
                  <CardDescription>Customize your restaurant's landing page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Restaurant Name</Label>
                        <Input defaultValue="Kigali Heights Restaurant" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          defaultValue="Experience fine dining with a modern twist on traditional Rwandan cuisine."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input defaultValue="KN 4 Ave, Kigali, Rwanda" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input defaultValue="+250 788 123 456" />
                      </div>
                      <div className="space-y-2">
                        <Label>Operating Hours</Label>
                        <Input defaultValue="Mon-Sun: 7:00 AM - 11:00 PM" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const formData = new FormData()
                                formData.append('file', file)
                                
                                try {
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  })
                                  const result = await response.json()
                                  
                                  if (result.success) {
                                    console.log('Logo uploaded:', result.url)
                                    // You can add state management here to store the logo URL
                                  } else {
                                    console.error('Upload failed:', result.error)
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error)
                                }
                              }
                            }}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload logo</p>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Banner Image</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const formData = new FormData()
                                formData.append('file', file)
                                
                                try {
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  })
                                  const result = await response.json()
                                  
                                  if (result.success) {
                                    console.log('Banner uploaded:', result.url)
                                    // You can add state management here to store the banner URL
                                  } else {
                                    console.error('Upload failed:', result.error)
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error)
                                }
                              }
                            }}
                            className="hidden"
                            id="banner-upload"
                          />
                          <label htmlFor="banner-upload" className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload banner</p>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Promotions & Events</CardTitle>
                  <CardDescription>Manage your current promotions and upcoming events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Promotion
                    </Button>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Settings</CardTitle>
                  <CardDescription>Configure your restaurant preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Accept Online Orders</Label>
                        <p className="text-sm text-muted-foreground">Allow customers to place orders online</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Table Reservations</Label>
                        <p className="text-sm text-muted-foreground">Enable table booking system</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Robot Waiter Integration</Label>
                        <p className="text-sm text-muted-foreground">Enable robot waiter for order delivery</p>
                      </div>
                      <Switch disabled={!stats.isPremium} defaultChecked={stats.isPremium} />
                    </div>
                    {!stats.isPremium && (
                      <p className="text-sm text-muted-foreground">
                        Robot waiter integration is available with Premium subscription
                      </p>
                    )}
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              {stats.isPremium && (
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Features</CardTitle>
                    <CardDescription>Your premium subscription includes these features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">Advanced Analytics</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">Loyalty Programs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">AI Menu Recommendations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">Priority Homepage Placement</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">Robot Waiter Integration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-sm">Advanced Inventory Management</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Employee Dialog */}
        <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Create a new employee account with role-based access</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emp-name">Full Name</Label>
                <Input
                  id="emp-name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-email">Email</Label>
                <Input
                  id="emp-email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-phone">Phone</Label>
                <Input
                  id="emp-phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="+250 7XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">Role</Label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                    <SelectItem value="inventory">Inventory Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEmployee}>Add Employee</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Menu Item Dialog */}
        <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>Add a new item to your restaurant menu</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea
                  id="item-desc"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  placeholder="Describe the item"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price (RWF)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category</Label>
                  <Select
                    value={newMenuItem.category}
                    onValueChange={(value) => setNewMenuItem({ ...newMenuItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Appetizers">Appetizers</SelectItem>
                      <SelectItem value="Main Course">Main Course</SelectItem>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                      <SelectItem value="Desserts">Desserts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-image">Item Image</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="item-image"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const formData = new FormData()
                        formData.append('file', file)
                        try {
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          })
                          const data = await response.json()
                          if (data.success) {
                            setNewMenuItem({ ...newMenuItem, image: data.url })
                          }
                        } catch (error) {
                          console.error('Error uploading image:', error)
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="item-image"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    {newMenuItem.image ? (
                      <img
                        src={newMenuItem.image}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-500">Click to upload image</div>
                        <div className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newMenuItem.isAlcoholic}
                  onCheckedChange={(checked) => setNewMenuItem({ ...newMenuItem, isAlcoholic: checked })}
                />
                <Label>Contains Alcohol (21+)</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowMenuDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMenuItem}>Add Item</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
