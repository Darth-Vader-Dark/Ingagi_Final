"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, Store, Menu, Award, Plus, Edit, Trash2, Settings, LogOut, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Star, Image, Tag, DollarSign, Calendar, 
  Clock, MapPin, Phone, Mail, Globe, Palette, Eye, ShoppingCart, TrendingUp,
  UserX, QrCode, Download, Copy, Briefcase, UserCheck, Receipt, FileText,
  TrendingDown, PieChart, CreditCard, Wallet, FileSpreadsheet, Calculator,
  Building2, Users2, ClipboardList
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { isProOrAbove, isEnterprise, hasFeature } from "@/lib/subscription-access"
import { GlobalLoading } from "@/components/global-loading"
import { AIHints } from "@/components/ai-hints"

interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  image?: string
  preparationTime?: number
  allergens?: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  tags?: string[]
  isPromotional?: boolean
  promotionalPrice?: number
  promotionalEndDate?: Date
}

interface Employee {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  status: "active" | "inactive" | "suspended"
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

interface RestaurantInfo {
  _id: string
  name: string
  description: string
  type?: 'restaurant' | 'cafe' | 'hotel'
  cuisine?: string
  priceRange?: string
  location?: string
  hours?: string
  logo?: string
  banner?: string
  rating?: number
  reviewCount?: number
  amenities?: string[]
  contact: {
    phone: string
    address: string
    email?: string
  }
}

interface Promotion {
  _id: string
  name: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: Date
  endDate: Date
  applicableItems: string[] // Menu item IDs
  minimumOrderAmount?: number
  maxUses?: number
  currentUses: number
  isActive: boolean
}

interface QRCode {
  _id: string
  name: string
  type: string
  url: string
  image?: string
  restaurantId: string
  isActive: boolean
  createdAt: Date
  scanCount?: number
  lastScanned?: Date
}

interface Order {
  _id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  items: Array<{
    menuItemId: string
    name: string
    quantity: number
    price: number
    specialInstructions?: string
  }>
  totalAmount: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  orderDate: Date
  estimatedDeliveryTime?: Date
  paymentMethod: string
  paymentStatus: "pending" | "paid" | "failed"
  deliveryAddress?: string
  tableNumber?: string
}

interface Subscription {
  tier: "core" | "pro" | "enterprise"
  status: "active" | "expired" | "cancelled" | "trial"
  limits: {
    employees: number
    menuItems: number
    orders: number
    analytics: boolean
    aiFeatures: boolean
    whiteLabel: boolean
    customDomain: boolean
    prioritySupport: boolean
  }
  features: string[]
  startDate: Date
  endDate: Date
  autoRenew: boolean
}

// HR Interfaces
interface Attendance {
  _id: string
  employeeId: string
  employeeName: string
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: "present" | "absent" | "late" | "half-day" | "on-leave"
  workHours?: number
  notes?: string
}

interface LeaveRequest {
  _id: string
  employeeId: string
  employeeName: string
  leaveType: "sick" | "vacation" | "personal" | "emergency"
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: "pending" | "approved" | "rejected"
  appliedDate: Date
  approvedBy?: string
  approvedDate?: Date
}

interface Payroll {
  _id: string
  employeeId: string
  employeeName: string
  month: string
  year: number
  baseSalary: number
  bonuses: number
  deductions: number
  netSalary: number
  workDays: number
  overtimeHours: number
  overtimePay: number
  status: "draft" | "processed" | "paid"
  paymentDate?: Date
  paymentMethod?: string
}

// Accounting Interfaces
interface Expense {
  _id: string
  category: string
  description: string
  amount: number
  date: Date
  vendor?: string
  paymentMethod: string
  receipt?: string
  approvedBy?: string
  status: "pending" | "approved" | "paid"
  notes?: string
}

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerEmail?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue"
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  notes?: string
}

interface FinancialReport {
  revenue: number
  expenses: number
  profit: number
  profitMargin: number
  topExpenseCategories: Array<{
    category: string
    amount: number
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
}

export default function ManagerDashboard() {
  const { user, logout } = useAuth()
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>({
    tier: "core",
    status: "active",
    limits: {
      employees: 5,
      menuItems: 50,
      orders: 1000,
      analytics: true,
      aiFeatures: false,
      whiteLabel: false,
      customDomain: false,
      prioritySupport: false
    },
    features: [
      "Basic menu management",
      "QR code generation",
      "Employee management (up to 5)",
      "Basic analytics"
    ],
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    autoRenew: true
  })
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [salesData, setSalesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Dialog states
  const [showAddMenuItem, setShowAddMenuItem] = useState(false)
  const [showAddPromotion, setShowAddPromotion] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showRestaurantSettings, setShowRestaurantSettings] = useState(false)
  const [showSubscriptionUpgrade, setShowSubscriptionUpgrade] = useState(false)
  
  // Employee management dialogs
  const [showEmployeeActions, setShowEmployeeActions] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [showSetSalary, setShowSetSalary] = useState(false)
  const [salaryAmount, setSalaryAmount] = useState('')
  
  // Form states
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    allergens: '',
    tags: '',
    image: ''
  })
  
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    startDate: '',
    endDate: '',
    minimumOrderAmount: '',
    maxUses: '',
    applicableItems: [] as string[]
  })
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'waiter' as 'waiter' | 'kitchen' | 'receptionist' | 'inventory',
    phone: '',
    password: ''
  })

  const [showNewQRCodeModal, setShowNewQRCodeModal] = useState(false)
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [newQRCode, setNewQRCode] = useState({
    name: '',
    type: 'menu',
    url: '',
    roomNumber: '' as string
  })

  // HR State
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([])
  const [showAddAttendance, setShowAddAttendance] = useState(false)
  const [showLeaveRequestDialog, setShowLeaveRequestDialog] = useState(false)
  const [showPayrollDialog, setShowPayrollDialog] = useState(false)
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null)

  // Accounting State
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddInvoice, setShowAddInvoice] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    vendor: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerEmail: '',
    items: [] as Array<{ description: string; quantity: number; unitPrice: number }>,
    tax: '18',
    dueDate: '',
    notes: ''
  })

  // Define fetchSalesData function
  const fetchSalesData = async () => {
    if (!user?.restaurantId) return

    try {
      console.log('Fetching sales data for restaurant:', user.restaurantId)
      const response = await fetch(`/api/restaurant/${user.restaurantId}/sales?period=today`)
      console.log('Sales API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Sales API response data:', data)
        if (data.success) {
          setSalesData(data.sales)
          console.log('Sales data updated:', data.sales)
        } else {
          console.error('Sales API returned success:false', data)
        }
      } else {
        console.error('Sales API returned non-OK status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
    }
  }

  // Create ref to store the function
  const fetchSalesDataRef = useRef(fetchSalesData)
  fetchSalesDataRef.current = fetchSalesData

  // Auto-refresh sales data every 30 seconds
  useEffect(() => {
    if (!user?.restaurantId) return

    // Initial fetch
    fetchSalesData()

    const interval = setInterval(() => {
      fetchSalesData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId])

  // Define fetchRestaurantData function
  const fetchRestaurantData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (user?.restaurantId) {
        // First, test basic API connectivity
        try {
          const testResponse = await fetch('/api/test')
          if (testResponse.ok) {
            // API connectivity OK
          } else {
            setError("API server is not responding. Please check your connection.")
            setLoading(false)
            return
          }
        } catch (error) {
          setError("Cannot connect to API server. Please check your connection.")
          setLoading(false)
          return
        }

        // Create a timeout promise - increased to 15 seconds for better reliability
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 15000) // 15 second timeout
        })

        // Fetch restaurant info with timeout
        try {
          const restaurantPromise = fetch(`/api/restaurant/${user.restaurantId}`)
          const restaurantResponse = await Promise.race([restaurantPromise, timeoutPromise]) as Response
          
          if (restaurantResponse.ok) {
            const restaurantData = await restaurantResponse.json()
            console.log('Restaurant data received:', restaurantData.restaurant)
            console.log('Amenities in data:', restaurantData.restaurant?.amenities)
            console.log('Amenities type:', typeof restaurantData.restaurant?.amenities)
            console.log('Amenities is array:', Array.isArray(restaurantData.restaurant?.amenities))
            
            // Ensure amenities is always an array
            const restaurantWithAmenities = {
              ...restaurantData.restaurant,
              amenities: Array.isArray(restaurantData.restaurant?.amenities) 
                ? restaurantData.restaurant.amenities 
                : []
            }
            console.log('Restaurant with amenities:', restaurantWithAmenities)
            setRestaurantInfo(restaurantWithAmenities)
          } else {
            const errorData = await restaurantResponse.json()
            setError(`Failed to load restaurant: ${errorData.error || 'Unknown error'}`)
            // Don't stop here, continue with other requests
          }
        } catch (error) {
          setError(`Restaurant API failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          // Don't stop here, continue with other requests
        }
        
        // Fetch menu items with timeout
        try {
          const menuPromise = fetch(`/api/restaurant/${user.restaurantId}/menu`)
          const menuResponse = await Promise.race([menuPromise, timeoutPromise]) as Response
          
          if (menuResponse.ok) {
            const menuData = await menuResponse.json()
            setMenuItems(menuData.menuItems || [])
          } else {
            const errorData = await menuResponse.json()
            // Menu API error, continue with other requests
          }
        } catch (error) {
          // Menu API timeout/error, continue with other requests
        }
        
        // Fetch employees with timeout
        try {
          const employeesPromise = fetch(`/api/restaurant/${user.restaurantId}/employees`)
          const employeesResponse = await Promise.race([employeesPromise, timeoutPromise]) as Response
          
          if (employeesResponse.ok) {
            const employeesData = await employeesResponse.json()
            setEmployees(employeesData.employees || [])
          } else {
            const errorData = await employeesResponse.json()
            // Employees API error, continue with other requests
          }
        } catch (error) {
          // Employees API timeout/error, continue with other requests
        }
        
        // Fetch subscription with timeout

        try {
          const subscriptionPromise = fetch(`/api/restaurant/${user.restaurantId}/subscription`)
          const subscriptionResponse = await Promise.race([subscriptionPromise, timeoutPromise]) as Response


          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json()

            if (subscriptionData.subscription) {
              setSubscription(subscriptionData.subscription)

            } else {
              // No subscription data in response, keeping default
            }
          } else {
            const errorData = await subscriptionResponse.json()


          }
        } catch (error) {


          // Continue with other requests
        }

        // Fetch promotions with timeout

        try {
          const promotionsPromise = fetch(`/api/restaurant/${user.restaurantId}/promotions`)
          const promotionsResponse = await Promise.race([promotionsPromise, timeoutPromise]) as Response

          if (promotionsResponse.ok) {
            const promotionsData = await promotionsResponse.json()
            setPromotions(promotionsData.promotions || [])
          }
        } catch (error) {

          // Continue with other requests
        }

        // Fetch orders with timeout

        try {
          const ordersPromise = fetch(`/api/restaurant/${user.restaurantId}/orders`)
          const ordersResponse = await Promise.race([ordersPromise, timeoutPromise]) as Response

          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json()
            setOrders(ordersData.orders || [])
          }
        } catch (error) {

          // Continue with other requests
        }

        // Fetch QR codes with timeout
        try {
          const qrCodesPromise = fetch(`/api/restaurant/${user.restaurantId}/qr-codes`)
          const qrCodesResponse = await Promise.race([qrCodesPromise, timeoutPromise]) as Response

          if (qrCodesResponse.ok) {
            const qrCodesData = await qrCodesResponse.json()
            setQrCodes(qrCodesData.qrCodes || [])
          }
        } catch (error) {
          // QR codes API timeout/error, continue with other requests
        }

        setLoading(false)

        
        // Show success message if we got some data
        if (restaurantInfo || employees.length > 0 || menuItems.length > 0) {
          setNotification({ type: 'success', message: 'Dashboard data loaded successfully!' })
        }
      }
    } catch (error) {

      setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  // Create ref to store the function
  const fetchRestaurantDataRef = useRef(fetchRestaurantData)
  fetchRestaurantDataRef.current = fetchRestaurantData

  useEffect(() => {
    if (user && !user.restaurantId) {
      logout()
      return
    }
  }, [user, logout])

  // Initial data fetch
  useEffect(() => {
    if (user?.restaurantId) {
      fetchRestaurantData()
      fetchSalesData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId])

  const canAddEmployee = () => {
    // If no subscription data, allow adding employees (fallback to reasonable limit)
    if (!subscription) return employees.length < 10 // Default limit
    return employees.length < subscription.limits.employees
  }

  const canAddMenuItem = () => {
    if (!subscription) return false
    return menuItems.length < subscription.limits.menuItems
  }

  const addMenuItem = async () => {
    try {
      const response = await fetch(`/api/restaurant/${user?.restaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMenuItem,
          price: parseFloat(newMenuItem.price),
          preparationTime: newMenuItem.preparationTime ? parseInt(newMenuItem.preparationTime) : undefined,
          allergens: newMenuItem.allergens ? newMenuItem.allergens.split(',').map(a => a.trim()) : [],
          tags: newMenuItem.tags ? newMenuItem.tags.split(',').map(t => t.trim()) : []
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMenuItems([...menuItems, data.menuItem])
        setShowAddMenuItem(false)
        setNewMenuItem({
          name: '', description: '', price: '', category: '', preparationTime: '', allergens: '', tags: '', image: ''
        })
        setNotification({ type: 'success', message: 'Menu item added successfully!' })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to add menu item' })
    }
  }

  const addPromotion = async () => {
    try {
      const response = await fetch(`/api/restaurant/${user?.restaurantId}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPromotion,
          discountValue: parseFloat(newPromotion.discountValue),
          minimumOrderAmount: newPromotion.minimumOrderAmount ? parseFloat(newPromotion.minimumOrderAmount) : undefined,
          maxUses: newPromotion.maxUses ? parseInt(newPromotion.maxUses) : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPromotions([...promotions, data.promotion])
        setShowAddPromotion(false)
        setNewPromotion({
          name: '', description: '', discountType: 'percentage', discountValue: '', startDate: '', endDate: '', minimumOrderAmount: '', maxUses: '', applicableItems: []
        })
        setNotification({ type: 'success', message: 'Promotion added successfully!' })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to add promotion' })
    }
  }

  const addEmployee = async () => {
    // Validate required fields
    if (!newEmployee.name || !newEmployee.email || !newEmployee.role || !newEmployee.password) {
      setNotification({ type: 'error', message: 'Please fill in all required fields (name, email, role, and password)' })
      return
    }

    // Validate password length
    if (newEmployee.password.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters long' })
      return
    }

    try {
      const response = await fetch(`/api/restaurant/${user?.restaurantId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees([...employees, data.employee])
        setShowAddEmployee(false)
        setNewEmployee({ name: '', email: '', role: 'waiter', phone: '', password: '' })
        setNotification({ 
          type: 'success', 
          message: `Employee ${newEmployee.name} added successfully! They can now log in at the login page using email: ${newEmployee.email}` 
        })
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: `Failed to add employee: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to add employee' })
    }
  }

  const addQRCode = async () => {
    try {
      // Generate the URL for the QR code
      const baseUrl = window.location.origin
      let qrUrl = `${baseUrl}/restaurant/${user?.restaurantId}`
      if (newQRCode.type === 'room-service') {
        const roomParam = newQRCode.roomNumber ? `?room=${encodeURIComponent(newQRCode.roomNumber)}` : ''
        qrUrl = `${baseUrl}/guest/${user?.restaurantId}/room-service${roomParam}`
      } else if (newQRCode.type === 'rooms') {
        qrUrl = `${baseUrl}/guest/${user?.restaurantId}/rooms`
      } else if (newQRCode.type === 'attached-menu') {
        qrUrl = `${baseUrl}/guest/${user?.restaurantId}/menu`
      }
      
      // First generate the actual QR code image
      const qrResponse = await fetch('/api/qr-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: qrUrl, size: 200 })
      })
      
      if (!qrResponse.ok) {
        setNotification({ type: 'error', message: 'Failed to generate QR code image' })
        return
      }
      
      const qrData = await qrResponse.json()
      
      // Now save the QR code with the generated image
      const response = await fetch(`/api/restaurant/${user?.restaurantId}/qr-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQRCode,
          url: qrUrl,
          image: qrData.qrCode
        })
      })

      if (response.ok) {
        const data = await response.json()
        const qrCode = data.qrCode
        
        // Generate QR code with tracking parameter
          const trackingUrl = `${qrUrl}?qr=${qrCode._id}`
        const trackingQrResponse = await fetch('/api/qr-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trackingUrl, size: 200 })
        })
        
        if (trackingQrResponse.ok) {
          const trackingQrData = await trackingQrResponse.json()
          
          // Update the QR code with the tracking image
          await fetch(`/api/restaurant/${user?.restaurantId}/qr-codes/${qrCode._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: trackingQrData.qrCode,
              url: trackingUrl
            })
          })
          
          // Update local state with the final QR code
          const finalQrCode = { ...qrCode, image: trackingQrData.qrCode, url: trackingUrl }
          setQrCodes([...qrCodes, finalQrCode])
        } else {
          // Fallback to original QR code
          setQrCodes([...qrCodes, qrCode])
        }
        
        setShowNewQRCodeModal(false)
        setNewQRCode({ name: '', type: 'menu', url: '' })
        setNotification({ type: 'success', message: 'QR Code generated successfully!' })
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: `Failed to generate QR code: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to generate QR code' })
    }
  }

  const deleteQRCode = async (qrCodeId: string) => {
    try {
      const response = await fetch(`/api/restaurant/${user?.restaurantId}/qr-codes/${qrCodeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setQrCodes(qrCodes.filter(qr => qr._id !== qrCodeId))
        setNotification({ type: 'success', message: 'QR Code deleted successfully!' })
      } else {
        setNotification({ type: 'error', message: 'Failed to delete QR code' })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete QR code' })
    }
  }

  const toggleQRCodeStatus = async (qrCodeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/restaurant/${user?.restaurantId}/qr-codes/${qrCodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setQrCodes(qrCodes.map(qr => 
          qr._id === qrCodeId ? { ...qr, isActive } : qr
        ))
        setNotification({ 
          type: 'success', 
          message: `QR Code ${isActive ? 'activated' : 'deactivated'} successfully!` 
        })
      } else {
        setNotification({ type: 'error', message: 'Failed to update QR code status' })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update QR code status' })
    }
  }

  const requestSubscriptionUpgrade = async (newTier: string) => {
    try {
      const response = await fetch('/api/admin/subscription-upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: user?.restaurantId,
          currentTier: subscription?.tier,
          requestedTier: newTier,
          reason: 'Business growth and feature requirements'
        })
      })

      if (response.ok) {
        setNotification({ type: 'success', message: 'Upgrade request sent to admin!' })
        setShowSubscriptionUpgrade(false)
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to send upgrade request' })
    }
  }

  const saveRestaurantSettings = async () => {
    if (!restaurantInfo || !user?.restaurantId) {
      setNotification({ type: 'error', message: 'No restaurant information to save' })
      return
    }

    try {
      setLoading(true)
      
      // Prepare the data to save
      const updateData = {
        name: restaurantInfo.name,
        description: restaurantInfo.description,
        type: restaurantInfo.type,
        cuisine: restaurantInfo.cuisine,
        priceRange: restaurantInfo.priceRange,
        location: restaurantInfo.location,
        hours: restaurantInfo.hours,
        logo: restaurantInfo.logo,
        banner: restaurantInfo.banner,
        rating: restaurantInfo.rating,
        reviewCount: restaurantInfo.reviewCount,
        amenities: restaurantInfo.amenities,
        contact: {
          phone: restaurantInfo.contact.phone,
          address: restaurantInfo.contact.address,
          email: restaurantInfo.contact.email
        }
      }
      
      console.log('Saving restaurant data:', updateData)
      console.log('Amenities being saved:', updateData.amenities)

      const response = await fetch(`/api/restaurant/${user.restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setNotification({ type: 'success', message: 'Restaurant settings saved successfully! Changes will be reflected across the platform.' })
        setShowRestaurantSettings(false)
        
        // Refresh restaurant data to show updated information
        fetchRestaurantData()
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: `Failed to save settings: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save restaurant settings' })
    } finally {
      setLoading(false)
    }
  }

  // Employee Management Functions
  const openEmployeeActions = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEmployeeActions(true)
  }

  const resetEmployeePassword = async () => {
    if (!selectedEmployee || !user?.restaurantId) return

    try {
      const requestBody = { 
        employeeId: selectedEmployee._id,
        action: 'resetPassword'
      }

      const response = await fetch(`/api/restaurant/${user.restaurantId}/employees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        setNotification({ 
          type: 'success', 
          message: `Password reset successfully! New password: ${data.newPassword}` 
        })
        setShowResetPassword(false)
        setShowEmployeeActions(false)
        setSelectedEmployee(null)
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: `Failed to reset password: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to reset password' })
    }
  }

  const deactivateEmployee = async () => {
    if (!selectedEmployee || !user?.restaurantId) return

    try {
      const requestBody = { 
        employeeId: selectedEmployee._id,
        isActive: false
        // status will be automatically set to 'inactive' by the API
      }

      const response = await fetch(`/api/restaurant/${user.restaurantId}/employees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        setNotification({ type: 'success', message: 'Employee deactivated successfully!' })
        setShowDeactivateConfirm(false)
        setShowEmployeeActions(false)
        setSelectedEmployee(null)
        
        // Update local state
        setEmployees(employees.map(emp => 
          emp._id === selectedEmployee._id 
            ? { ...emp, isActive: false, status: 'inactive' }
            : emp
        ))
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: `Failed to deactivate employee: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to deactivate employee' })
    }
  }

  const openSetSalary = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSalaryAmount('')
    setShowSetSalary(true)
  }

  const saveSalary = async () => {
    if (!selectedEmployee) return
    const amount = Number(salaryAmount)
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'Enter a valid salary amount' })
      return
    }
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee._id, baseSalary: amount, currency: 'RWF' })
      })
      if (!res.ok) throw new Error('Failed')
      setNotification({ type: 'success', message: 'Salary updated' })
      setShowSetSalary(false)
      setSelectedEmployee(null)
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to update salary' })
    }
  }

  const deleteEmployee = async () => {
    if (!selectedEmployee || !user?.restaurantId) return

    try {
      const requestBody = { 
        employeeId: selectedEmployee._id
      }

      const response = await fetch(`/api/restaurant/${user.restaurantId}/employees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        setNotification({ type: 'success', message: 'Employee deleted successfully!' })
        setShowDeleteConfirm(false)
        setShowEmployeeActions(false)
        setSelectedEmployee(null)
        
        // Remove from local state
        setEmployees(employees.filter(emp => emp._id !== selectedEmployee._id))
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: `Failed to delete employee: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete employee' })
    }
  }

  const handleLogout = () => {
    logout()
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Auto-dismiss any notification regardless of how it was set
  useEffect(() => {
    if (!notification) return
    const timeoutId = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(timeoutId)
  }, [notification])

  if (loading) {
    return <GlobalLoading />
  }

  if (!user?.restaurantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have access to any restaurant dashboard.</p>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={fetchRestaurantData} className="w-full">Retry</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="w-full"
            >
              Clear Session & Reload
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurantInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load restaurant information.</p>
          <Button onClick={fetchRestaurantData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
                <p className="text-muted-foreground mt-1">{(user as any)?.establishmentName || restaurantInfo?.name || 'Establishment'} • {(user as any)?.establishmentType || restaurantInfo?.type || 'Establishment'}</p>
              </div>
              <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">Welcome, {user?.name}</p>
                  <p className="text-xs text-muted-foreground">Restaurant Manager</p>
                  <p className="text-sm font-semibold text-primary">{restaurantInfo.name}</p>
                </div>

                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button variant="outline" size="sm" onClick={fetchRestaurantData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`p-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{notification.message}</span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Message */}
          <div className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Welcome to Ingagi!</h2>
              <p className="text-lg text-foreground mb-2">
                Your restaurant <span className="font-semibold">{restaurantInfo.name}</span> is ready for management.
              </p>
              <p className="text-muted-foreground">
                Manage your menu, employees, and restaurant operations from this dashboard.
              </p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-700">{error}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setError("")}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Restaurant</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurantInfo.name}</div>
                <p className="text-xs text-muted-foreground">
                  {restaurantInfo.contact?.address || "Address loading..."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                <Menu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {menuItems.length}
                  {subscription && (
                    <span className="text-sm text-muted-foreground ml-1">
                      /{subscription.limits.menuItems}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {canAddMenuItem() ? "Items available" : "Item limit reached"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.length}
                  {subscription && (
                    <span className="text-sm text-muted-foreground ml-1">
                      /{subscription.limits.employees}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {canAddEmployee() ? "Staff available" : "Employee limit reached"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {subscription?.tier || "Core"}
                </div>
                <p className="text-xs text-muted-foreground">Current Plan</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Hints Section */}
          <div className="mb-8">
            <AIHints 
              userRole="manager" 
              subscriptionTier={subscription?.tier} 
              data={{ 
                restaurantInfo, 
                menuItems, 
                employees, 
                qrCodes,
                subscription 
              }}
              className="w-full"
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="promotions">Promotions</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="hr">HR Management</TabsTrigger>
              <TabsTrigger value="accounting">Accounting</TabsTrigger>
              <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Overview</CardTitle>
                  <CardDescription>Quick summary of your restaurant status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Restaurant Information</h3>
                      <div className="space-y-2">
                        <p><strong>Name:</strong> {restaurantInfo.name}</p>
                        <p><strong>Description:</strong> {restaurantInfo.description}</p>
                        <p><strong>Phone:</strong> {restaurantInfo.contact?.phone || "Not set"}</p>
                        <p><strong>Address:</strong> {restaurantInfo.contact?.address || "Not set"}</p>
                      </div>
                    </div>
                                          <div className="space-y-4">
                        <h3 className="font-semibold">Current Status</h3>
                        <div className="space-y-2">
                          <p><strong>Menu Items:</strong> {menuItems.length} items</p>
                          <p><strong>Employees:</strong> {employees.length} staff</p>
                          <p><strong>Subscription:</strong> {subscription?.tier || "Core"} tier</p>
                          <p><strong>Status:</strong> Active</p>
                          <p><strong>Active QR Codes:</strong> {qrCodes.filter(qr => qr.isActive).length} codes</p>
                          <p><strong>Total QR Scans:</strong> {qrCodes.reduce((total, qr) => total + (qr.scanCount || 0), 0)} scans</p>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menu Management Tab */}
            <TabsContent value="menu" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Menu Management</CardTitle>
                      <CardDescription>Manage your restaurant menu items</CardDescription>
                    </div>
                    <Button 
                      disabled={!canAddMenuItem()}
                      className={!canAddMenuItem() ? "opacity-50 cursor-not-allowed" : ""}
                      onClick={() => setShowAddMenuItem(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {canAddMenuItem() ? "Add Menu Item" : "Menu Item Limit Reached"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {menuItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Menu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your menu by adding your first dish
                      </p>
                      <Button disabled={!canAddMenuItem()} onClick={() => setShowAddMenuItem(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Menu Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {menuItems.map((item) => (
                        <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="capitalize">{item.category}</Badge>
                              <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                {item.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">RWF {item.price}</div>
                            <div className="flex space-x-2 mt-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Employee Management Tab */}
            <TabsContent value="employees" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Employee Management</CardTitle>
                      <CardDescription>Manage your restaurant staff</CardDescription>
                    </div>
                    <Button 
                      disabled={!canAddEmployee()}
                      className={!canAddEmployee() ? "opacity-50 cursor-not-allowed" : ""}
                      onClick={() => setShowAddEmployee(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {canAddEmployee() ? "Add Employee" : "Employee Limit Reached"}
                    </Button>

                  </div>
                </CardHeader>
                <CardContent>
                  {employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your team by adding your first employee
                      </p>
                      <Button disabled={!canAddEmployee()} onClick={() => setShowAddEmployee(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Employee
                      </Button>
                            </div>
                  ) : (
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <div key={employee._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-primary font-semibold text-sm">
                                  {employee.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold">{employee.name}</h4>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                                {employee.phone && (
                                  <p className="text-xs text-muted-foreground">{employee.phone}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {employee.role}
                              </Badge>
                              <Badge 
                                variant={employee.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {employee.status}
                              </Badge>
                              {employee.lastLogin && (
                                <span className="text-xs text-muted-foreground">
                                  Last login: {new Date(employee.lastLogin).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openEmployeeActions(employee)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promotions Tab */}
            <TabsContent value="promotions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Promotions & Offers</CardTitle>
                      <CardDescription>Manage special offers and discounts</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddPromotion(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Promotion
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {promotions.length === 0 ? (
                    <div className="text-center py-8">
                      <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No promotions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create special offers to attract more customers
                      </p>
                      <Button onClick={() => setShowAddPromotion(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Promotion
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {promotions.map((promotion) => (
                        <div key={promotion._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{promotion.name}</h4>
                            <p className="text-sm text-muted-foreground">{promotion.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">
                                {promotion.discountType === 'percentage' ? `${promotion.discountValue}% OFF` : `RWF ${promotion.discountValue} OFF`}
                              </Badge>
                              <Badge variant={promotion.isActive ? "default" : "secondary"}>
                                {promotion.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Track and manage customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Orders will appear here when customers place them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order._id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                              <p className="text-sm text-muted-foreground">
                                {order.customerName} • {order.customerPhone}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">RWF {order.totalAmount}</div>
                              <Badge variant={
                                order.status === 'ready' ? 'default' : 
                                order.status === 'preparing' ? 'secondary' : 
                                'outline'
                              }>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>RWF {item.price}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Update Status
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Today's Sales</CardTitle>
                      <CardDescription>Track your restaurant's performance and revenue</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchSalesData}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/debug/force-update-sales', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ restaurantId: user?.restaurantId })
                            })
                            const data = await response.json()
                            if (data.success) {
                              setNotification({ type: 'success', message: data.message })
                              fetchSalesData() // Refresh sales data
                            } else {
                              setNotification({ type: 'error', message: data.error })
                            }
                          } catch (error) {
                            setNotification({ type: 'error', message: 'Failed to update sales' })
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Update Sales
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/debug/test-sales?restaurantId=${user?.restaurantId}`)
                            const data = await response.json()
                            if (data.success) {
                              console.log('Sales test data:', data.data)
                              setNotification({ 
                                type: 'success', 
                                message: `Sales Test: ${data.data.summary.salesOrders} orders, RWF ${data.data.summary.salesRevenue.toLocaleString()}` 
                              })
                            } else {
                              setNotification({ type: 'error', message: data.error })
                            }
                          } catch (error) {
                            setNotification({ type: 'error', message: 'Failed to test sales' })
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Test Sales
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {salesData ? (
                    <div className="space-y-6">
                      {/* Sales Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            RWF {salesData.totalRevenue?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-green-600">Total Revenue</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {salesData.totalOrders || 0}
                          </div>
                          <div className="text-sm text-blue-600">Total Orders</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            RWF {salesData.averageOrderValue?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-purple-600">Avg Order Value</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {Object.keys(salesData.paymentMethods || {}).length}
                          </div>
                          <div className="text-sm text-orange-600">Payment Methods</div>
                        </div>
                      </div>

                      {/* Payment Methods Breakdown */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Payment Methods</h3>
                        <div className="space-y-2">
                          {Object.entries(salesData.paymentMethods || {}).map(([method, amount]) => (
                            <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="capitalize font-medium">{method}</span>
                              <span className="font-bold">RWF {(amount as number).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Selling Items */}
                      {salesData.topSellingItems && salesData.topSellingItems.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Top Selling Items</h3>
                          <div className="space-y-2">
                            {salesData.topSellingItems.slice(0, 5).map((item: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-sm text-gray-600 ml-2">({item.quantity} sold)</span>
                                </div>
                                <span className="font-bold">RWF {item.revenue.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Orders */}
                      {salesData.orders && salesData.orders.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Recent Orders</h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {salesData.orders.slice(0, 10).map((order: any) => (
                              <div key={order._id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <span className="font-medium">{order.customerName}</span>
                                  <span className="text-sm text-gray-600 ml-2">({order.paymentMethod})</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">RWF {order.total.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading sales data...</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Codes Tab */}
            <TabsContent value="qr-codes" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>QR Code Management</CardTitle>
                      <CardDescription>Generate and manage QR codes for your restaurant menu</CardDescription>
                    </div>
                    <Button onClick={() => setShowNewQRCodeModal(true)} disabled={!isProOrAbove(subscription?.tier as any)} className={!isProOrAbove(subscription?.tier as any) ? "opacity-50 cursor-not-allowed" : ""}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {qrCodes.length === 0 ? (
                    <div className="text-center py-8">
                      <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No QR codes yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate QR codes to help customers easily access your menu
                      </p>
                      <Button onClick={() => setShowNewQRCodeModal(true)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate Your First QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {qrCodes.map((qrCode) => (
                        <div key={qrCode._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                              {qrCode.image ? (
                                <img 
                                  src={qrCode.image} 
                                  alt={`QR Code for ${qrCode.name}`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <QrCode className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{qrCode.name}</h4>
                              <p className="text-sm text-muted-foreground">Type: {qrCode.type}</p>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(qrCode.createdAt).toLocaleDateString()}
                              </p>
                              {qrCode.scanCount !== undefined && (
                                <p className="text-sm text-muted-foreground">
                                  Scans: {qrCode.scanCount}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={qrCode.isActive ? "default" : "secondary"}>
                              {qrCode.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleQRCodeStatus(qrCode._id, !qrCode.isActive)}
                            >
                              {qrCode.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const qrUrl = qrCode.url || `${window.location.origin}/guest/${user?.restaurantId}/${qrCode.type === 'room-service' ? 'room-service' : qrCode.type === 'rooms' ? 'rooms' : 'menu'}`
                                navigator.clipboard.writeText(qrUrl)
                                setNotification({ type: 'success', message: 'QR Code URL copied to clipboard!' })
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {qrCode.image && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (qrCode.image) {
                                    const link = document.createElement('a')
                                    link.href = qrCode.image
                                    link.download = `${qrCode.name}-qr-code.png`
                                    link.click()
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteQRCode(qrCode._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* HR Management Tab */}
            <TabsContent value="hr" className="space-y-6">
              {/* Attendance Sub-section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Attendance Management
                      </CardTitle>
                      <CardDescription>Track employee attendance and working hours</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddAttendance(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Employee</th>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Check In</th>
                          <th className="text-left p-3 font-medium">Check Out</th>
                          <th className="text-left p-3 font-medium">Hours</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-muted-foreground">
                              No attendance records yet
                            </td>
                          </tr>
                        ) : (
                          attendanceRecords.map((record) => (
                            <tr key={record._id} className="border-t">
                              <td className="p-3">{record.employeeName}</td>
                              <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="p-3">
                                {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                              </td>
                              <td className="p-3">
                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                              </td>
                              <td className="p-3">{record.workHours?.toFixed(1) || '-'} hrs</td>
                              <td className="p-3">
                                <Badge variant={
                                  record.status === 'present' ? 'default' :
                                  record.status === 'late' ? 'secondary' :
                                  record.status === 'absent' ? 'destructive' : 'outline'
                                }>
                                  {record.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Requests Sub-section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Leave Requests
                      </CardTitle>
                      <CardDescription>Manage employee leave applications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaveRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No leave requests
                      </div>
                    ) : (
                      leaveRequests.map((leave) => (
                        <div key={leave._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{leave.employeeName}</h4>
                              <Badge variant={
                                leave.status === 'approved' ? 'default' :
                                leave.status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {leave.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {leave.leaveType} • {leave.days} day(s) • {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm">{leave.reason}</p>
                          </div>
                          {leave.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Approve leave
                                  setNotification({ type: 'success', message: 'Leave request approved' })
                                  setTimeout(() => setNotification(null), 3000)
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  // Reject leave
                                  setNotification({ type: 'error', message: 'Leave request rejected' })
                                  setTimeout(() => setNotification(null), 3000)
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Sub-section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Payroll Management
                      </CardTitle>
                      <CardDescription>Manage employee salaries and payments</CardDescription>
                    </div>
                    <Button onClick={() => setShowPayrollDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Process Payroll
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Employee</th>
                          <th className="text-left p-3 font-medium">Period</th>
                          <th className="text-left p-3 font-medium">Base Salary</th>
                          <th className="text-left p-3 font-medium">Bonuses</th>
                          <th className="text-left p-3 font-medium">Deductions</th>
                          <th className="text-left p-3 font-medium">Net Salary</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-muted-foreground">
                              No payroll records yet
                            </td>
                          </tr>
                        ) : (
                          payrollRecords.map((payroll) => (
                            <tr key={payroll._id} className="border-t">
                              <td className="p-3">{payroll.employeeName}</td>
                              <td className="p-3">{payroll.month} {payroll.year}</td>
                              <td className="p-3">{payroll.baseSalary.toLocaleString()} FRW</td>
                              <td className="p-3">{payroll.bonuses.toLocaleString()} FRW</td>
                              <td className="p-3">{payroll.deductions.toLocaleString()} FRW</td>
                              <td className="p-3 font-semibold">{payroll.netSalary.toLocaleString()} FRW</td>
                              <td className="p-3">
                                <Badge variant={
                                  payroll.status === 'paid' ? 'default' :
                                  payroll.status === 'processed' ? 'secondary' : 'outline'
                                }>
                                  {payroll.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accounting Tab */}
            <TabsContent value="accounting" className="space-y-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {financialReport?.revenue.toLocaleString() || 0} FRW
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {financialReport?.expenses.toLocaleString() || 0} FRW
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(financialReport?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {financialReport?.profit.toLocaleString() || 0} FRW
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {financialReport?.profitMargin.toFixed(1) || 0}% margin
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {invoices.filter(inv => inv.status !== 'paid').length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">To be collected</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses Sub-section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Expenses
                      </CardTitle>
                      <CardDescription>Track and manage business expenses</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddExpense(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No expenses recorded yet
                      </div>
                    ) : (
                      expenses.map((expense) => (
                        <div key={expense._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{expense.description}</h4>
                              <Badge variant="outline">{expense.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(expense.date).toLocaleDateString()} • {expense.paymentMethod}
                              {expense.vendor && ` • ${expense.vendor}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{expense.amount.toLocaleString()} FRW</div>
                            <Badge variant={
                              expense.status === 'paid' ? 'default' :
                              expense.status === 'approved' ? 'secondary' : 'outline'
                            }>
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoices Sub-section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Invoices
                      </CardTitle>
                      <CardDescription>Manage customer invoices and payments</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddInvoice(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Invoice #</th>
                          <th className="text-left p-3 font-medium">Customer</th>
                          <th className="text-left p-3 font-medium">Issue Date</th>
                          <th className="text-left p-3 font-medium">Due Date</th>
                          <th className="text-left p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-muted-foreground">
                              No invoices yet
                            </td>
                          </tr>
                        ) : (
                          invoices.map((invoice) => (
                            <tr key={invoice._id} className="border-t">
                              <td className="p-3 font-mono text-sm">{invoice.invoiceNumber}</td>
                              <td className="p-3">{invoice.customerName}</td>
                              <td className="p-3">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                              <td className="p-3">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                              <td className="p-3 font-semibold">{invoice.total.toLocaleString()} FRW</td>
                              <td className="p-3">
                                <Badge variant={
                                  invoice.status === 'paid' ? 'default' :
                                  invoice.status === 'overdue' ? 'destructive' :
                                  invoice.status === 'sent' ? 'secondary' : 'outline'
                                }>
                                  {invoice.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Profit & Loss Statement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Profit & Loss Statement
                  </CardTitle>
                  <CardDescription>Monthly financial performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialReport?.monthlyTrend && financialReport.monthlyTrend.length > 0 ? (
                    <div className="space-y-4">
                      {financialReport.monthlyTrend.map((trend, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Month</p>
                            <p className="font-semibold">{trend.month}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                            <p className="font-semibold text-green-600">{trend.revenue.toLocaleString()} FRW</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                            <p className="font-semibold text-red-600">{trend.expenses.toLocaleString()} FRW</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Profit</p>
                            <p className={`font-semibold ${trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trend.profit.toLocaleString()} FRW
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No financial data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Restaurant Settings</CardTitle>
                    <Button onClick={() => setShowRestaurantSettings(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                  <CardDescription>Customize your restaurant appearance and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Restaurant Information</h3>
                      <div className="space-y-2">
                        <p><strong>Name:</strong> {restaurantInfo.name}</p>
                        <p><strong>Description:</strong> {restaurantInfo.description}</p>
                        <p><strong>Phone:</strong> {restaurantInfo.contact?.phone || "Not set"}</p>
                        <p><strong>Address:</strong> {restaurantInfo.contact?.address || "Not set"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Subscription Management</h3>
                      <div className="space-y-2">
                        <p><strong>Current Plan:</strong> {subscription?.tier || "Core"} tier</p>
                        <p><strong>Status:</strong> {subscription?.status || "Unknown"}</p>
                        <p><strong>Expires:</strong> {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : "Unknown"}</p>
                      </div>
                      <Button onClick={() => setShowSubscriptionUpgrade(true)} className="w-full">
                        Request Plan Upgrade
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>View and manage your current subscription plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {subscription ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 border rounded-lg">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {subscription.tier.toUpperCase()}
                          </div>
                          <p className="text-muted-foreground">Current Plan</p>
                        </div>
                        <div className="text-center p-6 border rounded-lg">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            Active
                          </div>
                          <p className="text-muted-foreground">Status</p>
                        </div>
                        <div className="text-center p-6 border rounded-lg">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            Yes
                          </div>
                          <p className="text-muted-foreground">Auto Renew</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Usage Limits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                              {employees.length}/{subscription.limits.employees}
                            </div>
                            <p className="text-sm text-muted-foreground">Employees</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                              {menuItems.length}/{subscription.limits.menuItems}
                            </div>
                            <p className="text-sm text-muted-foreground">Menu Items</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-4">
                        <Button variant="outline" onClick={() => setShowSubscriptionUpgrade(true)}>
                          View Upgrade Options
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No subscription found</h3>
                      <p className="text-muted-foreground mb-4">
                        Contact support to set up your subscription
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Menu Item Dialog */}
          <Dialog open={showAddMenuItem} onOpenChange={setShowAddMenuItem}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>Create a new menu item with details and pricing</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newMenuItem.name}
                    onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                    placeholder="Item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newMenuItem.category} onValueChange={(value) => setNewMenuItem({...newMenuItem, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appetizer">Appetizer</SelectItem>
                      <SelectItem value="main">Main Course</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="side">Side Dish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (RWF)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Prep Time (mins)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    value={newMenuItem.preparationTime}
                    onChange={(e) => setNewMenuItem({...newMenuItem, preparationTime: e.target.value})}
                    placeholder="15"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMenuItem.description}
                    onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                    placeholder="Describe the item..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                  <Input
                    id="allergens"
                    value={newMenuItem.allergens}
                    onChange={(e) => setNewMenuItem({...newMenuItem, allergens: e.target.value})}
                    placeholder="nuts, dairy, gluten"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newMenuItem.tags}
                    onChange={(e) => setNewMenuItem({...newMenuItem, tags: e.target.value})}
                    placeholder="spicy, vegetarian, popular"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="image">Item Image</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="image"
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
                      htmlFor="image"
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddMenuItem(false)}>Cancel</Button>
                <Button onClick={addMenuItem}>Add Menu Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add QR Code Dialog */}
          <Dialog open={showNewQRCodeModal} onOpenChange={setShowNewQRCodeModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generate New QR Code</DialogTitle>
                <DialogDescription>Create a QR code for your restaurant menu</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qrName">QR Code Name</Label>
                  <Input
                    id="qrName"
                    value={newQRCode.name}
                    onChange={(e) => setNewQRCode({...newQRCode, name: e.target.value})}
                    placeholder="e.g., Table 1, Entrance, Bar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qrType">Type</Label>
                  <Select value={newQRCode.type} onValueChange={(value) => setNewQRCode({...newQRCode, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menu">Menu Access</SelectItem>
                      <SelectItem value="room-service">Room Service Request</SelectItem>
                      <SelectItem value="rooms">Available Rooms</SelectItem>
                      <SelectItem value="attached-menu">Attached Establishment Menu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newQRCode.type === 'room-service' && (
                  <div className="space-y-2">
                    <Label htmlFor="qrRoomNumber">Room Number (optional)</Label>
                    <Input
                      id="qrRoomNumber"
                      value={newQRCode.roomNumber}
                      onChange={(e) => setNewQRCode({...newQRCode, roomNumber: e.target.value})}
                      placeholder="e.g., 101"
                    />
                    <p className="text-xs text-muted-foreground">If provided, the guest page will prefill and lock the room number.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="qrUrl">URL (Auto-generated)</Label>
                  <Input
                    id="qrUrl"
                    value={`${window.location.origin}/guest/${user?.restaurantId}/${newQRCode.type === 'room-service' ? `room-service${newQRCode.roomNumber ? `?room=${encodeURIComponent(newQRCode.roomNumber)}` : ''}` : newQRCode.type === 'rooms' ? 'rooms' : 'menu'}`}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    This URL will automatically direct customers to your restaurant's menu page
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewQRCodeModal(false)}>Cancel</Button>
                <Button onClick={addQRCode} disabled={!newQRCode.name.trim() || !user?.restaurantId}>
                  Generate QR Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Promotion Dialog */}
          <Dialog open={showAddPromotion} onOpenChange={setShowAddPromotion}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Promotion</DialogTitle>
                <DialogDescription>Set up special offers and discounts for customers</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promoName">Promotion Name</Label>
                  <Input
                    id="promoName"
                    value={newPromotion.name}
                    onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                    placeholder="Summer Sale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={newPromotion.discountType} onValueChange={(value: 'percentage' | 'fixed') => setNewPromotion({...newPromotion, discountType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={newPromotion.discountValue}
                    onChange={(e) => setNewPromotion({...newPromotion, discountValue: e.target.value})}
                    placeholder={newPromotion.discountType === 'percentage' ? "20" : "1000"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Min Order Amount (RWF)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    value={newPromotion.minimumOrderAmount}
                    onChange={(e) => setNewPromotion({...newPromotion, minimumOrderAmount: e.target.value})}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newPromotion.startDate}
                    onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newPromotion.endDate}
                    onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Maximum Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={newPromotion.maxUses}
                    onChange={(e) => setNewPromotion({...newPromotion, maxUses: e.target.value})}
                    placeholder="100"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="promoDescription">Description</Label>
                  <Textarea
                    id="promoDescription"
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                    placeholder="Describe the promotion..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPromotion(false)}>Cancel</Button>
                <Button onClick={addPromotion}>Create Promotion</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Employee Dialog */}
          <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Add a new staff member to your restaurant. They will use the same login page with their email and password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empName">Full Name</Label>
                  <Input
                    id="empName"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    placeholder="Employee name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empEmail">Email</Label>
                  <Input
                    id="empEmail"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    placeholder="employee@restaurant.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empRole">Role</Label>
                  <Select value={newEmployee.role} onValueChange={(value: 'waiter' | 'kitchen' | 'receptionist' | 'inventory') => setNewEmployee({...newEmployee, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="inventory">Inventory Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empPhone">Phone Number</Label>
                  <Input
                    id="empPhone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    placeholder="+250 700 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empPassword">Password</Label>
                  <Input
                    id="empPassword"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                    placeholder="Create a secure password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Employee will use this password to log in to their dashboard at the same login page
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddEmployee(false)}>Cancel</Button>
                <Button onClick={addEmployee}>Add Employee</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Subscription Upgrade Dialog */}
          <Dialog open={showSubscriptionUpgrade} onOpenChange={setShowSubscriptionUpgrade}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Subscription Upgrade</DialogTitle>
                <DialogDescription>Request an upgrade to access more features and higher limits</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Current Plan: {subscription?.tier?.toUpperCase()}</h4>
                  <p className="text-sm text-muted-foreground">
                    You're currently on the {subscription?.tier} plan with limited features.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Available Plans:</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-semibold text-primary">PRO PLAN</h5>
                      <p className="text-sm text-muted-foreground">More employees, menu items, and features</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-semibold text-primary">ENTERPRISE PLAN</h5>
                      <p className="text-sm text-muted-foreground">Full features, unlimited access, priority support</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubscriptionUpgrade(false)}>Cancel</Button>
                <Button onClick={() => requestSubscriptionUpgrade('pro')}>Request PRO Upgrade</Button>
                <Button onClick={() => requestSubscriptionUpgrade('enterprise')}>Request Enterprise Upgrade</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Restaurant Settings Dialog */}
          <Dialog open={showRestaurantSettings} onOpenChange={setShowRestaurantSettings}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Restaurant Customization Settings</DialogTitle>
                <DialogDescription>
                  Customize your restaurant appearance, information, and settings. Changes will be reflected across the entire platform.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="restaurantName">Restaurant Name *</Label>
                      <Input
                        id="restaurantName"
                        value={restaurantInfo?.name || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, name: e.target.value} : null)}
                        placeholder="Your Restaurant Name"
                      />
                    </div>
                    <div className="space-y-2 opacity-60 pointer-events-none">
                      <Label htmlFor="restaurantType">Type *</Label>
                      <Select value={restaurantInfo?.type || 'restaurant'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                          <SelectItem value="cafe">☕ Cafe</SelectItem>
                          <SelectItem value="hotel">🏨 Hotel</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Only Super Admin can change establishment type.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuisine">Cuisine Type</Label>
                      <Input
                        id="cuisine"
                        value={restaurantInfo?.cuisine || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, cuisine: e.target.value} : null)}
                        placeholder="Italian, Chinese, Local, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priceRange">Price Range</Label>
                      <Select 
                        value={restaurantInfo?.priceRange || 'RWF 5,000 - 15,000'} 
                        onValueChange={(value) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, priceRange: value} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RWF 1,000 - 5,000">RWF 1,000 - 5,000</SelectItem>
                          <SelectItem value="RWF 5,000 - 15,000">RWF 5,000 - 15,000</SelectItem>
                          <SelectItem value="RWF 15,000 - 30,000">RWF 15,000 - 30,000</SelectItem>
                          <SelectItem value="RWF 30,000+">RWF 30,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={restaurantInfo?.description || ''}
                      onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, description: e.target.value} : null)}
                      placeholder="Describe your restaurant, cuisine, and what makes it special..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={restaurantInfo?.contact?.phone || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {
                          ...restaurantInfo, 
                          contact: {...restaurantInfo.contact, phone: e.target.value}
                        } : null)}
                        placeholder="+250 700 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={restaurantInfo?.contact?.email || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {
                          ...restaurantInfo, 
                          contact: {...restaurantInfo.contact, email: e.target.value}
                        } : null)}
                        placeholder="restaurant@example.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={restaurantInfo?.contact?.address || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {
                          ...restaurantInfo, 
                          contact: {...restaurantInfo.contact, address: e.target.value}
                        } : null)}
                        placeholder="Full address including city and district"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Hours */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Location & Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location Name</Label>
                      <Input
                        id="location"
                        value={restaurantInfo?.location || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, location: e.target.value} : null)}
                        placeholder="Kigali, Nyarugenge District"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="openingHours">Opening Hours</Label>
                      <Input
                        id="openingHours"
                        value={restaurantInfo?.hours || ''}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, hours: e.target.value} : null)}
                        placeholder="Mon-Sun: 7:00 AM - 11:00 PM"
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Customization */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Visual Customization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo</Label>
                      <div className="space-y-2">
                        {restaurantInfo?.logo && (
                          <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                            <img 
                              src={restaurantInfo.logo} 
                              alt="Restaurant Logo" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Input
                          id="logo"
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
                                  setRestaurantInfo(restaurantInfo ? {...restaurantInfo, logo: result.url} : null)
                                } else {
                                  console.error('Upload failed:', result.error)
                                }
                              } catch (error) {
                                console.error('Upload error:', error)
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Upload your restaurant logo (max 5MB)</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner">Banner Image</Label>
                      <div className="space-y-2">
                        {restaurantInfo?.banner && (
                          <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                            <img 
                              src={restaurantInfo.banner} 
                              alt="Restaurant Banner" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Input
                          id="banner"
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
                                  setRestaurantInfo(restaurantInfo ? {...restaurantInfo, banner: result.url} : null)
                                } else {
                                  console.error('Upload failed:', result.error)
                                }
                              } catch (error) {
                                console.error('Upload error:', error)
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Upload your restaurant banner (max 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities & Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Amenities & Features</h3>
                  <div className="space-y-4">
                    {/* Current Amenities Display */}
                    <div>
                      <Label>Current Amenities</Label>
                      {restaurantInfo?.amenities && restaurantInfo.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {restaurantInfo.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                              <span>{amenity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newAmenities = restaurantInfo.amenities.filter((_, i) => i !== index)
                                  setRestaurantInfo({
                                    ...restaurantInfo,
                                    amenities: newAmenities
                                  })
                                }}
                                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">No amenities added yet</p>
                      )}
                    </div>

                    {/* Add New Amenity */}
                    <div>
                      <Label htmlFor="newAmenity">Add New Amenity</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="newAmenity"
                          placeholder="Enter amenity (e.g., WiFi, Parking, Delivery)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement
                              const newAmenity = input.value.trim()
                              if (newAmenity && restaurantInfo) {
                                const currentAmenities = restaurantInfo.amenities || []
                                if (!currentAmenities.includes(newAmenity)) {
                                  setRestaurantInfo({
                                    ...restaurantInfo,
                                    amenities: [...currentAmenities, newAmenity]
                                  })
                                  input.value = ''
                                }
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('newAmenity') as HTMLInputElement
                            const newAmenity = input.value.trim()
                            if (newAmenity && restaurantInfo) {
                              const currentAmenities = restaurantInfo.amenities || []
                              if (!currentAmenities.includes(newAmenity)) {
                                setRestaurantInfo({
                                  ...restaurantInfo,
                                  amenities: [...currentAmenities, newAmenity]
                                })
                                input.value = ''
                              }
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type an amenity and press Enter or click Add
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Business Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating">Default Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={restaurantInfo?.rating || 4.5}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, rating: parseFloat(e.target.value)} : null)}
                        placeholder="4.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewCount">Review Count</Label>
                      <Input
                        id="reviewCount"
                        type="number"
                        min="0"
                        value={restaurantInfo?.reviewCount || 0}
                        onChange={(e) => setRestaurantInfo(restaurantInfo ? {...restaurantInfo, reviewCount: parseInt(e.target.value)} : null)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRestaurantSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRestaurantSettings} className="bg-primary">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Employee Actions Dialog */}
          <Dialog open={showEmployeeActions} onOpenChange={setShowEmployeeActions}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Employee Actions</DialogTitle>
                <DialogDescription>
                  Manage {selectedEmployee?.name}'s account and permissions
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">{selectedEmployee?.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Email:</strong> {selectedEmployee?.email}</p>
                    <p><strong>Role:</strong> {selectedEmployee?.role}</p>
                    <p><strong>Status:</strong> {selectedEmployee?.status}</p>
                    <p><strong>Phone:</strong> {selectedEmployee?.phone || 'Not provided'}</p>
                    {selectedEmployee?.lastLogin && (
                      <p><strong>Last Login:</strong> {new Date(selectedEmployee.lastLogin).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowEmployeeActions(false)
                      setShowResetPassword(true)
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      openSetSalary(selectedEmployee as Employee)
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Set Salary
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowEmployeeActions(false)
                      setShowDeactivateConfirm(true)
                    }}
                    disabled={selectedEmployee?.status === 'inactive'}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {selectedEmployee?.status === 'inactive' ? 'Already Deactivated' : 'Deactivate Account'}
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowEmployeeActions(false)
                      setShowDeleteConfirm(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Employee
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEmployeeActions(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reset Password Confirmation Dialog */}
          <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  This will generate a new password for {selectedEmployee?.name}. The new password will be displayed after reset.
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Warning: The employee will need to change their password on next login.
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetPassword(false)}>
                  Cancel
                </Button>
                <Button onClick={resetEmployeePassword} className="bg-yellow-600 hover:bg-yellow-700">
                  Reset Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Set Salary Dialog */}
          <Dialog open={showSetSalary} onOpenChange={setShowSetSalary}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Salary</DialogTitle>
                <DialogDescription>
                  Assign base monthly salary for {selectedEmployee?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="salary">Amount (RWF)</Label>
                <Input id="salary" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} placeholder="e.g. 200000" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSetSalary(false)}>Cancel</Button>
                <Button onClick={saveSalary}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deactivate Account Confirmation Dialog */}
          <Dialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deactivate Account</DialogTitle>
                <DialogDescription>
                  This will deactivate {selectedEmployee?.name}'s account. They won't be able to log in until reactivated.
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-4 border rounded-lg bg-orange-50">
                <div className="flex items-center space-x-2 text-orange-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    The employee will lose access to the system but their data will be preserved.
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={deactivateEmployee} className="bg-orange-600 hover:bg-orange-700">
                  Deactivate Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Employee Confirmation Dialog */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Employee</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. {selectedEmployee?.name} will be permanently removed from the system.
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-4 border rounded-lg bg-red-50">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Warning: This will permanently delete the employee account and all associated data.
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={deleteEmployee} variant="destructive">
                  Delete Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
