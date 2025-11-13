"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Calculator, 
  PieChart, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  LogOut,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Clock,
  Target,
  Award,
  Star,
  Zap,
  Lightbulb,
  Rocket,
  Shield,
  Lock,
  Key,
  Database,
  Server,
  Cloud,
  Wifi,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Headphones,
  Mic,
  Camera,
  Video,
  Image,
  File,
  Folder,
  Archive,
  Search,
  Filter,
  Sort,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  MessageCircle,
  Bell,
  Mail as MailIcon,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share,
  Copy,
  ExternalLink,
  Link,
  Unlink,
  Lock as LockIcon,
  Unlock,
  Eye as EyeIcon,
  EyeOff,
  Sun,
  Moon,
  Palette,
  Brush,
  Eraser,
  Scissors,
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Resize,
  Maximize,
  Minimize,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Pentagon,
  Octagon,
  Diamond,
  Star as StarIcon,
  Heart as HeartIcon,
  Zap as ZapIcon,
  Flame,
  Droplet,
  Snowflake,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudHail,
  Wind,
  Thermometer,
  Gauge,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Plug,
  Power,
  PowerOff,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Volume1,
  Mic as MicIcon,
  MicOff,
  Headphones as HeadphonesIcon,
  HeadphonesOff,
  Radio,
  Tv,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Desktop as DesktopIcon,
  Watch,
  Clock as ClockIcon,
  Timer,
  Stopwatch,
  Hourglass,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarEdit,
  CalendarTrash,
  CalendarHeart,
  CalendarStar,
  CalendarZap,
  CalendarFlame,
  CalendarDroplet,
  CalendarSnow,
  CalendarRain,
  CalendarLightning,
  CalendarDrizzle,
  CalendarHail,
  CalendarWind,
  CalendarThermometer,
  CalendarGauge,
  CalendarBattery,
  CalendarPlug,
  CalendarPower,
  CalendarPlay,
  CalendarPause,
  CalendarStop,
  CalendarSkipBack,
  CalendarSkipForward,
  CalendarRewind,
  CalendarFastForward,
  CalendarVolume2,
  CalendarVolumeX,
  CalendarVolume1,
  CalendarMic,
  CalendarMicOff,
  CalendarHeadphones,
  CalendarHeadphonesOff,
  CalendarRadio,
  CalendarTv,
  CalendarMonitor,
  CalendarSmartphone,
  CalendarTablet,
  CalendarLaptop,
  CalendarDesktop,
  CalendarWatch,
  CalendarClock,
  CalendarTimer,
  CalendarStopwatch,
  CalendarHourglass
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Invoice {
  _id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  tax: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  dueDate: string
  issueDate: string
  description: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  createdAt: string
  updatedAt: string
}

interface Expense {
  _id: string
  vendorName: string
  vendorEmail: string
  amount: number
  category: string
  description: string
  paymentMethod: "cash" | "bank_transfer" | "credit_card" | "check"
  status: "pending" | "approved" | "paid" | "rejected"
  receiptNumber: string
  date: string
  approvedBy: string
  createdAt: string
  updatedAt: string
}

interface PayrollData {
  _id: string
  employeeId: string
  employeeName: string
  employeeRole: string
  baseSalary: number
  hourlyRate: number
  overtimeRate: number
  taxRate: number
  benefits: string[]
  payPeriod: string
  regularHours: number
  overtimeHours: number
  grossPay: number
  deductions: number
  netPay: number
  status: "pending" | "approved" | "paid"
  createdAt: string
  updatedAt: string
}

interface FinancialReport {
  _id: string
  reportType: string
  period: string
  startDate: string
  endDate: string
  revenue: number
  expenses: number
  profit: number
  taxOwed: number
  netIncome: number
  generatedAt: string
  generatedBy: string
}

interface Budget {
  _id: string
  budgetName: string
  category: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  period: string
  startDate: string
  endDate: string
  status: "active" | "completed" | "overdue"
  createdAt: string
  updatedAt: string
}

interface TaxConfiguration {
  _id: string
  taxName: string
  taxType: "percentage" | "fixed"
  rate: number
  applicableTo: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EquipmentPurchaseRequest {
  _id: string
  equipmentName: string
  description: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "approved" | "rejected"
  estimatedCost: number
  approvedAmount?: number
  quantity: number
  vendor: string
  justification: string
  requestedBy: string
  requestedByName: string
  reviewedBy?: string
  reviewedByName?: string
  reviewedAt?: string
  comments?: string
  createdAt: string
  updatedAt: string
}

interface AccountingSettings {
  currency: string
  taxRate: number
  invoicePrefix: string
  paymentTerms: number
  lateFeeRate: number
  expenseCategories: string[]
  paymentMethods: string[]
  fiscalYearStart: string
  reportingPeriod: "monthly" | "quarterly" | "yearly"
  autoBackup: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  budgetManagement: boolean
  taxManagement: boolean
  salaryTaxRate: number
  expenseTaxRate: number
  incomeTaxRate: number
}

interface AccountSettings {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  timezone: string
  language: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  security: {
    twoFactorAuth: boolean
    sessionTimeout: number
    passwordExpiry: number
  }
}

export default function AccountantDashboard() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const { user } = useAuth()

  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [payrollData, setPayrollData] = useState<PayrollData[]>([])
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [taxConfigurations, setTaxConfigurations] = useState<TaxConfiguration[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<EquipmentPurchaseRequest[]>([])
  const [settings, setSettings] = useState<AccountingSettings>({
    currency: "RWF",
    taxRate: 0.18,
    invoicePrefix: "INV",
    paymentTerms: 30,
    lateFeeRate: 0.05,
    expenseCategories: ["Office Supplies", "Utilities", "Marketing", "Travel", "Equipment"],
    paymentMethods: ["Cash", "Bank Transfer", "Credit Card", "Check"],
    fiscalYearStart: "2025-01-01",
    reportingPeriod: "monthly",
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
    budgetManagement: true,
    taxManagement: true,
    salaryTaxRate: 0.15,
    expenseTaxRate: 0.18,
    incomeTaxRate: 0.20
  })
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    firstName: user?.name?.split(' ')[0] || "",
    lastName: user?.name?.split(' ')[1] || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    country: "Rwanda",
    timezone: "Africa/Kigali",
    language: "en",
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    }
  })

  // Dialog states
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showPayrollDialog, setShowPayrollDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [showTaxDialog, setShowTaxDialog] = useState(false)
  const [showPurchaseRequestDialog, setShowPurchaseRequestDialog] = useState(false)

  // Form states
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({})
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({})
  const [newPayroll, setNewPayroll] = useState<Partial<PayrollData>>({})
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({})
  const [newTax, setNewTax] = useState<Partial<TaxConfiguration>>({})
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [selectedTax, setSelectedTax] = useState<TaxConfiguration | null>(null)
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<EquipmentPurchaseRequest | null>(null)

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Check if accounting is supported
  const isAccountingSupported = useMemo(() => {
    return user?.establishmentType === "hotel" || user?.establishmentType === "restaurant"
  }, [user?.establishmentType])

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      } else {
        setError('Failed to fetch invoices')
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setError('Failed to fetch invoices')
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId])

  const fetchExpenses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
      } else {
        setError('Failed to fetch expenses')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setError('Failed to fetch expenses')
    }
  }, [restaurantId])

  const fetchPayrollData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/payroll-data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPayrollData(data.payrollData || [])
      } else {
        setError('Failed to fetch payroll data')
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error)
      setError('Failed to fetch payroll data')
    }
  }, [restaurantId])

  const fetchFinancialReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFinancialReports(data.reports || [])
      } else {
        setError('Failed to fetch financial reports')
      }
    } catch (error) {
      console.error('Error fetching financial reports:', error)
      setError('Failed to fetch financial reports')
    }
  }, [restaurantId])

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {
          currency: "RWF",
          taxRate: 0.18,
          invoicePrefix: "INV",
          paymentTerms: 30,
          budgetManagement: true,
          taxManagement: true,
          salaryTaxRate: 0.15,
          expenseTaxRate: 0.18,
          incomeTaxRate: 0.20
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }, [restaurantId])

  const fetchAccountSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/account-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAccountSettings(data.accountSettings || {
          firstName: user?.name?.split(' ')[0] || "",
          lastName: user?.name?.split(' ').slice(1).join(' ') || "",
          email: user?.email || "",
          phone: "",
          address: "",
          city: "",
          country: "",
          timezone: "Africa/Kigali",
          language: "en",
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        })
      }
    } catch (error) {
      console.error('Error fetching account settings:', error)
    }
  }, [restaurantId, user?.name, user?.email])

  const fetchBudgets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/budgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBudgets(data.budgets || [])
      } else {
        setError('Failed to fetch budgets')
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
      setError('Failed to fetch budgets')
    }
  }, [restaurantId])

  const fetchTaxConfigurations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/tax-configurations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTaxConfigurations(data.taxConfigurations || [])
      } else {
        setError('Failed to fetch tax configurations')
      }
    } catch (error) {
      console.error('Error fetching tax configurations:', error)
      setError('Failed to fetch tax configurations')
    }
  }, [restaurantId])

  const fetchPurchaseRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/purchase-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPurchaseRequests(data.requests || [])
      } else {
        setError('Failed to fetch purchase requests')
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      setError('Failed to fetch purchase requests')
    }
  }, [restaurantId])

  // Fetch data
  useEffect(() => {
    if (restaurantId && isAccountingSupported) {
      fetchInvoices()
      fetchExpenses()
      fetchPayrollData()
      fetchFinancialReports()
      fetchBudgets()
      fetchTaxConfigurations()
      fetchPurchaseRequests()
      fetchSettings()
      fetchAccountSettings()
    }
  }, [restaurantId, isAccountingSupported, fetchInvoices, fetchExpenses, fetchPayrollData, fetchFinancialReports, fetchBudgets, fetchTaxConfigurations, fetchPurchaseRequests, fetchSettings, fetchAccountSettings])

  // Calculate statistics with proper null checks
  const totalRevenue = invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0
  const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
  const totalPayroll = payrollData?.reduce((sum, payroll) => sum + (payroll.netPay || 0), 0) || 0
  const netProfit = totalRevenue - totalExpenses - totalPayroll
  
  // Budget calculations
  const totalBudgetAllocated = budgets?.reduce((sum, budget) => sum + (budget.allocatedAmount || 0), 0) || 0
  const totalBudgetSpent = budgets?.reduce((sum, budget) => sum + (budget.spentAmount || 0), 0) || 0
  const totalBudgetRemaining = totalBudgetAllocated - totalBudgetSpent
  const overBudgetCategories = budgets?.filter(budget => budget.spentAmount > budget.allocatedAmount).length || 0
  
  // Tax calculations
  const totalTaxCollected = invoices?.reduce((sum, invoice) => sum + (invoice.tax || 0), 0) || 0
  const totalTaxPaid = expenses?.reduce((sum, expense) => {
    const expenseTax = (expense.amount || 0) * (settings.expenseTaxRate || 0.18)
    return sum + expenseTax
  }, 0) || 0
  const netTaxOwed = totalTaxCollected - totalTaxPaid
  
  const pendingInvoices = invoices?.filter(invoice => invoice.status === "sent" || invoice.status === "overdue").length || 0
  const pendingExpenses = expenses?.filter(expense => expense.status === "pending").length || 0
  const overdueInvoices = invoices?.filter(invoice => invoice.status === "overdue").length || 0

  // Handlers
  const handleAddInvoice = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/invoices`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInvoice)
      })
      
      if (response.ok) {
        setSuccess('Invoice created successfully')
        setShowInvoiceDialog(false)
        setNewInvoice({})
        fetchInvoices()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setError('Failed to create invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/expenses`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newExpense)
      })
      
      if (response.ok) {
        setSuccess('Expense added successfully')
        setShowExpenseDialog(false)
        setNewExpense({})
        fetchExpenses()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add expense')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      setError('Failed to add expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPayroll = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/payroll-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPayroll)
      })
      
      if (response.ok) {
        setSuccess('Payroll data added successfully')
        setShowPayrollDialog(false)
        setNewPayroll({})
        fetchPayrollData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add payroll data')
      }
    } catch (error) {
      console.error('Error adding payroll data:', error)
      setError('Failed to add payroll data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSettings = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/settings`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSuccess('Settings updated successfully')
        setShowSettingsDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setError('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateAccountSettings = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/account-settings`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountSettings)
      })
      
      if (response.ok) {
        setSuccess('Account settings updated successfully')
        setShowAccountDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update account settings')
      }
    } catch (error) {
      console.error('Error updating account settings:', error)
      setError('Failed to update account settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
  }

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense)
  }

  const handleViewPayroll = (payroll: PayrollData) => {
    setSelectedPayroll(payroll)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setNewInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setNewExpense(expense)
    setShowExpenseDialog(true)
  }

  const handleEditPayroll = (payroll: PayrollData) => {
    setSelectedPayroll(payroll)
    setNewPayroll(payroll)
    setShowPayrollDialog(true)
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSuccess('Invoice deleted successfully')
        fetchInvoices()
      } else {
        setError('Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      setError('Failed to delete invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSuccess('Expense deleted successfully')
        fetchExpenses()
      } else {
        setError('Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      setError('Failed to delete expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePayroll = async (payrollId: string) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/payroll-data/${payrollId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSuccess('Payroll record deleted successfully')
        fetchPayrollData()
      } else {
        setError('Failed to delete payroll record')
      }
    } catch (error) {
      console.error('Error deleting payroll record:', error)
      setError('Failed to delete payroll record')
    } finally {
      setIsLoading(false)
    }
  }

  const generateFinancialReport = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/reports/financial`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFinancialReports([...financialReports, data.report])
        setSuccess('Financial report generated successfully')
      } else {
        setError('Failed to generate financial report')
      }
    } catch (error) {
      console.error('Error generating financial report:', error)
      setError('Failed to generate financial report')
    } finally {
      setIsLoading(false)
    }
  }

  // Budget handlers
  const handleAddBudget = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/budgets`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBudget)
      })
      
      if (response.ok) {
        setSuccess('Budget created successfully')
        setShowBudgetDialog(false)
        setNewBudget({})
        fetchBudgets()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create budget')
      }
    } catch (error) {
      console.error('Error creating budget:', error)
      setError('Failed to create budget')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewBudget = (budget: Budget) => {
    setSelectedBudget(budget)
  }

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget)
    setNewBudget(budget)
    setShowBudgetDialog(true)
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSuccess('Budget deleted successfully')
        fetchBudgets()
      } else {
        setError('Failed to delete budget')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      setError('Failed to delete budget')
    } finally {
      setIsLoading(false)
    }
  }

  // Tax handlers
  const handleAddTax = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/tax-configurations`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTax)
      })
      
      if (response.ok) {
        setSuccess('Tax configuration created successfully')
        setShowTaxDialog(false)
        setNewTax({})
        fetchTaxConfigurations()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create tax configuration')
      }
    } catch (error) {
      console.error('Error creating tax configuration:', error)
      setError('Failed to create tax configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewTax = (tax: TaxConfiguration) => {
    setSelectedTax(tax)
  }

  const handleEditTax = (tax: TaxConfiguration) => {
    setSelectedTax(tax)
    setNewTax(tax)
    setShowTaxDialog(true)
  }

  const handleDeleteTax = async (taxId: string) => {
    if (!confirm('Are you sure you want to delete this tax configuration?')) return
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/tax-configurations/${taxId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSuccess('Tax configuration deleted successfully')
        fetchTaxConfigurations()
      } else {
        setError('Failed to delete tax configuration')
      }
    } catch (error) {
      console.error('Error deleting tax configuration:', error)
      setError('Failed to delete tax configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPurchaseRequest = (request: EquipmentPurchaseRequest) => {
    setSelectedPurchaseRequest(request)
    setShowPurchaseRequestDialog(true)
  }

  const handleApprovePurchaseRequest = async (requestId: string, approvedAmount: number, comments?: string) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/purchase-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'approved',
          approvedAmount,
          comments
        })
      })

      if (response.ok) {
        setSuccess('Purchase request approved successfully')
        fetchPurchaseRequests()
        setShowPurchaseRequestDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to approve purchase request')
      }
    } catch (error) {
      console.error('Error approving purchase request:', error)
      setError('Failed to approve purchase request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectPurchaseRequest = async (requestId: string, comments?: string) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/accountant/${restaurantId}/purchase-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'rejected',
          comments
        })
      })

      if (response.ok) {
        setSuccess('Purchase request rejected successfully')
        fetchPurchaseRequests()
        setShowPurchaseRequestDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to reject purchase request')
      }
    } catch (error) {
      console.error('Error rejecting purchase request:', error)
      setError('Failed to reject purchase request')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAccountingSupported) {
    return (
      <ProtectedRoute allowedRoles={["accountant"]}>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Accounting Dashboard Not Available</h2>
            <p className="text-muted-foreground">
              Accounting functionality is only available for hotels and restaurants with accounting capabilities.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["accountant"]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Accounting Dashboard</h1>
            <p className="text-muted-foreground mt-2">Financial Management & Accounting System</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => setShowAccountDialog(true)}>
              <User className="h-4 w-4 mr-2" />
              Account
            </Button>
            <Button variant="outline" onClick={() => {
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency} {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From {invoices.length} invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency} {totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From {expenses.length} expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency} {netProfit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">After all expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">{overdueInvoices} overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="taxes">Taxes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest invoice activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(invoices || []).slice(0, 5).map((invoice) => (
                      <div key={invoice._id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{settings.currency} {(invoice.total || 0).toLocaleString()}</p>
                          <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Latest expense activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(expenses || []).slice(0, 5).map((expense) => (
                      <div key={expense._id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{expense.vendorName}</p>
                          <p className="text-sm text-muted-foreground">{expense.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{settings.currency} {(expense.amount || 0).toLocaleString()}</p>
                          <Badge variant={expense.status === "paid" ? "default" : expense.status === "pending" ? "secondary" : "destructive"}>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Invoice Management</h2>
              <Button onClick={() => setShowInvoiceDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoices || []).map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{settings.currency} {(invoice.total || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice._id)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Expense Management</h2>
              <Button onClick={() => setShowExpenseDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(expenses || []).map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell className="font-medium">{expense.vendorName}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{settings.currency} {(expense.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={expense.status === "paid" ? "default" : expense.status === "pending" ? "secondary" : "destructive"}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewExpense(expense)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditExpense(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteExpense(expense._id)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Payroll Management</h2>
              <Button onClick={() => setShowPayrollDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payroll
              </Button>
            </div>

            {/* Payroll Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Base Salaries</p>
                      <p className="text-2xl font-bold">{settings.currency} {(payrollData || []).reduce((sum, payroll) => sum + (payroll.baseSalary || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">₣</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Gross Pay</p>
                      <p className="text-2xl font-bold">{settings.currency} {(payrollData || []).reduce((sum, payroll) => sum + (payroll.grossPay || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">₣</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Deductions</p>
                      <p className="text-2xl font-bold">{settings.currency} {(payrollData || []).reduce((sum, payroll) => sum + (payroll.deductions || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold">₣</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Net Pay</p>
                      <p className="text-2xl font-bold text-primary">{settings.currency} {(payrollData || []).reduce((sum, payroll) => sum + (payroll.netPay || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">₣</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payrollData || []).map((payroll) => (
                      <TableRow key={payroll._id}>
                        <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                        <TableCell>{payroll.employeeRole}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{settings.currency} {(payroll.baseSalary || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {payroll.hourlyRate ? `RWF ${(payroll.hourlyRate || 0).toFixed(2)}/hr` : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{settings.currency} {(payroll.grossPay || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {payroll.regularHours || 0}h regular, {payroll.overtimeHours || 0}h overtime
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{settings.currency} {(payroll.deductions || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              Tax: {((payroll.taxRate || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-primary">
                            {settings.currency} {(payroll.netPay || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payroll.status === "paid" ? "default" : payroll.status === "pending" ? "secondary" : "destructive"}>
                            {payroll.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewPayroll(payroll)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditPayroll(payroll)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeletePayroll(payroll._id)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Budget Management</h2>
              <Button onClick={() => setShowBudgetDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </div>

            {/* Budget Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settings.currency} {totalBudgetAllocated.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Budget allocation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settings.currency} {totalBudgetSpent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Amount spent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settings.currency} {totalBudgetRemaining.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Available budget</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overBudgetCategories}</div>
                  <p className="text-xs text-muted-foreground">Categories over budget</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Budget Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(budgets || []).map((budget) => (
                      <TableRow key={budget._id}>
                        <TableCell className="font-medium">{budget.budgetName}</TableCell>
                        <TableCell>{budget.category}</TableCell>
                        <TableCell>{settings.currency} {(budget.allocatedAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>{settings.currency} {(budget.spentAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>{settings.currency} {(budget.remainingAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            budget.status === "active" ? "default" : 
                            budget.status === "completed" ? "secondary" : 
                            "destructive"
                          }>
                            {budget.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewBudget(budget)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditBudget(budget)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteBudget(budget._id)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Taxes Tab */}
          <TabsContent value="taxes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tax Management</h2>
              <Button onClick={() => setShowTaxDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Configuration
              </Button>
            </div>

            {/* Tax Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settings.currency} {totalTaxCollected.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">From invoices</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tax Paid</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settings.currency} {totalTaxPaid.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">On expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Tax Owed</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{settings.currency} {netTaxOwed.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Tax liability</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tax Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Applicable To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(taxConfigurations || []).map((tax) => (
                      <TableRow key={tax._id}>
                        <TableCell className="font-medium">{tax.taxName}</TableCell>
                        <TableCell>{tax.taxType}</TableCell>
                        <TableCell>{tax.taxType === "percentage" ? `${(tax.rate * 100).toFixed(1)}%` : `${settings.currency} ${tax.rate.toLocaleString()}`}</TableCell>
                        <TableCell>{tax.applicableTo.join(", ")}</TableCell>
                        <TableCell>
                          <Badge variant={tax.isActive ? "default" : "secondary"}>
                            {tax.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewTax(tax)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditTax(tax)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTax(tax._id)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Financial Reports</h2>
              <Button onClick={generateFinancialReport}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(financialReports || []).map((report) => (
                <Card key={report._id}>
                  <CardHeader>
                    <CardTitle>{report.reportType}</CardTitle>
                    <CardDescription>{report.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span>{settings.currency} {(report.revenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span>{settings.currency} {(report.expenses || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit:</span>
                        <span>{settings.currency} {(report.profit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Accounting Settings</h2>
              <Button onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Currency</Label>
                    <p className="text-sm text-muted-foreground">{settings.currency}</p>
                  </div>
                  <div>
                    <Label>Tax Rate</Label>
                    <p className="text-sm text-muted-foreground">{(settings.taxRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <Label>Invoice Prefix</Label>
                    <p className="text-sm text-muted-foreground">{settings.invoicePrefix}</p>
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <p className="text-sm text-muted-foreground">{settings.paymentTerms} days</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch checked={settings.emailNotifications} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>SMS Notifications</Label>
                    <Switch checked={settings.smsNotifications} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto Backup</Label>
                    <Switch checked={settings.autoBackup} disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Invoice Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={newInvoice.invoiceNumber || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})}
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={newInvoice.customerName || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, customerName: e.target.value})}
                    placeholder="Customer Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={newInvoice.customerEmail || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, customerEmail: e.target.value})}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newInvoice.amount || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, amount: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={newInvoice.issueDate || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, issueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newInvoice.dueDate || ""}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newInvoice.description || ""}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  placeholder="Invoice description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInvoice} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Expense Dialog */}
        <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input
                    id="vendorName"
                    value={newExpense.vendorName || ""}
                    onChange={(e) => setNewExpense({...newExpense, vendorName: e.target.value})}
                    placeholder="Vendor Name"
                  />
                </div>
                <div>
                  <Label htmlFor="vendorEmail">Vendor Email</Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    value={newExpense.vendorEmail || ""}
                    onChange={(e) => setNewExpense({...newExpense, vendorEmail: e.target.value})}
                    placeholder="vendor@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newExpense.amount || ""}
                    onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newExpense.category || ""} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={newExpense.paymentMethod || ""} onValueChange={(value) => setNewExpense({...newExpense, paymentMethod: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.paymentMethods.map((method) => (
                        <SelectItem key={method} value={method.toLowerCase().replace(' ', '_')}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date || ""}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExpense.description || ""}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="Expense description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Payroll Dialog */}
        <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Payroll Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input
                    id="employeeName"
                    value={newPayroll.employeeName || ""}
                    onChange={(e) => setNewPayroll({...newPayroll, employeeName: e.target.value})}
                    placeholder="Employee Name"
                  />
                </div>
                <div>
                  <Label htmlFor="employeeRole">Employee Role</Label>
                  <Input
                    id="employeeRole"
                    value={newPayroll.employeeRole || ""}
                    onChange={(e) => setNewPayroll({...newPayroll, employeeRole: e.target.value})}
                    placeholder="Employee Role"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseSalary">Base Salary</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={newPayroll.baseSalary || ""}
                    onChange={(e) => setNewPayroll({...newPayroll, baseSalary: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={newPayroll.hourlyRate || ""}
                    onChange={(e) => setNewPayroll({...newPayroll, hourlyRate: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="regularHours">Regular Hours</Label>
                  <Input
                    id="regularHours"
                    type="number"
                    value={newPayroll.regularHours || ""}
                    onChange={(e) => setNewPayroll({...newPayroll, regularHours: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="overtimeHours">Overtime Hours</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    value={newPayroll.overtimeHours || ""}
                    onChange={(e) => setNewPayroll({...newPayroll, overtimeHours: parseFloat(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayrollDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayroll} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Payroll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Accounting Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => setSettings({...settings, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate * 100}
                    onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value) / 100})}
                    placeholder="18"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value})}
                    placeholder="INV"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                  <Input
                    id="paymentTerms"
                    type="number"
                    value={settings.paymentTerms}
                    onChange={(e) => setSettings({...settings, paymentTerms: parseInt(e.target.value)})}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email Notifications</Label>
                  <Switch 
                    checked={settings.emailNotifications} 
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SMS Notifications</Label>
                  <Switch 
                    checked={settings.smsNotifications} 
                    onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto Backup</Label>
                  <Switch 
                    checked={settings.autoBackup} 
                    onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Account Settings Dialog */}
        <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Account Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={accountSettings.firstName}
                    onChange={(e) => setAccountSettings({...accountSettings, firstName: e.target.value})}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={accountSettings.lastName}
                    onChange={(e) => setAccountSettings({...accountSettings, lastName: e.target.value})}
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountSettings.email}
                    onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={accountSettings.phone}
                    onChange={(e) => setAccountSettings({...accountSettings, phone: e.target.value})}
                    placeholder="+250 123 456 789"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={accountSettings.address}
                  onChange={(e) => setAccountSettings({...accountSettings, address: e.target.value})}
                  placeholder="Street Address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={accountSettings.city}
                    onChange={(e) => setAccountSettings({...accountSettings, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={accountSettings.country}
                    onChange={(e) => setAccountSettings({...accountSettings, country: e.target.value})}
                    placeholder="Country"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <div className="flex items-center justify-between">
                  <Label>Email Notifications</Label>
                  <Switch 
                    checked={accountSettings.notifications.email} 
                    onCheckedChange={(checked) => setAccountSettings({
                      ...accountSettings, 
                      notifications: {...accountSettings.notifications, email: checked}
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SMS Notifications</Label>
                  <Switch 
                    checked={accountSettings.notifications.sms} 
                    onCheckedChange={(checked) => setAccountSettings({
                      ...accountSettings, 
                      notifications: {...accountSettings.notifications, sms: checked}
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Push Notifications</Label>
                  <Switch 
                    checked={accountSettings.notifications.push} 
                    onCheckedChange={(checked) => setAccountSettings({
                      ...accountSettings, 
                      notifications: {...accountSettings.notifications, push: checked}
                    })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAccountDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAccountSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}