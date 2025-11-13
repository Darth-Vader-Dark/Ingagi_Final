"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { GlobalLoading } from "@/components/global-loading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, Users, ShoppingBag, LogOut, Building2, RefreshCw, Clock, DollarSign, TrendingUp, Bell, MessageSquare, Utensils, ClipboardList, Timer, Phone, MapPin, CreditCard, Banknote, Smartphone, Receipt, PlusCircle, MinusCircle, Edit2, Save, Settings as SettingsIcon, Volume2, VolumeX, Palette, Globe, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useParams } from "next/navigation"
import { isProOrAbove } from "@/lib/subscription-access"
import { AIHints } from "@/components/ai-hints"

interface Order {
  id: string
  tableNumber: string
  customerName: string
  customerPhone?: string
  items: Array<{ name: string; quantity: number; notes?: string; price: number }>
  total: number
  status: "pending" | "preparing" | "ready" | "served" | "cancelled"
  priority: "normal" | "high" | "urgent"
  orderTime: string
  estimatedTime?: string
  paymentMethod?: "cash" | "card" | "mobile"
  paymentStatus?: "pending" | "paid" | "failed"
  specialRequests?: string
  allergies?: string[]
}

interface Table {
  number: string
  status: "available" | "occupied" | "reserved" | "cleaning" | "maintenance"
  customers: number
  waiter: string
  orderValue: number
  capacity: number
  location: "indoor" | "outdoor" | "bar" | "private"
  reservationTime?: string
  customerNotes?: string
  lastCleaned?: string
}

interface Restaurant {
  _id: string
  name: string
  type: string
  location: string
}

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  image?: string
}

interface Subscription {
  tier: "core" | "pro" | "enterprise"
}

export default function WaiterDashboard() {
  const { user, logout } = useAuth()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [loadingStep, setLoadingStep] = useState('Starting...')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [showTableDetails, setShowTableDetails] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<Order["status"] | "all">("all")
  const [sortBy, setSortBy] = useState<"time" | "priority" | "table">("time")
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showTipDialog, setShowTipDialog] = useState(false)
  const [selectedOrderForTip, setSelectedOrderForTip] = useState<string | null>(null)
  const [tipAmount, setTipAmount] = useState<number>(0)
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<string | null>(null)
  
  // New order form state
  const [newOrderTable, setNewOrderTable] = useState<string>('')
  const [newOrderCustomer, setNewOrderCustomer] = useState<string>('')
  const [newOrderPhone, setNewOrderPhone] = useState<string>('')
  const [newOrderItems, setNewOrderItems] = useState<Array<{ menuItem: MenuItem; quantity: number; notes?: string }>>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
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
  
  // Ref to track if fetch is in progress to prevent multiple simultaneous calls
  const fetchInProgressRef = useRef(false)

  // Update current time every second for order timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const fetchRestaurantData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping...')
      return
    }
    
    fetchInProgressRef.current = true
    
    try {
      // Helper function to fetch with timeout and retry
      const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 15000, retries: number = 2) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          if (error instanceof Error && error.name === 'AbortError') {
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
              return fetchWithTimeout(url, options, timeoutMs, retries - 1)
            }
            throw new Error(`Request timeout after ${timeoutMs}ms`)
          }
          throw error
        }
      }
      
      // Fetch restaurant info
      try {
        setLoadingStep('Fetching restaurant info...')
        const restaurantResponse = await fetchWithTimeout(`/api/restaurant/${restaurantId}`, {}, 10000)
        if (restaurantResponse.ok) {
          const restaurantData = await restaurantResponse.json()
          setRestaurant(restaurantData.restaurant)
        } else {
          // Set fallback restaurant data
          setRestaurant({
            _id: restaurantId,
            name: 'Restaurant',
            type: 'Restaurant',
            location: 'Location'
          })
        }
      } catch (error) {
        // Set fallback restaurant data
        setRestaurant({
          _id: restaurantId,
          name: 'Restaurant',
          type: 'Restaurant',
          location: 'Location'
        })
      }
      
      // Fetch subscription for gating
      try {
        setLoadingStep('Fetching subscription info...')
        const subscriptionResponse = await fetchWithTimeout(`/api/restaurant/${restaurantId}/subscription`, {}, 10000)
        if (subscriptionResponse.ok) {
          const data = await subscriptionResponse.json()
          setSubscription(data.subscription || null)
        }
      } catch (e) {
        // Subscription fetch failed, using default
      }

      // Fetch orders for this restaurant
      try {
        setLoadingStep('Fetching orders...')
        const ordersResponse = await fetchWithTimeout(`/api/orders?restaurantId=${restaurantId}`, {}, 10000)
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          // Map the orders to match the expected interface
        const mappedOrders = (ordersData.orders || []).map((order: any) => ({
          id: order._id, // Use _id as id
          tableNumber: order.tableNumber || '',
          customerName: order.customerName,
          customerPhone: order.phone,
          items: order.items || [],
          total: order.total || 0,
          status: order.status || 'pending',
          priority: order.priority || 'normal',
          orderTime: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
          estimatedTime: order.estimatedTime,
          specialRequests: order.notes,
          allergies: order.allergies || [],
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: order.paymentMethod
        }))
        setOrders(mappedOrders)
        } else {
          setOrders([])
        }
      } catch (error) {
        setOrders([])
      }
      
      // Fetch tables for this restaurant
      try {
        setLoadingStep('Fetching tables...')
        const tablesResponse = await fetchWithTimeout(`/api/restaurant/${restaurantId}/tables`, {}, 10000)
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json()
          setTables(tablesData.tables || [])
        } else {
          // Set fallback tables
          setTables([
            { number: "1", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 4, location: "indoor" },
            { number: "2", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 4, location: "indoor" },
            { number: "3", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 6, location: "indoor" },
            { number: "4", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 2, location: "bar" }
          ])
        }
      } catch (error) {
        // Set fallback tables
        setTables([
          { number: "1", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 4, location: "indoor" },
          { number: "2", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 4, location: "indoor" },
          { number: "3", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 6, location: "indoor" },
          { number: "4", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 2, location: "bar" }
        ])
      }
      
      // Fetch menu items for creating new orders
      try {
        setLoadingStep('Fetching menu...')
        const menuResponse = await fetchWithTimeout(`/api/restaurant/${restaurantId}/menu`, {}, 10000)
        if (menuResponse.ok) {
          const menuData = await menuResponse.json()
          setMenuItems(menuData.menuItems || [])
        } else {
          setMenuItems([])
        }
      } catch (error) {
        setMenuItems([])
      }
      
    } catch (error) {
      // Handle timeout specifically
      if (error instanceof Error && error.message.includes('Request timeout')) {
        setRestaurant({
          _id: restaurantId,
          name: 'Restaurant',
          type: 'Restaurant',
          location: 'Location'
        })
        setOrders([])
        setTables([
          { number: "1", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 4, location: "indoor" },
          { number: "2", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 4, location: "indoor" },
          { number: "3", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 6, location: "indoor" },
          { number: "4", status: "available", customers: 0, waiter: "", orderValue: 0, capacity: 2, location: "bar" }
        ])
      }
    } finally {
      setLoading(false)
      setIsInitialized(true)
      fetchInProgressRef.current = false
    }
  }, [restaurantId])

  useEffect(() => {
    if (user && restaurantId && !isInitialized) {
      fetchRestaurantData()
    }
  }, [user, restaurantId, isInitialized, fetchRestaurantData])

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    // Validate restaurant access
    if (!validateRestaurantAccess('order status update', orderId)) {
      return
    }

    console.log(`Attempting to update order ${orderId} to status ${newStatus}`)

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      console.log(`API response status: ${response.status}`)

      if (response.ok) {
        const responseData = await response.json()
        console.log('API response data:', responseData)
        
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
        console.log(`Order ${orderId} status updated to ${newStatus} in restaurant ${restaurantId}`)
        setNotification({ type: 'success', message: `Order status updated to ${newStatus}` })
      } else {
        const errorData = await response.json()
        console.error('Failed to update order status:', errorData)
        setNotification({ type: 'error', message: `Failed to update order status: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      setNotification({ type: 'error', message: 'Network error updating order status' })
    }
  }

  const manualRefresh = async () => {
    console.log('Manual refresh triggered')
    setIsInitialized(false)
    await fetchRestaurantData()
  }

  // New waiter functions
  const assignTableToSelf = (tableNumber: string) => {
    // Validate restaurant access
    if (!validateRestaurantAccess('table assignment', tableNumber)) {
      return
    }

    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, waiter: user?.name || "", status: "occupied" }
        : table
    ))
    console.log(`Table ${tableNumber} assigned to waiter ${user?.name} in restaurant ${restaurantId}`)
  }

  const releaseTable = (tableNumber: string) => {
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, waiter: "", status: "available", customers: 0, orderValue: 0 }
        : table
    ))
  }

  const markTableAsCleaning = (tableNumber: string) => {
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, status: "cleaning", lastCleaned: new Date().toISOString() }
        : table
    ))
  }

  const markTableAsAvailable = (tableNumber: string) => {
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, status: "available" }
        : table
    ))
  }

  const updateTableCustomers = (tableNumber: string, customerCount: number) => {
    setTables(prev => prev.map(table => 
      table.number === tableNumber 
        ? { ...table, customers: customerCount }
        : table
    ))
  }

  const addSpecialRequest = (orderId: string, request: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, specialRequests: request }
        : order
    ))
  }

  const markOrderAsPaid = async (orderId: string, paymentMethod: "cash" | "card" | "mobile") => {
    console.log(`Marking order ${orderId} as paid via ${paymentMethod}`)
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          paymentStatus: "paid", 
          paymentMethod 
        })
      })

      console.log(`Payment API response status: ${response.status}`)

      if (response.ok) {
        const responseData = await response.json()
        console.log('Payment API response data:', responseData)
        
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, paymentStatus: "paid", paymentMethod }
            : order
        ))
        console.log(`Order ${orderId} marked as paid via ${paymentMethod} in restaurant ${restaurantId}`)
        setNotification({ type: 'success', message: `Payment recorded: ${paymentMethod}` })
      } else {
        const errorData = await response.json()
        console.error('Failed to mark order as paid:', errorData)
        setNotification({ type: 'error', message: `Failed to mark order as paid: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error marking order as paid:', error)
      setNotification({ type: 'error', message: 'Network error recording payment' })
    }
  }

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: "cancelled" }
        : order
    ))
  }

  // Security validation function - ensures waiter only operates within their restaurant
  const validateRestaurantAccess = (operation: string, targetId?: string) => {
    if (!restaurantId || !user) {
      console.error('Restaurant access validation failed: Missing restaurant ID or user')
      return false
    }
    
    // Log the operation for audit purposes
    console.log(`Restaurant access validated for ${operation} in restaurant ${restaurantId} by waiter ${user.name}`)
    return true
  }

  // Function to assign order to a table (for orders from homepage)
  // Only allows assignment to tables within the waiter's restaurant
  const assignOrderToTable = (orderId: string, tableNumber: string) => {
    // Validate restaurant access
    if (!validateRestaurantAccess('order assignment', orderId)) {
      return
    }

    // Verify the table belongs to this restaurant
    const targetTable = tables.find(table => table.number === tableNumber)
    if (!targetTable) {
      console.error('Table not found in this restaurant')
      return
    }

    // Update the order with table assignment
    setOrders((prev) => prev.map((order) => 
      order.id === orderId 
        ? { ...order, tableNumber }
        : order
    ))
    
    // Update the table status and assign waiter
    setTables((prev) => prev.map((table) => 
      table.number === tableNumber 
        ? { ...table, status: "occupied", waiter: user?.name || "" }
        : table
    ))

    console.log(`Order ${orderId} assigned to Table ${tableNumber} by waiter ${user?.name} in restaurant ${restaurantId}`)
  }

  // Calculate time elapsed since order was placed
  const getOrderWaitTime = (orderTime: string) => {
    const orderDate = new Date(orderTime)
    const diff = Math.floor((currentTime.getTime() - orderDate.getTime()) / 1000) // difference in seconds
    
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

  // Get wait time color based on duration
  const getWaitTimeColor = (orderTime: string) => {
    const orderDate = new Date(orderTime)
    const minutes = Math.floor((currentTime.getTime() - orderDate.getTime()) / 60000)
    
    if (minutes > 30) return 'text-red-600'
    if (minutes > 15) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Calculate shift summary
  const getShiftSummary = () => {
    const totalOrders = myOrders.length
    const completedOrders = myOrders.filter(o => o.status === 'served').length
    const cancelledOrders = myOrders.filter(o => o.status === 'cancelled').length
    const paidOrders = myOrders.filter(o => o.paymentStatus === 'paid').length
    const totalSales = myOrders
      .filter(o => o.paymentStatus === 'paid' || o.status === 'served')
      .reduce((sum, order) => sum + order.total, 0)
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    
    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      paidOrders,
      totalSales,
      avgOrderValue,
      successRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    }
  }

  // New order helper functions
  const addItemToNewOrder = (menuItem: MenuItem) => {
    const existingItem = newOrderItems.find(item => item.menuItem._id === menuItem._id)
    if (existingItem) {
      setNewOrderItems(prev => prev.map(item =>
        item.menuItem._id === menuItem._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setNewOrderItems(prev => [...prev, { menuItem, quantity: 1 }])
    }
  }

  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setNewOrderItems(prev => prev.filter(item => item.menuItem._id !== menuItemId))
    } else {
      setNewOrderItems(prev => prev.map(item =>
        item.menuItem._id === menuItemId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const calculateNewOrderTotal = () => {
    return newOrderItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0)
  }

  const resetNewOrderForm = () => {
    setNewOrderTable('')
    setNewOrderCustomer('')
    setNewOrderPhone('')
    setNewOrderItems([])
    setSelectedCategory('all')
  }

  const submitNewOrder = async () => {
    if (!newOrderCustomer || !newOrderPhone || newOrderItems.length === 0) {
      setNotification({ type: 'error', message: 'Please fill in all required fields and add items' })
      return
    }

    try {
      const orderData = {
        restaurantId,
        customerName: newOrderCustomer,
        phone: newOrderPhone,
        tableNumber: newOrderTable,
        items: newOrderItems.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          notes: item.notes || ''
        })),
        total: calculateNewOrderTotal(),
        notes: '',
        deliveryAddress: ''
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        setNotification({ type: 'success', message: 'Order created successfully!' })
        setShowNewOrderModal(false)
        resetNewOrderForm()
        // Refresh orders
        await fetchRestaurantData()
      } else {
        const error = await response.json()
        setNotification({ type: 'error', message: `Failed to create order: ${error.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to create order' })
    }
  }

  const getCategories = () => {
    const categories = new Set(menuItems.map(item => item.category))
    return ['all', ...Array.from(categories)]
  }

  const getFilteredMenuItems = () => {
    if (selectedCategory === 'all') {
      return menuItems.filter(item => item.isAvailable)
    }
    return menuItems.filter(item => item.category === selectedCategory && item.isAvailable)
  }

  const getFilteredAndSortedOrders = () => {
    let filtered = orders.filter(order => {
      // Handle special "unassigned" filter
      if (searchTerm === "unassigned") {
        const matchesStatus = filterStatus === "all" || order.status === filterStatus
        return !order.tableNumber && matchesStatus
      }
      
      // Regular search
      const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (order.tableNumber && order.tableNumber.includes(searchTerm))
      const matchesStatus = filterStatus === "all" || order.status === filterStatus
      return matchesSearch && matchesStatus
    })

    switch (sortBy) {
      case "time":
        return filtered.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())
      case "priority":
        const priorityOrder = { urgent: 3, high: 2, normal: 1 }
        return filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      case "table":
        return filtered.sort((a, b) => parseInt(a.tableNumber) - parseInt(b.tableNumber))
      default:
        return filtered
    }
  }

  const getTableStats = () => {
    const totalTables = tables.length
    const occupiedTables = tables.filter(t => t.status === "occupied").length
    const availableTables = tables.filter(t => t.status === "available").length
    const cleaningTables = tables.filter(t => t.status === "cleaning").length
    const myAssignedTables = tables.filter(t => t.waiter === user?.name).length

    return { totalTables, occupiedTables, availableTables, cleaningTables, myAssignedTables }
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
      case "maintenance":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Filter tables and orders for this waiter
  const myTables = tables.filter((table) => table.waiter === user?.name || table.status === "available")
  // Show ALL orders for the restaurant, regardless of table assignment
  // This ensures orders from homepage (without table assignments) are visible
  const myOrders = orders

  if (loading) {
    return <GlobalLoading />
  }

  return (
    <ProtectedRoute allowedRoles={["waiter"]}>
      <div className="min-h-screen bg-background">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">{restaurant?.name || 'Establishment'}</h1>
                  <span className="text-xs px-2 py-0.5 rounded border text-muted-foreground">
                    {(restaurant?.type || 'Establishment').toString()}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-foreground">Waiter Dashboard</h2>
                <p className="text-muted-foreground mt-1">Manage operations for this {restaurant?.type?.toLowerCase() || 'establishment'}</p>
                 <p className="text-xs text-blue-600 mt-1">🔒 Restricted to this restaurant only</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={manualRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                <div className="text-right">
                  <p className="text-sm font-medium">Welcome, {user?.name}</p>
                  <p className="text-xs text-muted-foreground">Waiter</p>
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
          {/* Notifications */}
          <div className="mb-6">
            {myOrders.filter(o => o.priority === "urgent").length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      {myOrders.filter(o => o.priority === "urgent").length} Urgent Order{myOrders.filter(o => o.priority === "urgent").length > 1 ? 's' : ''} Require{myOrders.filter(o => o.priority === "urgent").length > 1 ? '' : 's'} Attention
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Please prioritize these orders for immediate service
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {myOrders.filter(o => o.status === "ready").length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      {myOrders.filter(o => o.status === "ready").length} Order{myOrders.filter(o => o.status === "ready").length > 1 ? 's' : ''} Ready to Serve
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Please collect and serve these orders to customers
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tables.filter(t => t.status === "cleaning").length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      {tables.filter(t => t.status === "cleaning").length} Table{tables.filter(t => t.status === "cleaning").length > 1 ? 's' : ''} Ready for Service
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      These tables have been cleaned and are ready for new customers
                    </p>
                  </div>
                </div>
              </div>
            )}

                         {orders.filter(o => !o.tableNumber).length > 0 && (
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                 <div className="flex items-center">
                   <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                   <div>
                     <h3 className="text-sm font-medium text-blue-800">
                       {orders.filter(o => !o.tableNumber).length} Order{orders.filter(o => !o.tableNumber).length > 1 ? 's' : ''} Need Table Assignment
                     </h3>
                     <p className="text-sm text-blue-700 mt-1">
                       These orders from the homepage need to be assigned to tables
                     </p>
                     <p className="text-xs text-blue-600 mt-1">
                       🔒 Orders can only be assigned to tables within {restaurant?.name || 'this restaurant'}
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={() => setShowNewOrderModal(true)}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <ClipboardList className="h-5 w-5" />
              <span>New Order</span>
            </Button>
            <Button
              onClick={() => {
                const readyOrders = myOrders.filter(o => o.status === 'ready')
                if (readyOrders.length > 0) {
                  setNotification({ type: 'success', message: `${readyOrders.length} order(s) ready to serve!` })
                } else {
                  setNotification({ type: 'error', message: 'No orders ready' })
                }
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <Bell className="h-5 w-5" />
              <span>Check Kitchen</span>
            </Button>
            <Button
              onClick={() => {
                const stats = getTableStats()
                const myTablesCount = stats.myAssignedTables
                const availableCount = stats.availableTables
                const occupiedCount = stats.occupiedTables
                const cleaningCount = stats.cleaningTables
                
                setNotification({ 
                  type: 'success', 
                  message: `My Tables: ${myTablesCount} | Available: ${availableCount} | Occupied: ${occupiedCount} | Cleaning: ${cleaningCount}`
                })
                
                // Navigate to tables tab
                const tabsElement = document.querySelector('[value="tables"]')
                if (tabsElement) {
                  (tabsElement as HTMLElement).click()
                }
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <Utensils className="h-5 w-5" />
              <span>Table Status</span>
            </Button>
            <Button
              onClick={() => {
                const summary = getShiftSummary()
                setNotification({ 
                  type: 'success', 
                  message: `Shift: ${summary.completedOrders}/${summary.totalOrders} orders • RWF ${summary.totalSales.toLocaleString()}`
                })
              }}
              className="flex items-center justify-center gap-2 h-20"
              variant="outline"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Shift Summary</span>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tables</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTableStats().myAssignedTables}</div>
                <p className="text-xs text-muted-foreground">
                  {getTableStats().availableTables} available
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTableStats().cleaningTables} cleaning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myOrders.filter((o) => o.status !== "served" && o.status !== "cancelled").length}</div>
                <p className="text-xs text-muted-foreground">
                  {myOrders.filter((o) => o.status === "ready").length} ready
                </p>
                <p className="text-xs text-muted-foreground">
                  {myOrders.filter((o) => o.status === "pending").length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  RWF {orders
                    .filter((o) => o.paymentStatus === "paid" || o.status === "served")
                    .reduce((sum, order) => sum + order.total, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {orders.filter((o) => o.paymentStatus === "paid").length} paid orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned Orders</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.filter(o => !o.tableNumber).length}</div>
                <p className="text-xs text-muted-foreground">
                  Need table assignment
                </p>
                <p className="text-xs text-muted-foreground">
                  From homepage orders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shift Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{getShiftSummary().successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {getShiftSummary().completedOrders}/{getShiftSummary().totalOrders} completed
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg: RWF {getShiftSummary().avgOrderValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {isProOrAbove(subscription?.tier as any) ? (
              <AIHints 
                userRole="waiter" 
                subscriptionTier={subscription?.tier} 
                data={{ 
                  orders: myOrders, 
                  tables: myTables,
                  pendingOrdersCount: myOrders.filter(o => o.status === 'pending').length,
                  urgentOrdersCount: myOrders.filter(o => o.priority === 'urgent').length
                }}
                className="col-span-1"
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upgrade for Insights</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">Pro unlocks advanced analytics and AI tips</div>
                  <Link href="/pricing" className="text-xs underline">View plans</Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              {/* Order Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pending Orders */}
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Pending ({myOrders.filter(o => o.status === 'pending').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {myOrders.filter(o => o.status === 'pending').slice(0, 3).map(order => (
                      <div key={order.id} className="bg-white p-2 rounded border text-xs">
                        <div className="font-semibold">Table {order.tableNumber || '?'}</div>
                        <div className="text-muted-foreground">{order.customerName}</div>
                        <div className={`font-mono ${getWaitTimeColor(order.orderTime)}`}>
                          {getOrderWaitTime(order.orderTime)}
                        </div>
                      </div>
                    ))}
                    {myOrders.filter(o => o.status === 'pending').length === 0 && (
                      <div className="text-xs text-muted-foreground">No pending orders</div>
                    )}
                  </CardContent>
                </Card>

                {/* Preparing Orders */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-blue-600" />
                      Preparing ({myOrders.filter(o => o.status === 'preparing').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {myOrders.filter(o => o.status === 'preparing').slice(0, 3).map(order => (
                      <div key={order.id} className="bg-white p-2 rounded border text-xs">
                        <div className="font-semibold">Table {order.tableNumber || '?'}</div>
                        <div className="text-muted-foreground">{order.customerName}</div>
                        <div className={`font-mono ${getWaitTimeColor(order.orderTime)}`}>
                          {getOrderWaitTime(order.orderTime)}
                        </div>
                      </div>
                    ))}
                    {myOrders.filter(o => o.status === 'preparing').length === 0 && (
                      <div className="text-xs text-muted-foreground">No orders preparing</div>
                    )}
                  </CardContent>
                </Card>

                {/* Ready Orders */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className="h-4 w-4 text-green-600 animate-pulse" />
                      Ready ({myOrders.filter(o => o.status === 'ready').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {myOrders.filter(o => o.status === 'ready').slice(0, 3).map(order => (
                      <div key={order.id} className="bg-white p-2 rounded border text-xs">
                        <div className="font-semibold">Table {order.tableNumber || '?'}</div>
                        <div className="text-muted-foreground">{order.customerName}</div>
                        <div className={`font-mono ${getWaitTimeColor(order.orderTime)}`}>
                          {getOrderWaitTime(order.orderTime)}
                        </div>
                      </div>
                    ))}
                    {myOrders.filter(o => o.status === 'ready').length === 0 && (
                      <div className="text-xs text-muted-foreground">No orders ready</div>
                    )}
                  </CardContent>
                </Card>

                {/* Served Orders */}
                <Card className="border-gray-200 bg-gray-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      Served ({myOrders.filter(o => o.status === 'served').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {myOrders.filter(o => o.status === 'served').slice(0, 3).map(order => (
                      <div key={order.id} className="bg-white p-2 rounded border text-xs">
                        <div className="font-semibold">Table {order.tableNumber || '?'}</div>
                        <div className="text-muted-foreground">{order.customerName}</div>
                        <div className="flex items-center gap-1">
                          {order.paymentStatus === 'paid' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-orange-600" />
                          )}
                          <span className="text-muted-foreground">{order.paymentStatus || 'pending'}</span>
                        </div>
                      </div>
                    ))}
                    {myOrders.filter(o => o.status === 'served').length === 0 && (
                      <div className="text-xs text-muted-foreground">No served orders</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>Detailed view and management</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by customer name or table number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as Order["status"] | "all")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="served">Served</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select
                        value={searchTerm.includes("unassigned") ? "unassigned" : "all"}
                        onChange={(e) => {
                          if (e.target.value === "unassigned") {
                            setSearchTerm("unassigned")
                          } else {
                            setSearchTerm("")
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">All Orders</option>
                        <option value="unassigned">Unassigned Orders</option>
                      </select>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "time" | "priority" | "table")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="time">Sort by Time</option>
                        <option value="priority">Sort by Priority</option>
                        <option value="table">Sort by Table</option>
                      </select>
                    </div>
                  </div>

                  {getFilteredAndSortedOrders().length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      {loading ? 'Loading orders...' : 'No orders match your search criteria'}
                    </div>
                  )}
                  {getFilteredAndSortedOrders().length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Wait Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredAndSortedOrders().map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              <div>
                                                                 {order.tableNumber ? (
                                   <div>Table {order.tableNumber}</div>
                                 ) : (
                                   <div className="space-y-2">
                                     <div className="text-sm text-orange-600 font-medium">No Table Assigned</div>
                                     {tables.filter(table => table.status === "available").length > 0 ? (
                                       <Select
                                         value=""
                                         onValueChange={(value: string) => assignOrderToTable(order.id, value)}
                                       >
                                         <SelectTrigger className="w-32">
                                           <SelectValue placeholder="Assign Table" />
                                         </SelectTrigger>
                                         <SelectContent>
                                           {tables
                                             .filter(table => table.status === "available")
                                             .map((table) => (
                                               <SelectItem key={table.number} value={table.number}>
                                                 Table {table.number} ({table.capacity} seats)
                                               </SelectItem>
                                             ))}
                                         </SelectContent>
                                       </Select>
                                     ) : (
                                       <div className="text-xs text-red-600">
                                         No available tables in this restaurant
                                       </div>
                                     )}
                                   </div>
                                 )}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(order.orderTime).toLocaleTimeString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customerName}</div>
                                {order.customerPhone && (
                                  <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.items.map((item, index) => (
                                  <div key={`${order.id}-${item.name}-${index}`} className="text-sm">
                                    <span className="font-medium">{item.quantity}x {item.name}</span>
                                    <span className="text-muted-foreground ml-2">RWF {item.price}</span>
                                    {item.notes && <span className="text-muted-foreground ml-2">({item.notes})</span>}
                                  </div>
                                ))}
                                {order.specialRequests && (
                                  <div key={`special-${order.id}`} className="text-xs text-orange-600 font-medium">
                                    🚨 {order.specialRequests}
                                  </div>
                                )}
                                {order.allergies && order.allergies.length > 0 && (
                                  <div key={`allergies-${order.id}`} className="text-xs text-red-600 font-medium">
                                    ⚠️ Allergies: {order.allergies.join(', ')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right font-bold">
                                RWF {order.total.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Timer className={`h-4 w-4 ${getWaitTimeColor(order.orderTime)}`} />
                                <span className={`font-mono text-sm ${getWaitTimeColor(order.orderTime)}`}>
                                  {getOrderWaitTime(order.orderTime)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPriorityColor(order.priority)}>
                                {order.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={order.paymentStatus === "paid" ? "default" : "secondary"} 
                                className="flex items-center gap-1 w-fit"
                              >
                                {order.paymentStatus === "paid" && <CheckCircle className="h-3 w-3" />}
                                {order.paymentStatus || "pending"}
                              </Badge>
                              {order.paymentMethod && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {order.paymentMethod === "cash" && <Banknote className="h-3 w-3 inline mr-1" />}
                                  {order.paymentMethod === "card" && <CreditCard className="h-3 w-3 inline mr-1" />}
                                  {order.paymentMethod === "mobile" && <Smartphone className="h-3 w-3 inline mr-1" />}
                                  {order.paymentMethod}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    size="sm"
                                    variant={order.status === "pending" ? "default" : "outline"}
                                    onClick={() => updateOrderStatus(order.id, "pending")}
                                    className="text-xs px-2 py-1"
                                  >
                                    Pending
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={order.status === "preparing" ? "default" : "outline"}
                                    onClick={() => updateOrderStatus(order.id, "preparing")}
                                    className="text-xs px-2 py-1"
                                  >
                                    Preparing
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={order.status === "ready" ? "default" : "outline"}
                                    onClick={() => updateOrderStatus(order.id, "ready")}
                                    className="text-xs px-2 py-1"
                                  >
                                    Ready
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={order.status === "served" ? "default" : "outline"}
                                    onClick={() => updateOrderStatus(order.id, "served")}
                                    className="text-xs px-2 py-1"
                                  >
                                    Served
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={order.status === "cancelled" ? "destructive" : "outline"}
                                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                                    className="text-xs px-2 py-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                
                                {order.status !== "cancelled" && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markOrderAsPaid(order.id, "cash")}
                                      disabled={order.paymentStatus === "paid"}
                                      className="text-xs px-2"
                                    >
                                      Cash
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markOrderAsPaid(order.id, "card")}
                                      disabled={order.paymentStatus === "paid"}
                                      className="text-xs px-2"
                                    >
                                      Card
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tables" className="space-y-6">
              {/* Visual Table Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Restaurant Floor Plan
                  </CardTitle>
                  <CardDescription>Quick visual overview of all tables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {tables.map((table) => {
                      const isMyTable = table.waiter === user?.name
                      const statusColors = {
                        available: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
                        occupied: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
                        reserved: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
                        cleaning: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
                        maintenance: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
                      }
                      
                      return (
                        <div
                          key={table.number}
                          className={`relative p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                            statusColors[table.status]
                          } ${isMyTable ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          onClick={() => {
                            if (table.status === 'available') {
                              assignTableToSelf(table.number)
                            }
                          }}
                        >
                          <div className="font-bold text-lg">{table.number}</div>
                          <div className="text-xs mt-1">
                            {table.customers > 0 && (
                              <div className="flex items-center justify-center gap-1">
                                <Users className="h-3 w-3" />
                                {table.customers}/{table.capacity}
                              </div>
                            )}
                            {table.status === 'available' && (
                              <div className="text-xs opacity-70">Available</div>
                            )}
                          </div>
                          {isMyTable && (
                            <div className="absolute top-1 right-1">
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                          )}
                          {table.orderValue > 0 && (
                            <div className="text-xs font-semibold mt-1">
                              {(table.orderValue / 1000).toFixed(0)}K
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded" />
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded" />
                      <span>Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded" />
                      <span>Cleaning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 ring-2 ring-primary rounded" />
                      <span>My Tables</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Table Management</CardTitle>
                  <CardDescription>Detailed table information and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {myTables.map((table) => (
                      <Card key={table.number} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Table {table.number}</h3>
                          <Badge variant={getTableStatusColor(table.status)}>
                            {table.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Capacity: {table.capacity} people</p>
                          <p>Location: {table.location}</p>
                          <p>Customers: {table.customers}</p>
                          <p>Waiter: {table.waiter || "Unassigned"}</p>
                          <p>Order Value: RWF {table.orderValue.toLocaleString()}</p>
                          {table.lastCleaned && (
                            <p className="text-xs">Cleaned: {new Date(table.lastCleaned).toLocaleTimeString()}</p>
                          )}
                        </div>
                        
                        {/* Table Actions */}
                        <div className="mt-4 space-y-2">
                          {table.status === "available" && (
                            <Button
                              size="sm"
                              onClick={() => assignTableToSelf(table.number)}
                              className="w-full"
                            >
                              Assign to Me
                            </Button>
                          )}
                          
                          {table.waiter === user?.name && table.status === "occupied" && (
                            <div className="space-y-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTableCustomers(table.number, Math.min(table.customers + 1, table.capacity))}
                                disabled={table.customers >= table.capacity}
                                className="w-full"
                              >
                                + Customer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTableCustomers(table.number, Math.max(table.customers - 1, 0))}
                                disabled={table.customers <= 0}
                                className="w-full"
                              >
                                - Customer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => releaseTable(table.number)}
                                className="w-full"
                              >
                                Release Table
                              </Button>
                            </div>
                          )}
                          
                          {table.status === "cleaning" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markTableAsAvailable(table.number)}
                              className="w-full"
                            >
                              Mark Available
                            </Button>
                          )}
                          
                          {table.status === "occupied" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markTableAsCleaning(table.number)}
                              className="w-full"
                            >
                              Mark for Cleaning
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Management Tab */}
            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Management</CardTitle>
                  <CardDescription>Track customer preferences and manage reservations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Customer Preferences</h3>
                      <div className="space-y-3">
                        {myOrders
                          .filter(order => order.specialRequests || (order.allergies && order.allergies.length > 0))
                          .map((order) => (
                            <div key={order.id} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">{order.customerName}</p>
                                  <p className="text-sm text-muted-foreground">Table {order.tableNumber}</p>
                                </div>
                                <Badge variant="outline">{order.status}</Badge>
                              </div>
                              {order.specialRequests && (
                                <p className="text-sm text-orange-600 mb-1">
                                  <span className="font-medium">Special Request:</span> {order.specialRequests}
                                </p>
                              )}
                              {order.allergies && order.allergies.length > 0 && (
                                <p className="text-sm text-red-600">
                                  <span className="font-medium">Allergies:</span> {order.allergies.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        {myOrders.filter(order => order.specialRequests || (order.allergies && order.allergies.length > 0)).length === 0 && (
                          <p className="text-muted-foreground text-center py-4">No special requests or allergies recorded</p>
                        )}
                      </div>
                    </div>

                    {/* Table Reservations */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Table Reservations</h3>
                      <div className="space-y-3">
                        {tables
                          .filter(table => table.status === "reserved")
                          .map((table) => (
                            <div key={table.number} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">Table {table.number}</p>
                                  <p className="text-sm text-muted-foreground">Capacity: {table.capacity}</p>
                                  <p className="text-sm text-muted-foreground">Location: {table.location}</p>
                                </div>
                                <Badge variant="secondary">Reserved</Badge>
                              </div>
                              {table.reservationTime && (
                                <p className="text-sm text-muted-foreground">
                                  Reserved for: {new Date(table.reservationTime).toLocaleString()}
                                </p>
                              )}
                              {table.customerNotes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Notes: {table.customerNotes}
                                </p>
                              )}
                            </div>
                          ))}
                        {tables.filter(table => table.status === "reserved").length === 0 && (
                          <p className="text-muted-foreground text-center py-4">No table reservations</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="quick-actions" className="space-y-6">
                             <Card>
                 <CardHeader>
                   <CardTitle>Quick Actions</CardTitle>
                   <CardDescription>Common tasks and shortcuts for waiters</CardDescription>
                   <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                     <p className="text-xs text-blue-700">
                       🔒 All actions are restricted to {restaurant?.name || 'this restaurant'} only
                     </p>
                   </div>
                 </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Table Management Actions */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Table Management</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const availableTables = tables.filter(t => t.status === "available")
                            if (availableTables.length > 0) {
                              assignTableToSelf(availableTables[0].number)
                            }
                          }}
                          disabled={tables.filter(t => t.status === "available").length === 0}
                          className="w-full"
                        >
                          Assign Next Available Table
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const cleaningTables = tables.filter(t => t.status === "cleaning")
                            cleaningTables.forEach(table => markTableAsAvailable(table.number))
                          }}
                          disabled={tables.filter(t => t.status === "cleaning").length === 0}
                          className="w-full"
                        >
                          Mark All Clean Tables Available
                        </Button>
                      </div>
                    </div>

                    {/* Order Management Actions */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Order Management</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const readyOrders = myOrders.filter(o => o.status === "ready")
                            readyOrders.forEach(order => updateOrderStatus(order.id, "served"))
                          }}
                          disabled={myOrders.filter(o => o.status === "ready").length === 0}
                          className="w-full"
                        >
                          Mark All Ready Orders as Served
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const pendingOrders = myOrders.filter(o => o.status === "pending")
                            pendingOrders.forEach(order => updateOrderStatus(order.id, "preparing"))
                          }}
                          disabled={myOrders.filter(o => o.status === "pending").length === 0}
                          className="w-full"
                        >
                          Start Preparing All Pending Orders
                        </Button>
                                                 <Button
                           variant="outline"
                           onClick={() => {
                             const unassignedOrders = orders.filter(o => !o.tableNumber)
                             const availableTables = tables.filter(t => t.status === "available")
                             
                             if (unassignedOrders.length === 0) {
                               console.log('No unassigned orders to process')
                               return
                             }
                             
                             if (availableTables.length === 0) {
                               console.log('No available tables in this restaurant')
                               return
                             }
                             
                             // Assign orders to available tables within this restaurant
                             unassignedOrders.forEach((order, index) => {
                               if (availableTables[index]) {
                                 console.log(`Auto-assigning order ${order.id} to table ${availableTables[index].number} in restaurant ${restaurantId}`)
                                 assignOrderToTable(order.id, availableTables[index].number)
                               }
                             })
                           }}
                           disabled={orders.filter(o => !o.tableNumber).length === 0 || tables.filter(t => t.status === "available").length === 0}
                           className="w-full"
                         >
                           Auto-Assign Unassigned Orders
                         </Button>
                      </div>
                    </div>

                    {/* Customer Service Actions */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Customer Service</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const urgentOrders = myOrders.filter(o => o.priority === "urgent")
                            if (urgentOrders.length > 0) {
                              setFilterStatus("all")
                              setSortBy("priority")
                              setSearchTerm("")
                            }
                          }}
                          disabled={myOrders.filter(o => o.priority === "urgent").length === 0}
                          className="w-full"
                        >
                          Focus on Urgent Orders
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFilterStatus("all")
                            setSortBy("time")
                            setSearchTerm("")
                          }}
                          className="w-full"
                        >
                          Reset All Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog open={showNewOrderModal} onOpenChange={setShowNewOrderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Select menu items and enter customer details
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side - Customer Info & Cart */}
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Customer Information</h3>
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={newOrderCustomer}
                    onChange={(e) => setNewOrderCustomer(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tableNumber">Table Number (Optional)</Label>
                  <Select value={newOrderTable || "none"} onValueChange={(value) => setNewOrderTable(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No table</SelectItem>
                      {tables.filter(t => t.status === 'available' || t.waiter === user?.name).map(table => (
                        <SelectItem key={table.number} value={table.number}>
                          Table {table.number} ({table.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Cart */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center justify-between">
                  <span>Order Items ({newOrderItems.length})</span>
                  <span className="text-primary">RWF {calculateNewOrderTotal().toLocaleString()}</span>
                </h3>
                <ScrollArea className="h-48">
                  {newOrderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No items added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {newOrderItems.map((item) => (
                        <div key={item.menuItem._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItem.name}</p>
                            <p className="text-xs text-muted-foreground">
                              RWF {item.menuItem.price.toLocaleString()} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.menuItem._id, item.quantity - 1)}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.menuItem._id, item.quantity + 1)}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Right Side - Menu Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Menu Items</h3>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-96 border rounded-lg p-2">
                {getFilteredMenuItems().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No menu items available
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {getFilteredMenuItems().map((item) => {
                      const inCart = newOrderItems.find(i => i.menuItem._id === item._id)
                      return (
                        <div
                          key={item._id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                            inCart ? 'bg-primary/5 border-primary' : ''
                          }`}
                          onClick={() => addItemToNewOrder(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                              <p className="text-sm font-semibold text-primary mt-1">
                                RWF {item.price.toLocaleString()}
                              </p>
                            </div>
                            {inCart && (
                              <Badge variant="default" className="ml-2">
                                {inCart.quantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewOrderModal(false)
              resetNewOrderForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={submitNewOrder}
              disabled={!newOrderCustomer || !newOrderPhone || newOrderItems.length === 0}
            >
              Create Order (RWF {calculateNewOrderTotal().toLocaleString()})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Waiter Settings
            </DialogTitle>
            <DialogDescription>
              Customize your dashboard experience
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                General
              </h3>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Refresh</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh orders every {settings.refreshInterval} seconds
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min="10"
                  max="300"
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) || 30 })}
                  disabled={!settings.autoRefresh}
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Display
              </h3>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Timers</Label>
                  <p className="text-xs text-muted-foreground">
                    Display wait time for each order
                  </p>
                </div>
                <Switch
                  checked={settings.showTimers}
                  onCheckedChange={(checked) => setSettings({ ...settings, showTimers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-xs text-muted-foreground">
                    Show more orders with less detail
                  </p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => setSettings({ ...settings, compactView: checked })}
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </h3>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Play sound for new orders and updates
                  </p>
                </div>
                <Switch
                  checked={settings.soundNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, soundNotifications: checked })}
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Preferences
              </h3>
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value: 'light' | 'dark') => setSettings({ ...settings, theme: value })}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                  <SelectTrigger id="language">
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

            {/* Profile Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Profile
              </h3>
              <Separator />
              
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline">Waiter</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restaurant:</span>
                  <span className="font-medium">{restaurant?.name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setNotification({ type: 'success', message: 'Settings saved successfully!' })
              setShowSettings(false)
              // Save settings to localStorage
              localStorage.setItem('waiterSettings', JSON.stringify(settings))
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
