"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalLoading } from "@/components/global-loading"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users, Store, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Star, Eye, Crown, AlertCircle,
  LogOut, Settings, Shield, Activity, FileText, UserPlus, UserMinus, Database, Server, Bell,
  Calendar, BarChart3, Globe, CreditCard, Key, Lock, Unlock, RefreshCw, Download, Upload,
  BarChart, PieChart, TrendingDown, ArrowUpRight, ArrowDownRight, Target, Zap, Building2
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { SUBSCRIPTION_TIERS, getTierById, formatPrice, getTierColor, getTierIcon } from "@/lib/subscription-tiers"

interface Establishment {
  _id: string
  name: string
  type: "restaurant" | "cafe" | "hotel"
  description: string
  cuisine?: string
  location: string
  phone: string
  email: string
  subscription: {
    tier: "core" | "pro" | "enterprise"
    status: "active" | "expired" | "cancelled" | "trial"
    startDate: string
    endDate: string
    autoRenew: boolean
  }
  isApproved: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  restaurantId?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  phone?: string
  isLocked?: boolean
  loginAttempts?: number
  profile?: any
  permissions?: any
}

interface PlatformStats {
  totalEstablishments: number
  pendingApprovals: number
  totalUsers: number
  coreEstablishments: number
  proEstablishments: number
  enterpriseEstablishments: number
  totalOrders: number
  totalRevenue: number
  systemHealth: "excellent" | "good" | "warning" | "critical"
  uptime: number
  subscriptionRevenue: {
    monthly: number
    yearly: number
    projected: number
  }
  tierDistribution: {
    core: { count: number; percentage: number }
    pro: { count: number; percentage: number }
    enterprise: { count: number; percentage: number }
  }
}

interface AuditLog {
  id: string
  action: string
  user: string
  target: string
  timestamp: Date
  details: string
  ipAddress: string
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<PlatformStats>({
    totalEstablishments: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    coreEstablishments: 0,
    proEstablishments: 0,
    enterpriseEstablishments: 0,
    totalOrders: 0,
    totalRevenue: 0,
    systemHealth: "excellent",
    uptime: 99.9,
    subscriptionRevenue: {
      monthly: 0,
      yearly: 0,
      projected: 0
    },
    tierDistribution: {
      core: { count: 0, percentage: 0 },
      pro: { count: 0, percentage: 0 },
      enterprise: { count: 0, percentage: 0 }
    }
  })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showSystemDialog, setShowSystemDialog] = useState(false)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [showBulkSubscriptionDialog, setShowBulkSubscriptionDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [rejectionReason, setRejectionReason] = useState("")
  const [userAction, setUserAction] = useState<"activate" | "deactivate" | "changeRole" | "unlock" | "resetPassword">("activate")
  const [newUserRole, setNewUserRole] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [subscriptionAction, setSubscriptionAction] = useState<"upgrade" | "downgrade" | "cancel" | "renew">("upgrade")
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(20)
  const [newSubscriptionTier, setNewSubscriptionTier] = useState<"core" | "pro" | "enterprise">("pro")
  const [bulkSubscriptionTier, setBulkSubscriptionTier] = useState<"core" | "pro" | "enterprise">("pro")
  const [bulkSubscriptionAction, setBulkSubscriptionAction] = useState<"upgrade" | "downgrade">("upgrade")
  const [selectedEstablishmentsForBulk, setSelectedEstablishmentsForBulk] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkUserDialog, setShowBulkUserDialog] = useState(false)
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false)
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [typeTarget, setTypeTarget] = useState<Establishment | null>(null)
  const [pendingType, setPendingType] = useState<"restaurant" | "cafe" | "hotel">("restaurant")
  const [attachedEstablishments, setAttachedEstablishments] = useState<Array<{
    id: string
    type: string
    name: string
    description: string
    status: string
    hotelId: string
    hotelName: string
    createdAt: Date
  }>>([])
  
  // Settings state
  const [settings, setSettings] = useState({
    // Platform Configuration
    platformName: "Ingagi ERP",
    platformDescription: "Comprehensive restaurant and hotel management platform",
    supportEmail: "support@ingagi.com",
    supportPhone: "+250 788 123 456",
    
    // Business Settings
    commissionRate: 5,
    premiumPrice: 50000,
    enterprisePrice: 100000,
    autoApproval: "manual",
    freeTrialDays: 14,
    
    // Security Settings
    sessionTimeout: 480,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    ipWhitelist: [],
    allowedDomains: [],
    
    // User Management
    allowUserRegistration: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    maxUsersPerRestaurant: 20,
    userSessionTimeout: 30,
    
    // Restaurant Settings
    maxMenuItems: {
      core: 50,
      pro: 200,
      enterprise: 1000
    },
    maxEmployees: {
      core: 5,
      pro: 15,
      enterprise: 100
    },
    maxOrders: {
      core: 1000,
      pro: 10000,
      enterprise: 100000
    },
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationFrequency: "realtime",
    
    // System Settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: "info",
    backupFrequency: "daily",
    dataRetentionDays: 365,
    
    // Payment Settings
    paymentGateway: "momo",
    currency: "RWF",
    taxRate: 18,
    allowPartialPayments: true,
    
    // Analytics Settings
    analyticsEnabled: true,
    dataCollection: true,
    privacyCompliance: true,
    reportRetention: 90
  })
    const [settingsLoading, setSettingsLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem("token")
      
      // Make all API calls in parallel for much faster loading
      const [
        establishmentsResponse,
        usersResponse,
        statsResponse,
        logsResponse,
        attachedResponse,
        settingsResponse
      ] = await Promise.allSettled([
        fetch('/api/restaurants'),
        fetch('/api/admin/users'),
        fetch('/api/stats/platform'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/attached-establishments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/settings')
      ])

      // Process establishments data
      if (establishmentsResponse.status === 'fulfilled' && establishmentsResponse.value.ok) {
        const establishmentsData = await establishmentsResponse.value.json()
        setEstablishments(establishmentsData.establishments || [])
      }

      // Process users data
      if (usersResponse.status === 'fulfilled' && usersResponse.value.ok) {
        const usersData = await usersResponse.value.json()
        setUsers(usersData.users || [])
      }

      // Process stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json()
        if (statsData.success && statsData.stats) {
          setStats(prevStats => ({
            ...prevStats,
            totalEstablishments: statsData.stats.totalEstablishments || 0,
            totalUsers: statsData.stats.totalUsers || 0,
            coreEstablishments: statsData.stats.coreEstablishments || 0,
            proEstablishments: statsData.stats.proEstablishments || 0,
            enterpriseEstablishments: statsData.stats.enterpriseEstablishments || 0,
            totalOrders: statsData.stats.totalOrders || 0
          }))
        }
      }

      // Process audit logs data
      if (logsResponse.status === 'fulfilled' && logsResponse.value.ok) {
        const logsData = await logsResponse.value.json()
        setAuditLogs(logsData.logs || [])
      }

      // Process attached establishments data
      if (attachedResponse.status === 'fulfilled' && attachedResponse.value.ok) {
        const attachedData = await attachedResponse.value.json()
        setAttachedEstablishments(attachedData.establishments || [])
      }

      // Process settings data
      if (settingsResponse.status === 'fulfilled' && settingsResponse.value.ok) {
        const settingsData = await settingsResponse.value.json()
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings)
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch real data from MongoDB
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // removed duplicate declaration; existing confirmTypeChange below handles save
  async function changeEstablishmentType() {
    if (!typeTarget?._id) return
    try {
      const res = await fetch(`/api/restaurant/${typeTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pendingType })
      })
      if (res.ok) {
        setEstablishments(prev => prev.map(e => e._id === typeTarget._id ? { ...e, type: pendingType } as Establishment : e))
        setShowTypeDialog(false)
      }
    } catch (e) {
      console.error('Failed to change establishment type', e)
    }
  }


  const saveSettings = async () => {
    try {
      setSettingsLoading(true)
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settings,
          updatedBy: user?.email || 'admin'
        })
      })

      if (response.ok) {
        const result = await response.json()
        showNotification('success', result.message || 'Settings saved successfully')
      } else {
        const error = await response.json()
        showNotification('error', error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showNotification('error', 'Failed to save settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const resetSettingsToDefaults = async () => {
    try {
      setSettingsLoading(true)
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset_to_defaults',
          data: { updatedBy: user?.email || 'admin' }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.settings) {
          setSettings(result.settings)
          showNotification('success', result.message || 'Settings reset to defaults successfully')
        }
      } else {
        const error = await response.json()
        showNotification('error', error.error || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      showNotification('error', 'Failed to reset settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleAttachedEstablishmentAction = async (establishmentId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch('/api/admin/attached-establishments', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ establishmentId, action })
      })
      if (res.ok) {
        setAttachedEstablishments(prev => prev.filter(est => est.id !== establishmentId))
        showNotification('success', `Establishment ${action}d successfully`)
      } else {
        showNotification('error', `Failed to ${action} establishment`)
      }
    } catch (e) {
      console.error('Attached establishment action failed', e)
      showNotification('error', `Failed to ${action} establishment`)
    }
  }

  const exportSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export_settings'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.settings) {
          // Create and download settings file
          const blob = new Blob([JSON.stringify(result.settings, null, 2)], { 
            type: 'application/json' 
          })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `ingagi-settings-${new Date().toISOString().split('T')[0]}.json`
          link.click()
          window.URL.revokeObjectURL(url)
          
          showNotification('success', 'Settings exported successfully')
        }
      } else {
        const error = await response.json()
        showNotification('error', error.error || 'Failed to export settings')
      }
    } catch (error) {
      console.error('Error exporting settings:', error)
      showNotification('error', 'Failed to export settings')
    }
  }

  const validateSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate_settings',
          data: { settings: settings }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          if (result.isValid) {
            showNotification('success', 'All settings are valid')
          } else {
            showNotification('error', `Settings validation failed: ${result.errors.join(', ')}`)
          }
        }
      } else {
        const error = await response.json()
        showNotification('error', error.error || 'Failed to validate settings')
      }
    } catch (error) {
      console.error('Error validating settings:', error)
      showNotification('error', 'Failed to validate settings')
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

    const bulkSubscriptionOperation = async (operation: 'upgrade' | 'downgrade', establishmentIds: string[], newTier: 'core' | 'pro' | 'enterprise') => {
    try {
      setLoading(true)
      
      // In a real app, this would call a bulk API endpoint
      // For now, we'll update the local state
      setEstablishments(prev => 
        prev.map(establishment => 
          establishmentIds.includes(establishment._id) 
            ? { 
                ...establishment, 
                subscription: {
                  tier: newTier,
                  status: 'active',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  autoRenew: true
                }
              }
            : establishment
        )
      )
      
      // Update stats based on new tier distribution
      const updatedStats = await fetch('/api/stats/platform').then(res => res.json())
      if (updatedStats.success && updatedStats.stats) {
        setStats(prevStats => ({
          ...prevStats,
          totalEstablishments: updatedStats.stats.totalEstablishments || 0,
          totalUsers: updatedStats.stats.totalUsers || 0,
          coreEstablishments: updatedStats.stats.coreEstablishments || 0,
          proEstablishments: updatedStats.stats.proEstablishments || 0,
          enterpriseEstablishments: updatedStats.stats.enterpriseEstablishments || 0,
          totalOrders: updatedStats.stats.totalOrders || 0
        }))
      }
      
      showNotification('success', `Subscription tier updated to ${newTier} for ${establishmentIds.length} establishments`)
    } catch (error) {
      console.error('Error in bulk subscription operation:', error)
      showNotification('error', `Failed to update subscription tier`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleApproval = async (establishment: Establishment, action: "approve" | "reject") => {
    setSelectedEstablishment(establishment)
    setApprovalAction(action)
    setShowApprovalDialog(true)
  }

  const confirmApproval = async () => {
    if (!selectedEstablishment) return

    try {
      const response = await fetch(`/api/restaurants/${selectedEstablishment._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: approvalAction === "approve",
          rejectionReason: approvalAction === "reject" ? rejectionReason : undefined
        })
      })

      if (response.ok) {
        // Refresh data
        await fetchDashboardData()
    setShowApprovalDialog(false)
        setSelectedEstablishment(null)
    setRejectionReason("")
        showNotification('success', `Establishment ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`)
      } else {
        showNotification('error', `Failed to ${approvalAction} establishment`)
      }
    } catch (error) {
      console.error('Error updating establishment approval:', error)
    }
  }

  const toggleSubscription = async (establishment: Establishment) => {
    setSelectedEstablishment(establishment)
    setNewSubscriptionTier(establishment.subscription.tier) // Set current tier as default
    setShowPremiumDialog(true)
  }

  const confirmSubscriptionToggle = async () => {
    if (!selectedEstablishment) return

    try {
      const response = await fetch(`/api/restaurants/${selectedEstablishment._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            tier: newSubscriptionTier,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            autoRenew: true
          }
        })
      })

      if (response.ok) {
        // Refresh data
        await fetchDashboardData()
        setShowPremiumDialog(false)
        setSelectedEstablishment(null)
        showNotification('success', `Subscription tier updated to ${newSubscriptionTier} successfully`)
      } else {
        showNotification('error', 'Failed to update subscription tier')
      }
    } catch (error) {
      console.error('Error updating establishment subscription tier:', error)
    }
  }

  const handleUserAction = async (user: User, action: "activate" | "deactivate" | "changeRole" | "unlock" | "resetPassword") => {
    setSelectedUser(user)
    setUserAction(action)
    setShowUserDialog(true)
  }

  const confirmUserAction = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: userAction,
          data: userAction === "changeRole" ? { role: newUserRole } : {}
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Refresh data
        await fetchDashboardData()
        setShowUserDialog(false)
        setSelectedUser(null)
        setNewUserRole("")
        showNotification('success', result.message)
      } else {
        const error = await response.json()
        showNotification('error', error.error || `Failed to ${userAction} user`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      showNotification('error', `Failed to ${userAction} user`)
    }
  }

  const exportData = async (type: 'restaurants' | 'users' | 'audit-logs') => {
    try {
      let data: any[] = []
      let filename = ''
      
      switch (type) {
        case 'restaurants':
          data = establishments.map(r => ({
            Name: r.name,
            Type: r.type,
            Description: r.description,
            Cuisine: r.cuisine || 'N/A',
            Location: r.location,
            Phone: r.phone,
            Email: r.email,
            Status: r.isApproved ? 'Approved' : 'Pending',
            Tier: r.subscription.tier.charAt(0).toUpperCase() + r.subscription.tier.slice(1),
            Owner: r.ownerId,
            Created: new Date(r.createdAt).toLocaleDateString()
          }))
          filename = 'establishments'
          break
        case 'users':
          data = users.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Restaurant: u.restaurantId || 'Platform User',
            Status: u.isActive ? 'Active' : 'Inactive',
            'Last Login': u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
            Created: new Date(u.createdAt).toLocaleDateString()
          }))
          filename = 'users'
          break
        case 'audit-logs':
          data = auditLogs.map(l => ({
            Timestamp: new Date(l.timestamp).toLocaleString(),
            Action: l.action,
            User: l.user,
            Target: l.target,
            Details: l.details,
            'IP Address': l.ipAddress
          }))
          filename = 'audit-logs'
          break
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && user.isActive) ||
                         (filterStatus === "inactive" && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const calculateSubscriptionRevenue = () => {
    const proRevenue = stats.proEstablishments * 25000
    const enterpriseRevenue = stats.enterpriseEstablishments * 100000
    const monthlyRevenue = proRevenue + enterpriseRevenue
    const yearlyRevenue = monthlyRevenue * 12
    const projectedRevenue = yearlyRevenue * 1.15 // 15% growth projection
    
    return {
      monthly: monthlyRevenue,
      yearly: yearlyRevenue,
      projected: projectedRevenue
    }
  }

  const calculateTierDistribution = () => {
    const total = stats.totalEstablishments
    if (total === 0) return { core: { count: 0, percentage: 0 }, pro: { count: 0, percentage: 0 }, enterprise: { count: 0, percentage: 0 } }
    
    return {
      core: { count: stats.coreEstablishments, percentage: Math.round((stats.coreEstablishments / total) * 100) },
      pro: { count: stats.proEstablishments, percentage: Math.round((stats.proEstablishments / total) * 100) },
      enterprise: { count: stats.enterpriseEstablishments, percentage: Math.round((stats.enterpriseEstablishments / total) * 100) }
    }
  }

  const handleBulkSubscriptionSelection = (establishmentId: string) => {
    setSelectedEstablishmentsForBulk(prev => 
      prev.includes(establishmentId) 
        ? prev.filter(id => id !== establishmentId)
        : [...prev, establishmentId]
    )
  }

  const selectAllEstablishments = () => {
    setSelectedEstablishmentsForBulk(establishments.map(e => e._id))
  }

  const clearAllSelections = () => {
    setSelectedEstablishmentsForBulk([])
  }

  const executeBulkSubscriptionOperation = async () => {
    if (selectedEstablishmentsForBulk.length === 0) return

    try {
      setLoading(true)
      
      // Update local state immediately for better UX
      setEstablishments(prev => 
        prev.map(establishment => 
          selectedEstablishmentsForBulk.includes(establishment._id) 
            ? { 
                ...establishment, 
                subscription: {
                  tier: bulkSubscriptionTier,
                  status: 'active',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  autoRenew: true
                }
              }
            : establishment
        )
      )
      
      // Update stats
      const updatedStats = await fetch('/api/stats/platform').then(res => res.json())
      if (updatedStats.success && updatedStats.stats) {
        setStats(prevStats => ({
          ...prevStats,
          totalEstablishments: updatedStats.stats.totalEstablishments || 0,
          totalUsers: updatedStats.stats.totalUsers || 0,
          coreEstablishments: updatedStats.stats.coreEstablishments || 0,
          proEstablishments: updatedStats.stats.proEstablishments || 0,
          enterpriseEstablishments: updatedStats.stats.enterpriseEstablishments || 0,
          totalOrders: updatedStats.stats.totalOrders || 0
        }))
      }
      
      showNotification('success', `Successfully updated ${selectedEstablishmentsForBulk.length} establishments to ${bulkSubscriptionTier} tier`)
      setShowBulkSubscriptionDialog(false)
      setSelectedEstablishmentsForBulk([])
    } catch (error) {
      console.error('Error in bulk subscription operation:', error)
      showNotification('error', 'Failed to update subscription tiers')
    } finally {
      setLoading(false)
    }
  }

  const openTypeChangeDialog = (est: Establishment) => {
    setTypeTarget(est)
    setPendingType(est.type)
    setShowTypeDialog(true)
  }

  const confirmTypeChange = async () => {
    if (!typeTarget) return
    try {
      const res = await fetch(`/api/restaurant/${typeTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pendingType })
      })
      if (!res.ok) throw new Error('Failed to update type')
      setEstablishments(prev => prev.map(e => e._id === typeTarget._id ? { ...e, type: pendingType } : e))
      setShowTypeDialog(false)
      setTypeTarget(null)
    } catch (e) {
      console.error('Type update failed', e)
    }
  }

  const executeBulkUserOperation = async () => {
    if (selectedUsers.length === 0) return

    try {
      setLoading(true)
      let successCount = 0
      let errorCount = 0
      
      for (const userId of selectedUsers) {
        try {
          const response = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              action: userAction,
              data: userAction === "changeRole" ? { role: newUserRole } : {}
            })
          })
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      if (successCount > 0) {
        showNotification('success', `Successfully updated ${successCount} users`)
        if (errorCount > 0) {
          showNotification('error', `${errorCount} users failed to update`)
        }
        await fetchDashboardData()
        setSelectedUsers([])
        setShowBulkUserDialog(false)
      } else {
        showNotification('error', 'Failed to update any users')
      }
    } catch (error) {
      console.error('Error in bulk user operation:', error)
      showNotification('error', 'Bulk operation failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage the Ingagi platform</p>
              </div>
              <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSystemDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  System
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Establishments</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEstablishments}</div>
                <p className="text-xs text-muted-foreground">{stats.pendingApprovals} pending approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Platform users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uptime}%</div>
                <Badge 
                  variant={
                    stats.systemHealth === "excellent" ? "default" :
                    stats.systemHealth === "good" ? "secondary" :
                    stats.systemHealth === "warning" ? "outline" : "destructive"
                  }
                  className="text-xs"
                >
                  {stats.systemHealth}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Establishments</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.proEstablishments + stats.enterpriseEstablishments}</div>
                <p className="text-xs text-muted-foreground">Premium subscriptions</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="restaurants" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="restaurants">Establishments</TabsTrigger>
                <TabsTrigger value="attached">Attached Requests</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="premium">Subscription Management</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

              {/* Establishments Tab */}
            <TabsContent value="restaurants" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Establishment Management</h3>
                    <p className="text-sm text-muted-foreground">Approve new establishments and manage existing ones</p>
                  </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => exportData('restaurants')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Establishments
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent>
                  {establishments.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Establishments Found</h3>
                      <p className="text-muted-foreground">Establishments will appear here once they register on the platform.</p>
                    </div>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                          <TableHead>Establishment</TableHead>
                          <TableHead>Type</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Premium</TableHead>
                          <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {establishments.map((establishment) => (
                          <TableRow key={establishment._id}>
                          <TableCell>
                            <div>
                                <div className="font-medium">{establishment.name}</div>
                                <div className="text-sm text-muted-foreground">{establishment.type}</div>
                            </div>
                          </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {establishment.type === "restaurant" ? "🍽️ Restaurant" :
                                 establishment.type === "cafe" ? "☕ Cafe" : "🏨 Hotel"}
                              </Badge>
                            </TableCell>
                          <TableCell>
                            <div>
                                <div className="font-medium">{establishment.ownerId}</div>
                                <div className="text-sm text-muted-foreground">{establishment.email}</div>
                            </div>
                          </TableCell>
                            <TableCell>{establishment.location}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                  establishment.isApproved
                                  ? "default"
                                    : "secondary"
                                }
                              >
                                {establishment.isApproved ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                              <Badge variant={establishment.subscription.tier === 'core' ? "outline" : "default"}>
                                {establishment.subscription.tier === 'core' ? (
                                  "Core"
                                ) : establishment.subscription.tier === 'pro' ? (
                                <>
                                  <Star className="h-3 w-3 mr-1" />
                                    Pro
                                </>
                              ) : (
                                  <>
                                    <Crown className="h-3 w-3 mr-1" />
                                    Enterprise
                                  </>
                              )}
                            </Badge>
                          </TableCell>
                            <TableCell>
                              {new Date(establishment.createdAt).toLocaleDateString()}
                            </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                                {!establishment.isApproved && (
                                <>
                                    <Button size="sm" onClick={() => handleApproval(establishment, "approve")}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                      onClick={() => handleApproval(establishment, "reject")}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                                {establishment.isApproved && (
                                  <Button size="sm" variant="outline" onClick={() => toggleSubscription(establishment)}>
                                  <Star className="h-3 w-3 mr-1" />
                                    Upgrade Tier
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openTypeChangeDialog(establishment)}>
                                Change Type
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-3 w-3" />
                              </Button>
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

            {/* Attached Establishments Tab */}
            <TabsContent value="attached" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Hotel Attached Establishment Requests</h3>
                  <p className="text-sm text-muted-foreground">Review and approve hotel requests for attached establishments</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>
                    Hotel managers requesting to add attached establishments (restaurants, cafes, bakeries, bars)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attachedEstablishments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending attached establishment requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attachedEstablishments.map((est) => (
                        <div key={est.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="capitalize">
                                  {est.type}
                                </Badge>
                                <h4 className="font-medium">{est.name}</h4>
                                <span className="text-sm text-muted-foreground">
                                  from {est.hotelName}
                                </span>
                              </div>
                              {est.description && (
                                <p className="text-sm text-muted-foreground mt-2">{est.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Requested: {new Date(est.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleAttachedEstablishmentAction(est.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleAttachedEstablishmentAction(est.id, 'reject')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
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

            {/* Change Establishment Type Dialog */}
            <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Establishment Type</DialogTitle>
                  <DialogDescription>
                    Update the type for {typeTarget?.name}. This may alter available features across dashboards.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>New Type</Label>
                  <Select value={pendingType} onValueChange={(v: any) => setPendingType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                      <SelectItem value="cafe">☕ Cafe</SelectItem>
                      <SelectItem value="hotel">🏨 Hotel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancel</Button>
                  <Button onClick={confirmTypeChange}>Confirm</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">Manage platform users, roles, and permissions</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowBulkUserDialog(true)}
                    disabled={selectedUsers.length === 0}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Actions ({selectedUsers.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportData('users')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* User Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Platform-wide user count
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.isActive).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {users.length > 0 ? Math.round((users.filter(u => u.isActive).length / users.length) * 100) : 0}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
                    <Lock className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.isLocked).length}
              </div>
                    <p className="text-xs text-muted-foreground">
                      Accounts requiring unlock
                    </p>
                  </CardContent>
                </Card>

              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active in last 7 days
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="search">Search Users</Label>
                      <Input
                        id="search"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Filter by Role</Label>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="waiter">Waiter</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="inventory">Inventory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Filter by Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSearchTerm("")
                          setFilterRole("all")
                          setFilterStatus("all")
                          setCurrentPage(1)
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                      <p className="text-muted-foreground">No users match your current filters.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <input
                              type="checkbox"
                              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(filteredUsers.map(u => u._id))
                                } else {
                                  setSelectedUsers([])
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Restaurant</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers(prev => [...prev, user._id])
                                  } else {
                                    setSelectedUsers(prev => prev.filter(id => id !== user._id))
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {user.role.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.restaurantId || "Platform User"}
                            </TableCell>
                            <TableCell>
                              {user.phone || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "destructive"}>
                                {user.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {user.isLocked && (
                                  <Badge variant="destructive" className="text-xs">
                                    🔒 Locked
                                  </Badge>
                                )}
                                {((user.loginAttempts || 0) > 0) && (
                                  <Badge variant="outline" className="text-xs">
                                    ⚠️ {(user.loginAttempts || 0)} attempts
                                  </Badge>
                                )}
                                {!user.isLocked && (user.loginAttempts || 0) === 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    ✅ Normal
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.lastLogin 
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : "Never"
                              }
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {user.isActive ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleUserAction(user, "deactivate")}
                                  >
                                    <UserMinus className="h-3 w-3 mr-1" />
                                    Deactivate
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleUserAction(user, "activate")}
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Activate
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleUserAction(user, "changeRole")}
                                >
                                  <Key className="h-3 w-3 mr-1" />
                                  Change Role
                                </Button>
                                {user.isLocked && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleUserAction(user, "unlock")}
                                  >
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Unlock
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleUserAction(user, "resetPassword")}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Reset Password
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowUserDetailsDialog(true)
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {Math.ceil(filteredUsers.length / usersPerPage)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage >= Math.ceil(filteredUsers.length / usersPerPage)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Premium Features Tab */}
            <TabsContent value="premium" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Subscription Management</h3>
                  <p className="text-sm text-muted-foreground">Manage subscription tiers and features for establishments</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowBulkSubscriptionDialog(true)}
                    disabled={establishments.length === 0}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Operations
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportData('restaurants')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Subscription Data
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Subscription Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Core Tier</CardTitle>
                    <div className="text-2xl">🏪</div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.coreEstablishments}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalEstablishments > 0 ? Math.round((stats.coreEstablishments / stats.totalEstablishments) * 100) : 0}% of total
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">Free</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pro Tier</CardTitle>
                    <div className="text-2xl">⭐</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.proEstablishments}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalEstablishments > 0 ? Math.round((stats.proEstablishments / stats.totalEstablishments) * 100) : 0}% of total
                    </p>
                    <div className="mt-2">
                      <Badge variant="default" className="text-xs bg-purple-600">RWF 25K/mo</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enterprise Tier</CardTitle>
                    <div className="text-2xl">🚀</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.enterpriseEstablishments}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalEstablishments > 0 ? Math.round((stats.enterpriseEstablishments / stats.totalEstablishments) * 100) : 0}% of total
                    </p>
                    <div className="mt-2">
                      <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-600 to-pink-600">RWF 100K/mo</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      RWF {((stats.proEstablishments * 25000) + (stats.enterpriseEstablishments * 100000)).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pro: RWF {(stats.proEstablishments * 25000).toLocaleString()} | Enterprise: RWF {(stats.enterpriseEstablishments * 100000).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Analytics */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                    <CardTitle className="text-lg">Revenue Analytics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          RWF {(stats.proEstablishments * 25000).toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">Monthly Pro Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          RWF {(stats.enterpriseEstablishments * 100000).toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-600">Monthly Enterprise Revenue</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                          <div className="flex justify-between">
                        <span>Annual Pro Revenue:</span>
                        <span className="font-bold">RWF {(stats.proEstablishments * 25000 * 12).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                        <span>Annual Enterprise Revenue:</span>
                        <span className="font-bold">RWF {(stats.enterpriseEstablishments * 100000 * 12).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                        <span>Total Annual Revenue:</span>
                        <span className="font-bold text-green-600">
                          RWF {((stats.proEstablishments * 25000 * 12) + (stats.enterpriseEstablishments * 100000 * 12)).toLocaleString()}
                        </span>
                      </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                    <CardTitle className="text-lg">Tier Distribution</CardTitle>
                        </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Core (Free)</span>
                          </div>
                        <div className="text-right">
                          <div className="font-bold">{stats.coreEstablishments}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.totalEstablishments > 0 ? Math.round((stats.coreEstablishments / stats.totalEstablishments) * 100) : 0}%
                          </div>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">Pro (RWF 25K/mo)</span>
                          </div>
                        <div className="text-right">
                          <div className="font-bold">{stats.proEstablishments}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.totalEstablishments > 0 ? Math.round((stats.proEstablishments / stats.totalEstablishments) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                          <span className="text-sm">Enterprise (RWF 100K/mo)</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{stats.enterpriseEstablishments}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.totalEstablishments > 0 ? Math.round((stats.enterpriseEstablishments / stats.totalEstablishments) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Total Establishments:</span>
                        <span className="font-bold">{stats.totalEstablishments}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Premium Conversion:</span>
                        <span className="font-bold text-green-600">
                          {stats.totalEstablishments > 0 
                            ? Math.round(((stats.proEstablishments + stats.enterpriseEstablishments) / stats.totalEstablishments) * 100)
                            : 0}%
                        </span>
                      </div>
                          </div>
                        </CardContent>
                      </Card>
              </div>

              {/* Subscription Analytics & Insights */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Growth Insights</CardTitle>
                    <CardDescription>Key metrics and trends for subscription management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {stats.totalEstablishments > 0 
                            ? Math.round(((stats.proEstablishments + stats.enterpriseEstablishments) / stats.totalEstablishments) * 100)
                            : 0}%
                        </div>
                        <div className="text-xs text-green-600">Premium Conversion Rate</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          RWF {((stats.proEstablishments * 25000 * 12) + (stats.enterpriseEstablishments * 100000 * 12)).toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">Annual Revenue</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Average Revenue per Establishment:</span>
                        <span className="font-bold">
                          RWF {stats.totalEstablishments > 0 
                            ? Math.round(((stats.proEstablishments * 25000) + (stats.enterpriseEstablishments * 100000)) / stats.totalEstablishments)
                            : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Revenue Growth Potential:</span>
                        <span className="font-bold text-green-600">
                          RWF {(stats.coreEstablishments * 25000).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        *If all Core establishments upgrade to Pro
                    </div>
                  </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common subscription management tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        const coreEstablishments = establishments.filter(r => r.subscription?.tier === 'core').map(r => r._id)
                        if (coreEstablishments.length > 0) {
                          setSelectedEstablishmentsForBulk(coreEstablishments)
                          setBulkSubscriptionTier('pro')
                          setBulkSubscriptionAction('upgrade')
                          setShowBulkSubscriptionDialog(true)
                        }
                      }}
                      disabled={establishments.filter(r => r.subscription?.tier === 'core').length === 0}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Upgrade All Core to Pro
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        const proEstablishments = establishments.filter(r => r.subscription?.tier === 'pro').map(r => r._id)
                        if (proEstablishments.length > 0) {
                          setSelectedEstablishmentsForBulk(proEstablishments)
                          setBulkSubscriptionTier('enterprise')
                          setBulkSubscriptionAction('upgrade')
                          setShowBulkSubscriptionDialog(true)
                        }
                      }}
                      disabled={establishments.filter(r => r.subscription?.tier === 'pro').length === 0}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade All Pro to Enterprise
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportData('restaurants')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Subscription Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription Tier Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Tier Comparison</CardTitle>
                  <CardDescription>Compare features and limits across all subscription tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feature</TableHead>
                          <TableHead className="text-center">Core (Free)</TableHead>
                          <TableHead className="text-center">Pro (RWF 25K/mo)</TableHead>
                          <TableHead className="text-center">Enterprise (RWF 100K/mo)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Employees</TableCell>
                          <TableCell className="text-center">Up to 5</TableCell>
                          <TableCell className="text-center">Up to 20</TableCell>
                          <TableCell className="text-center">Unlimited</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Menu Items</TableCell>
                          <TableCell className="text-center">50</TableCell>
                          <TableCell className="text-center">200</TableCell>
                          <TableCell className="text-center">Unlimited</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Orders</TableCell>
                          <TableCell className="text-center">1,000/month</TableCell>
                          <TableCell className="text-center">Unlimited</TableCell>
                          <TableCell className="text-center">Unlimited</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Analytics</TableCell>
                          <TableCell className="text-center">Basic</TableCell>
                          <TableCell className="text-center">Advanced</TableCell>
                          <TableCell className="text-center">AI-Powered</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">AI Features</TableCell>
                          <TableCell className="text-center">❌</TableCell>
                          <TableCell className="text-center">✅</TableCell>
                          <TableCell className="text-center">✅ NeuralSuite</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">White Label</TableCell>
                          <TableCell className="text-center">❌</TableCell>
                          <TableCell className="text-center">❌</TableCell>
                          <TableCell className="text-center">✅</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-center">Storage</TableCell>
                          <TableCell className="text-center">1GB</TableCell>
                          <TableCell className="text-center">10GB</TableCell>
                          <TableCell className="text-center">100GB</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Support</TableCell>
                          <TableCell className="text-center">Email</TableCell>
                          <TableCell className="text-center">Priority</TableCell>
                          <TableCell className="text-center">24/7 Dedicated</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Establishment Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Tier Management</CardTitle>
                  <CardDescription>Manage subscription tiers for individual establishments</CardDescription>
                </CardHeader>
                <CardContent>
                  {establishments.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Establishments Found</h3>
                      <p className="text-muted-foreground">Establishments will appear here once they register.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Establishments</h4>
                        <div className="flex space-x-2">
                          <Badge variant="outline">
                            Core: {establishments.filter(r => r.subscription?.tier === 'core').length}
                          </Badge>
                          <Badge variant="outline">
                            Pro: {establishments.filter(r => r.subscription?.tier === 'pro').length}
                          </Badge>
                          <Badge variant="outline">
                            Enterprise: {establishments.filter(r => r.subscription?.tier === 'enterprise').length}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const coreEstablishments = establishments.filter(r => r.subscription?.tier === 'core').map(r => r._id)
                            if (coreEstablishments.length > 0) {
                              bulkSubscriptionOperation('upgrade', coreEstablishments, 'pro')
                            }
                          }}
                          disabled={establishments.filter(r => r.subscription?.tier === 'core').length === 0}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Upgrade All Core to Pro
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const proEstablishments = establishments.filter(r => r.subscription?.tier === 'pro').map(r => r._id)
                            if (proEstablishments.length > 0) {
                              bulkSubscriptionOperation('upgrade', proEstablishments, 'enterprise')
                            }
                          }}
                          disabled={establishments.filter(r => r.subscription?.tier === 'pro').length === 0}
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Upgrade All Pro to Enterprise
                        </Button>
                      </div>
                      
                      <div className="grid gap-3">
                        {establishments.map((establishment) => (
                          <div key={establishment._id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{establishment.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {establishment.type} • {establishment.location}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Owner: {establishment.ownerId}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={establishment.subscription?.tier === 'core' ? "outline" : "default"}>
                                {establishment.subscription?.tier === 'core' ? (
                                  "🏪 Core"
                                ) : establishment.subscription?.tier === 'pro' ? (
                                  <>
                                    ⭐ Pro
                                  </>
                                ) : (
                                  <>
                                    🚀 Enterprise
                                  </>
                                )}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSubscription(establishment)}
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Change Tier
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="audit" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">Track all system activities and user actions</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => exportData('audit-logs')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
                      <p className="text-muted-foreground">System activities will be logged here.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>{log.target}</TableCell>
                            <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                            <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Settings Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Platform Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure global platform settings and preferences</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={validateSettings}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate
                  </Button>
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" onClick={resetSettingsToDefaults}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>

              {/* Settings Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Settings Overview</span>
                  </CardTitle>
                  <CardDescription>Current platform configuration status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {settings.allowUserRegistration ? "✓" : "✗"}
                      </div>
                      <div className="text-sm text-muted-foreground">User Registration</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {settings.autoApproval === "auto" ? "✓" : "✗"}
                      </div>
                      <div className="text-sm text-muted-foreground">Auto Approval</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {settings.maintenanceMode ? "⚠️" : "✓"}
                      </div>
                      <div className="text-sm text-muted-foreground">Maintenance Mode</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {settings.analyticsEnabled ? "✓" : "✗"}
                      </div>
                      <div className="text-sm text-muted-foreground">Analytics</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Last Updated:</span>
                      <span className="text-muted-foreground">
                        {((settings as any).lastUpdated ? new Date((settings as any).lastUpdated).toLocaleString() : "Never")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Updated By:</span>
                      <span className="text-muted-foreground">
                        {(settings as any).updatedBy || "System"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Platform Configuration</span>
                  </CardTitle>
                  <CardDescription>Basic platform information and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Platform Name</Label>
                      <Input 
                        value={settings.platformName}
                        onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                        placeholder="Ingagi ERP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Platform Description</Label>
                      <Input 
                        value={settings.platformDescription}
                        onChange={(e) => setSettings(prev => ({ ...prev, platformDescription: e.target.value }))}
                        placeholder="Comprehensive restaurant and hotel management platform"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Support Email</Label>
                      <Input 
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                        placeholder="support@ingagi.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Support Phone</Label>
                      <Input 
                        value={settings.supportPhone}
                        onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                        placeholder="+250 788 123 456"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Business Settings</span>
                  </CardTitle>
                  <CardDescription>Pricing, commission, and business rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Rate (%)</Label>
                      <Input 
                        type="number" 
                        value={settings.commissionRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, commissionRate: Number(e.target.value) }))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Premium Price (RWF/month)</Label>
                      <Input 
                        type="number" 
                        value={settings.premiumPrice}
                        onChange={(e) => setSettings(prev => ({ ...prev, premiumPrice: Number(e.target.value) }))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Enterprise Price (RWF/month)</Label>
                      <Input 
                        type="number" 
                        value={settings.enterprisePrice}
                        onChange={(e) => setSettings(prev => ({ ...prev, enterprisePrice: Number(e.target.value) }))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Free Trial Days</Label>
                      <Input 
                        type="number" 
                        value={settings.freeTrialDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, freeTrialDays: Number(e.target.value) }))}
                        min="0"
                        max="365"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-approval for Establishments</Label>
                      <Select 
                        value={settings.autoApproval} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, autoApproval: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Approval</SelectItem>
                          <SelectItem value="auto">Auto Approval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>Authentication, session, and security policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input 
                        type="number" 
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                        min="15"
                        max="1440"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Login Attempts</Label>
                      <Input 
                        type="number" 
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password Minimum Length</Label>
                      <Input 
                        type="number" 
                        value={settings.passwordMinLength}
                        onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
                        min="6"
                        max="32"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Require Two-Factor Authentication</Label>
                      <Select 
                        value={settings.requireTwoFactor ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, requireTwoFactor: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Management Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Management</span>
                  </CardTitle>
                  <CardDescription>User registration, verification, and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Allow User Registration</Label>
                      <Select 
                        value={settings.allowUserRegistration ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, allowUserRegistration: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Require Email Verification</Label>
                      <Select 
                        value={settings.requireEmailVerification ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, requireEmailVerification: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Require Phone Verification</Label>
                      <Select 
                        value={settings.requirePhoneVerification ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, requirePhoneVerification: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Users per Restaurant</Label>
                      <Input 
                        type="number" 
                        value={settings.maxUsersPerRestaurant}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxUsersPerRestaurant: Number(e.target.value) }))}
                        min="1"
                        max="1000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Restaurant Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="h-5 w-5" />
                    <span>Restaurant Limits by Tier</span>
                  </CardTitle>
                  <CardDescription>Configure limits for different subscription tiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Core Tier Limits */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Core Tier (Free)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Max Menu Items</Label>
                        <Input 
                          type="number" 
                          value={settings.maxMenuItems.core}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxMenuItems: { ...prev.maxMenuItems, core: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Employees</Label>
                        <Input 
                          type="number" 
                          value={settings.maxEmployees.core}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxEmployees: { ...prev.maxEmployees, core: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Orders</Label>
                        <Input 
                          type="number" 
                          value={settings.maxOrders.core}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxOrders: { ...prev.maxOrders, core: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pro Tier Limits */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Pro Tier (Premium)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Max Menu Items</Label>
                        <Input 
                          type="number" 
                          value={settings.maxMenuItems.pro}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxMenuItems: { ...prev.maxMenuItems, pro: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Employees</Label>
                        <Input 
                          type="number" 
                          value={settings.maxEmployees.pro}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxEmployees: { ...prev.maxEmployees, pro: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Orders</Label>
                        <Input 
                          type="number" 
                          value={settings.maxOrders.pro}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxOrders: { ...prev.maxOrders, pro: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enterprise Tier Limits */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Enterprise Tier</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Max Menu Items</Label>
                        <Input 
                          type="number" 
                          value={settings.maxMenuItems.enterprise}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxMenuItems: { ...prev.maxMenuItems, enterprise: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Employees</Label>
                        <Input 
                          type="number" 
                          value={settings.maxEmployees.enterprise}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxEmployees: { ...prev.maxEmployees, enterprise: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Orders</Label>
                        <Input 
                          type="number" 
                          value={settings.maxOrders.enterprise}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxOrders: { ...prev.maxOrders, enterprise: Number(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                  <CardDescription>Configure notification preferences and channels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Notifications</Label>
                      <Select 
                        value={settings.emailNotifications ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, emailNotifications: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>SMS Notifications</Label>
                      <Select 
                        value={settings.smsNotifications ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, smsNotifications: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Push Notifications</Label>
                      <Select 
                        value={settings.pushNotifications ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, pushNotifications: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notification Frequency</Label>
                      <Select 
                        value={settings.notificationFrequency} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, notificationFrequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>System Settings</span>
                  </CardTitle>
                  <CardDescription>System configuration and maintenance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maintenance Mode</Label>
                      <Select 
                        value={settings.maintenanceMode ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, maintenanceMode: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Disabled</SelectItem>
                          <SelectItem value="true">Enabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Debug Mode</Label>
                      <Select 
                        value={settings.debugMode ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, debugMode: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Disabled</SelectItem>
                          <SelectItem value="true">Enabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Log Level</Label>
                      <Select 
                        value={settings.logLevel} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, logLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Backup Frequency</Label>
                      <Select 
                        value={settings.backupFrequency} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Retention (days)</Label>
                      <Input 
                        type="number" 
                        value={settings.dataRetentionDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: Number(e.target.value) }))}
                        min="30"
                        max="3650"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Settings</span>
                  </CardTitle>
                  <CardDescription>Payment gateway and financial configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Gateway</Label>
                      <Select 
                        value={settings.paymentGateway} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, paymentGateway: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="momo">Mobile Money</SelectItem>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={settings.currency} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RWF">RWF (Rwandan Franc)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input 
                        type="number" 
                        value={settings.taxRate}
                        onChange={(e) => setSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Allow Partial Payments</Label>
                      <Select 
                        value={settings.allowPartialPayments ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, allowPartialPayments: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Analytics & Privacy</span>
                  </CardTitle>
                  <CardDescription>Data collection, analytics, and privacy compliance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Analytics Enabled</Label>
                      <Select 
                        value={settings.analyticsEnabled ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, analyticsEnabled: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Collection</Label>
                      <Select 
                        value={settings.dataCollection ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, dataCollection: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Privacy Compliance</Label>
                      <Select 
                        value={settings.privacyCompliance ? "true" : "false"} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, privacyCompliance: value === "true" }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Report Retention (days)</Label>
                      <Input 
                        type="number" 
                        value={settings.reportRetention}
                        onChange={(e) => setSettings(prev => ({ ...prev, reportRetention: Number(e.target.value) }))}
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  onClick={saveSettings} 
                  disabled={settingsLoading}
                  className="min-w-[120px]"
                >
                  {settingsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save All Settings'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{approvalAction === "approve" ? "Approve Restaurant" : "Reject Restaurant"}</DialogTitle>
              <DialogDescription>
                {approvalAction === "approve"
                  ? "Are you sure you want to approve this restaurant?"
                  : "Please provide a reason for rejecting this restaurant."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEstablishment && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">{selectedEstablishment.name}</h4>
                  <p className="text-sm text-muted-foreground">Owner: {selectedEstablishment.ownerId}</p>
                  <p className="text-sm text-muted-foreground">Location: {selectedEstablishment.location}</p>
                </div>
              )}
              {approvalAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why this establishment is being rejected..."
                    rows={3}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmApproval} variant={approvalAction === "approve" ? "default" : "destructive"}>
                  {approvalAction === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subscription Dialog */}
        <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Change Subscription Tier
              </DialogTitle>
              <DialogDescription>
                Select the new subscription tier for this establishment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEstablishment && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">{selectedEstablishment.name}</h4>
                  <p className="text-sm text-muted-foreground">Owner: {selectedEstablishment.ownerId}</p>
                  <p className="text-sm text-muted-foreground">Type: {selectedEstablishment.type}</p>
                  <p className="text-sm text-muted-foreground">Location: {selectedEstablishment.location}</p>
                </div>
              )}

              <div className="space-y-3">
                <Label>Select New Tier</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newSubscriptionTier === 'core' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewSubscriptionTier('core')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏪</div>
                      <div className="font-semibold">Core</div>
                      <div className="text-sm text-muted-foreground">Free</div>
                      <div className="text-xs text-muted-foreground mt-1">Up to 5 employees</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newSubscriptionTier === 'pro' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewSubscriptionTier('pro')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⭐</div>
                      <div className="font-semibold">Pro</div>
                      <div className="text-sm text-muted-foreground">RWF 25K/mo</div>
                      <div className="text-xs text-muted-foreground mt-1">Up to 20 employees</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      newSubscriptionTier === 'enterprise' 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setNewSubscriptionTier('enterprise')}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚀</div>
                      <div className="font-semibold">Enterprise</div>
                      <div className="text-sm text-muted-foreground">RWF 100K/mo</div>
                      <div className="text-xs text-muted-foreground mt-1">Unlimited</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPremiumDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmSubscriptionToggle}>
                  Update to {newSubscriptionTier.charAt(0).toUpperCase() + newSubscriptionTier.slice(1)} Tier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Action Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {userAction === "activate" ? "Activate User" : 
                 userAction === "deactivate" ? "Deactivate User" : "Change User Role"}
              </DialogTitle>
              <DialogDescription>
                {userAction === "activate" ? "Are you sure you want to activate this user?" :
                 userAction === "deactivate" ? "Are you sure you want to deactivate this user?" :
                 "Select a new role for this user."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedUser && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">{selectedUser.name}</h4>
                  <p className="text-sm text-muted-foreground">Email: {selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">Current Role: {selectedUser.role}</p>
                </div>
              )}
              {userAction === "changeRole" && (
                <div className="space-y-2">
                  <Label htmlFor="newRole">New Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmUserAction} 
                  variant={userAction === "deactivate" ? "destructive" : "default"}
                  disabled={userAction === "changeRole" && !newUserRole}
                >
                  {userAction === "activate" ? "Activate" : 
                   userAction === "deactivate" ? "Deactivate" : "Change Role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* System Dialog */}
        <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>System Information & Controls</DialogTitle>
              <DialogDescription>Monitor system health and perform administrative actions</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant={
                        stats.systemHealth === "excellent" ? "default" :
                        stats.systemHealth === "good" ? "secondary" :
                        stats.systemHealth === "warning" ? "outline" : "destructive"
                      }
                    >
                      {stats.systemHealth}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{stats.uptime}%</span>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Administrative Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={fetchDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                  <Button variant="outline" onClick={() => exportData('restaurants')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Database Backup
                  </Button>
                  <Button variant="outline">
                    <Server className="h-4 w-4 mr-2" />
                    System Restart
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowSystemDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Subscription Dialog */}
        <Dialog open={showBulkSubscriptionDialog} onOpenChange={setShowBulkSubscriptionDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Bulk Subscription Management</DialogTitle>
              <DialogDescription>
                Select establishments and perform bulk subscription operations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Operation Type</Label>
                  <Select value={bulkSubscriptionAction} onValueChange={(value: 'upgrade' | 'downgrade') => setBulkSubscriptionAction(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upgrade">Upgrade Tier</SelectItem>
                      <SelectItem value="downgrade">Downgrade Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Tier</Label>
                  <Select value={bulkSubscriptionTier} onValueChange={(value: 'core' | 'pro' | 'enterprise') => setBulkSubscriptionTier(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core (Free)</SelectItem>
                      <SelectItem value="pro">Pro (RWF 25K/mo)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (RWF 100K/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <Label>Select Establishments</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEstablishmentsForBulk.length} of {establishments.length} selected
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllEstablishments}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllSelections}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                {establishments.map((establishment) => (
                  <div key={establishment._id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                    <input
                      type="checkbox"
                      checked={selectedEstablishmentsForBulk.includes(establishment._id)}
                      onChange={() => handleBulkSubscriptionSelection(establishment._id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{establishment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {establishment.subscription?.tier?.charAt(0).toUpperCase() + establishment.subscription?.tier?.slice(1) || 'Core'}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {establishment.type}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowBulkSubscriptionDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={executeBulkSubscriptionOperation}
                  disabled={selectedEstablishmentsForBulk.length === 0}
                >
                  {bulkSubscriptionAction === 'upgrade' ? 'Upgrade' : 'Downgrade'} {selectedEstablishmentsForBulk.length} Establishment{selectedEstablishmentsForBulk.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk User Actions Dialog */}
        <Dialog open={showBulkUserDialog} onOpenChange={setShowBulkUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk User Management</DialogTitle>
              <DialogDescription>
                Perform actions on {selectedUsers.length} selected users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <Select value={userAction} onValueChange={(value: 'activate' | 'deactivate' | 'changeRole') => setUserAction(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activate">Activate Users</SelectItem>
                      <SelectItem value="deactivate">Deactivate Users</SelectItem>
                      <SelectItem value="changeRole">Change Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {userAction === "changeRole" && (
                  <div>
                    <Label>New Role</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              )}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Selected Users:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u._id === userId)
                    return user ? (
                      <div key={userId} className="text-sm flex items-center space-x-2">
                        <span>•</span>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground">({user.email})</span>
                        <Badge variant="outline" className="text-xs">{user.role}</Badge>
                      </div>
                    ) : null
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowBulkUserDialog(false)}>
                  Cancel
                </Button>
                                <Button 
                  onClick={executeBulkUserOperation}
                  disabled={selectedUsers.length === 0 || (userAction === "changeRole" && !newUserRole)}
                >
                  {userAction === 'activate' ? 'Activate' : userAction === 'deactivate' ? 'Deactivate' : 'Change Role'} {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-semibold">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge variant="outline" className="text-sm">
                      {selectedUser.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-lg">{selectedUser.phone || "Not provided"}</p>
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Account Active</span>
                      <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                        {selectedUser.isActive ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Account Locked</span>
                      <Badge variant={selectedUser.isLocked ? "destructive" : "default"}>
                        {selectedUser.isLocked ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Login Attempts</span>
                      <Badge variant={(selectedUser.loginAttempts || 0) > 0 ? "destructive" : "default"}>
                        {(selectedUser.loginAttempts || 0)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Restaurant Information */}
                {selectedUser.restaurantId && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Restaurant Assignment</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="font-medium">Restaurant ID: {selectedUser.restaurantId}</p>
                      {(() => {
                        const restaurant = establishments.find(e => e._id === selectedUser.restaurantId)
                        return restaurant ? (
                          <div className="mt-2 space-y-1">
                            <p><strong>Name:</strong> {restaurant.name}</p>
                            <p><strong>Type:</strong> {restaurant.type}</p>
                            <p><strong>Location:</strong> {restaurant.location}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Restaurant details not found</p>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
                    <p className="text-sm">
                      {selectedUser.lastLogin 
                        ? new Date(selectedUser.lastLogin).toLocaleString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowUserDetailsDialog(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowUserDetailsDialog(false)
                      setShowUserDialog(true)
                    }}
                  >
                    Edit User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

