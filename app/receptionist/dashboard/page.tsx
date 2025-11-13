"use client"

import { useState, useMemo, useEffect } from "react"
import { GlobalLoading } from "@/components/global-loading"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Users, Clock, Phone, LogOut, Settings, Bell, Shield, User, Mail, MapPin, Globe, Key, Eye, EyeOff, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { isProOrAbove } from "@/lib/subscription-access"
import { AIHints } from "@/components/ai-hints"

interface RoomServiceRequest {
  id: string
  roomNumber: string
  customerName: string
  requestType: string
  description: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  requestedAt: string
  completedAt?: string
}

interface HotelReservation {
  id: string
  customerName: string
  customerPhone: string
  checkIn: string
  checkOut: string
  roomType: string
  guests: number
  status: "confirmed" | "pending" | "cancelled" | "checked_in" | "checked_out"
  specialRequests?: string
}

interface RoomBooking {
  _id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  roomType: string
  roomId?: string
  roomPrice: number
  totalAmount: number
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed"
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

const MOCK_ROOM_SERVICE_REQUESTS: RoomServiceRequest[] = []

const MOCK_HOTEL_RESERVATIONS: HotelReservation[] = []

interface RoomServiceFormProps {
  guest: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}

const RoomServiceForm = ({ guest, onSubmit, onCancel, isLoading }: RoomServiceFormProps) => {
  const [serviceData, setServiceData] = useState({
    serviceType: "",
    description: "",
    priority: "normal",
    estimatedTime: "",
    specialInstructions: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(serviceData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="serviceType">Service Type *</Label>
        <Select 
          value={serviceData.serviceType} 
          onValueChange={(value) => setServiceData({...serviceData, serviceType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="housekeeping">Housekeeping</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="room-service">Room Service</SelectItem>
            <SelectItem value="laundry">Laundry</SelectItem>
            <SelectItem value="extra-towels">Extra Towels</SelectItem>
            <SelectItem value="extra-pillows">Extra Pillows</SelectItem>
            <SelectItem value="wifi-issue">WiFi Issue</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={serviceData.description}
          onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
          placeholder="Describe the service request..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select 
          value={serviceData.priority} 
          onValueChange={(value) => setServiceData({...serviceData, priority: value})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="estimatedTime">Estimated Completion Time</Label>
        <Select 
          value={serviceData.estimatedTime} 
          onValueChange={(value) => setServiceData({...serviceData, estimatedTime: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="120">2 hours</SelectItem>
            <SelectItem value="240">4 hours</SelectItem>
            <SelectItem value="480">8 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="specialInstructions">Special Instructions</Label>
        <Textarea
          id="specialInstructions"
          value={serviceData.specialInstructions}
          onChange={(e) => setServiceData({...serviceData, specialInstructions: e.target.value})}
          placeholder="Any special instructions for the service team..."
          rows={2}
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Guest:</strong> {guest.customerName} | <strong>Room:</strong> {guest.roomType}
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !serviceData.serviceType || !serviceData.description}>
          {isLoading ? "Submitting..." : "Submit Request"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function ReceptionistDashboard() {
  const { user, logout } = useAuth()
  const [roomServiceRequests, setRoomServiceRequests] = useState<RoomServiceRequest[]>([])
  const [hotelReservations, setHotelReservations] = useState<HotelReservation[]>([])
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([])
  const [loading, setLoading] = useState(true)
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      newBookings: true,
      checkIns: true,
      checkOuts: true,
      roomService: true,
      urgentRequests: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    },
    hotel: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      timezone: "Africa/Kigali",
      currency: "RWF",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      lateCheckOutFee: 50000,
      cancellationPolicy: "Free cancellation up to 24 hours before check-in",
      wifiPassword: "",
      emergencyContact: "",
      amenities: [] as string[]
    },
    reception: {
      autoApproveBookings: false,
      requireGuestID: true,
      allowEarlyCheckIn: false,
      allowLateCheckOut: false,
      maxGuestsPerRoom: 4,
      defaultRoomServiceTime: 30,
      housekeepingSchedule: "08:00",
      maintenanceRequests: true,
      guestFeedback: true,
      loyaltyProgram: false
    },
    security: {
      requirePhotoID: true,
      trackGuestAccess: true,
      monitorCommonAreas: true,
      emergencyProcedures: true,
      guestDataRetention: 365,
      twoFactorAuth: false,
      sessionTimeout: 30,
      auditLogs: true
    }
  })

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    personalInfo: {
      firstName: user?.name?.split(' ')[0] || "",
      lastName: user?.name?.split(' ').slice(1).join(' ') || "",
      email: user?.email || "",
      phone: "",
      position: "Receptionist",
      department: "Front Desk",
      employeeId: "",
      hireDate: "",
      emergencyContact: "",
      emergencyPhone: ""
    },
    preferences: {
      language: "en",
      theme: "light",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      defaultView: "room-bookings",
      autoLogout: true,
      showNotifications: true,
      soundEnabled: true,
      keyboardShortcuts: true
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorEnabled: false,
      backupCodes: [] as string[],
      lastPasswordChange: "",
      loginHistory: [] as any[],
      activeSessions: [] as any[]
    }
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showGuestDetailsDialog, setShowGuestDetailsDialog] = useState(false)
  const [showRoomServiceDialog, setShowRoomServiceDialog] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<any>(null)

  const isReceptionSupported = useMemo(() => {
    const t = (user as any)?.establishmentType?.toString().toLowerCase()
    // Reception is primarily for hotels with front desk operations
    return t === "hotel"
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.restaurantId) return
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const [bookingsRes, settingsRes, accountSettingsRes] = await Promise.all([
          fetch(`/api/hotel/${user.restaurantId}/bookings`),
          fetch(`/api/receptionist/${user.restaurantId}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/receptionist/${user.restaurantId}/account-settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])
        
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setRoomBookings(Array.isArray(data.bookings) ? data.bookings : [])
        } else {
          setRoomBookings([])
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.success) {
            setSettings(settingsData.settings)
          }
        }

        if (accountSettingsRes.ok) {
          const accountSettingsData = await accountSettingsRes.json()
          if (accountSettingsData.success) {
            setAccountSettings(accountSettingsData.settings)
          }
        }
        
        // For now, use mock data for room service requests and hotel reservations
        // These would be fetched from actual APIs in a real implementation
        setRoomServiceRequests(MOCK_ROOM_SERVICE_REQUESTS)
        setHotelReservations(MOCK_HOTEL_RESERVATIONS)
        
      } catch (e) {
        setRoomServiceRequests([])
        setHotelReservations([])
        setRoomBookings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.restaurantId])

  const pendingRoomServiceRequests = roomServiceRequests.filter((req: any) => req.status === "pending")
  const todayCheckIns = roomBookings.filter((booking: any) => 
    new Date(booking.checkIn).toDateString() === new Date().toDateString()
  )
  const todayCheckOuts = roomBookings.filter((booking: any) => 
    new Date(booking.checkOut).toDateString() === new Date().toDateString()
  )
  const pendingRoomBookings = roomBookings.filter((booking: any) => booking.status === "pending")
  const checkedInGuests = roomBookings.filter((booking: any) => booking.status === "approved")

  const updateRoomServiceRequestStatus = (id: string, status: RoomServiceRequest["status"]) => {
    setRoomServiceRequests((prev) => prev.map((req: any) => (req.id === id ? { ...req, status } : req)))
  }

  const updateHotelReservationStatus = (id: string, status: HotelReservation["status"]) => {
    setHotelReservations((prev) => prev.map((res: any) => (res.id === id ? { ...res, status } : res)))
  }

  const updateRoomBookingStatus = async (id: string, status: RoomBooking["status"]) => {
    try {
      const response = await fetch(`/api/hotel/${user?.restaurantId}/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, status })
      })
      if (response.ok) {
        setRoomBookings((prev) => prev.map((booking: any) => 
          booking._id === id ? { ...booking, status, updatedAt: new Date().toISOString() } : booking
        ))
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  const updateSettings = async (category: string, updates: any) => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")
      
      const updatedSettings = {
        ...settings,
        [category]: {
          ...settings[category as keyof typeof settings],
          ...updates
        }
      }
      setSettings(updatedSettings)
      
      // Save to API
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/receptionist/${user?.restaurantId}/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, updates })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save settings')
        // Revert on error
        setSettings(settings)
      } else {
        setSuccess(`${category} settings updated successfully!`)
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setError('Error updating settings')
      setSettings(settings)
    } finally {
      setIsLoading(false)
    }
  }

  const saveAllSettings = async () => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      // Validate hotel information
      if (settings.hotel.name.trim() && !settings.hotel.email.trim()) {
        setError('Hotel email is required when hotel name is provided')
        return
      }

      if (settings.hotel.email.trim() && !validateEmail(settings.hotel.email)) {
        setError('Please enter a valid hotel email address')
        return
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/receptionist/${user?.restaurantId}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Error saving settings')
    } finally {
      setIsLoading(false)
    }
  }

  const updateAccountSettings = async (category: string, updates: any) => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")
      
      const updatedSettings = {
        ...accountSettings,
        [category]: {
          ...accountSettings[category as keyof typeof accountSettings],
          ...updates
        }
      }
      setAccountSettings(updatedSettings)
      
      // Save to API
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/receptionist/${user?.restaurantId}/account-settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, updates })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save account settings')
        // Revert on error
        setAccountSettings(accountSettings)
      } else {
        setSuccess(`${category} updated successfully!`)
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (error) {
      console.error('Error updating account settings:', error)
      setError('Error updating account settings')
      setAccountSettings(accountSettings)
    } finally {
      setIsLoading(false)
    }
  }

  const changePassword = async () => {
    // Validation
    if (!accountSettings.security.currentPassword) {
      setError('Current password is required')
      return
    }
    
    if (!accountSettings.security.newPassword) {
      setError('New password is required')
      return
    }
    
    if (accountSettings.security.newPassword !== accountSettings.security.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    if (accountSettings.security.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setIsLoading(true)
      setError("")
      setSuccess("")
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/receptionist/${user?.restaurantId}/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: accountSettings.security.currentPassword,
          newPassword: accountSettings.security.newPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Password changed successfully!')
        setAccountSettings(prev => ({
          ...prev,
          security: {
            ...prev.security,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            lastPasswordChange: new Date().toISOString()
          }
        }))
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || 'Failed to change password. Please check your current password.')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError('Error changing password')
    } finally {
      setIsLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleViewGuestDetails = (guest: any) => {
    setSelectedGuest(guest)
    setShowGuestDetailsDialog(true)
  }

  const handleRoomService = (guest: any) => {
    setSelectedGuest(guest)
    setShowRoomServiceDialog(true)
  }

  const handleRoomServiceRequest = async (serviceData: any) => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/receptionist/${user?.restaurantId}/room-service`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...serviceData,
          guestId: selectedGuest._id,
          roomNumber: selectedGuest.roomNumber || selectedGuest.roomType,
          guestName: selectedGuest.customerName,
          hotelId: user?.restaurantId
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Room service request submitted successfully!')
        setShowRoomServiceDialog(false)
        setTimeout(() => setSuccess(""), 5000)
        // Refresh room service requests
        // You might want to add a function to refresh the data here
      } else {
        setError(data.error || 'Failed to submit room service request')
      }
    } catch (error) {
      console.error('Error submitting room service request:', error)
      setError('Error submitting room service request')
    } finally {
      setIsLoading(false)
    }
  }

  const saveAccountSettings = async () => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      // Validate required fields
      if (!accountSettings.personalInfo.firstName.trim()) {
        setError('First name is required')
        return
      }

      if (!accountSettings.personalInfo.email.trim()) {
        setError('Email address is required')
        return
      }

      if (!validateEmail(accountSettings.personalInfo.email)) {
        setError('Please enter a valid email address')
        return
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/receptionist/${user?.restaurantId}/account-settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(accountSettings)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Account settings saved successfully!')
        setTimeout(() => setSuccess(""), 5000)
      } else {
        setError(data.error || 'Failed to save account settings')
      }
    } catch (error) {
      console.error('Error saving account settings:', error)
      setError('Error saving account settings')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "seated":
      case "dining":
        return "default"
      case "pending":
      case "waiting":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "completed":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["receptionist"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Hotel Reception Dashboard</h1>
                <p className="text-muted-foreground mt-1">{(user as any)?.establishmentName || 'Hotel'} • Front Desk Operations</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Welcome, {user?.name}</p>
                  <p className="text-xs text-muted-foreground">Receptionist</p>
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
          {loading && <GlobalLoading />}
          {!isReceptionSupported && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-yellow-800">Hotel Reception Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700">
                  The reception dashboard is designed for hotels with front desk operations.
                  This establishment type does not require hotel reception features.
                </p>
              </CardContent>
            </Card>
          )}
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayCheckIns.length}</div>
                <p className="text-xs text-muted-foreground">Arriving today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Room Bookings</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingRoomBookings.length}</div>
                <p className="text-xs text-muted-foreground">Need approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Room Service Requests</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{pendingRoomServiceRequests.length}</div>
                <p className="text-xs text-muted-foreground">Pending requests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked-in Guests</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{checkedInGuests.length}</div>
                <p className="text-xs text-muted-foreground">Currently staying</p>
              </CardContent>
            </Card>
            {isReceptionSupported && (
              isProOrAbove((user as any)?.subscriptionTier) ? (
                <AIHints 
                  userRole="receptionist" 
                  subscriptionTier={(user as any)?.subscriptionTier} 
                  data={{ roomBookings, roomServiceRequests, hotelReservations }}
                  className="col-span-1"
                />
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Premium Reception</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Upgrade to Pro for advanced reception analytics</div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <Tabs defaultValue="room-bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="room-bookings">Bookings</TabsTrigger>
              <TabsTrigger value="room-service">Room Service</TabsTrigger>
              <TabsTrigger value="guest-management">Guests</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="room-bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Room Booking Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {roomBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No room bookings found</div>
                  ) : (
                  <div className="space-y-4">
                    {roomBookings.map((booking: any) => (
                      <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{booking.customerName}</h3>
                            <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {booking.customerPhone}
                            </p>
                            <p>
                              {booking.roomType} • {booking.guests} guests • {booking.rooms} room(s)
                            </p>
                            <p>
                              Check-in: {new Date(booking.checkIn).toLocaleDateString()} • 
                              Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                            <p className="font-medium text-primary">
                              Total: RWF {booking.totalAmount?.toLocaleString()}
                            </p>
                            {booking.specialRequests && <p>Special: {booking.specialRequests}</p>}
                          </div>
                        </div>
                        <div className="ml-4 space-x-2">
                          {booking.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateRoomBookingStatus(booking._id, "approved")}>
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateRoomBookingStatus(booking._id, "rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {booking.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRoomBookingStatus(booking._id, "completed")}
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="room-service">
              <Card>
                <CardHeader>
                  <CardTitle>Room Service Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {roomServiceRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-4">🏨</div>
                      <p>No room service requests yet.</p>
                      <p className="text-sm text-muted-foreground">Guest requests will appear here.</p>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {roomServiceRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Room {request.roomNumber}</h3>
                            <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Guest:</strong> {request.customerName}</p>
                            <p><strong>Type:</strong> {request.requestType}</p>
                            <p><strong>Description:</strong> {request.description}</p>
                            <p><strong>Requested:</strong> {new Date(request.requestedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="ml-4 space-x-2">
                          {request.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateRoomServiceRequestStatus(request.id, "in_progress")}>
                                Start Service
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateRoomServiceRequestStatus(request.id, "cancelled")}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {request.status === "in_progress" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRoomServiceRequestStatus(request.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guest-management">
              <Card>
                <CardHeader>
                  <CardTitle>Guest Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Today's Check-ins */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Today's Check-ins</h3>
                      {todayCheckIns.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No check-ins scheduled for today</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {todayCheckIns.map((booking: any) => (
                            <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium">{booking.customerName}</h4>
                                  <Badge variant="default">Arriving Today</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <p>{booking.roomType} • {booking.guests} guests • {booking.rooms} room(s)</p>
                                  <p>Check-in: {new Date(booking.checkIn).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              <div className="ml-4">
                                <Button size="sm" variant="outline">
                                  Check In
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Today's Check-outs */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Today's Check-outs</h3>
                      {todayCheckOuts.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No check-outs scheduled for today</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {todayCheckOuts.map((booking: any) => (
                            <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium">{booking.customerName}</h4>
                                  <Badge variant="outline">Departing Today</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <p>{booking.roomType} • {booking.guests} guests • {booking.rooms} room(s)</p>
                                  <p>Check-out: {new Date(booking.checkOut).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              <div className="ml-4">
                                <Button size="sm" variant="outline">
                                  Check Out
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Currently Checked-in Guests */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Currently Checked-in Guests</h3>
                      {checkedInGuests.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No guests currently checked in</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {checkedInGuests.map((booking: any) => (
                            <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium">{booking.customerName}</h4>
                                  <Badge variant="default">Checked In</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <p>{booking.roomType} • {booking.guests} guests • {booking.rooms} room(s)</p>
                                  <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="ml-4 space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewGuestDetails(booking)}
                                >
                                  View Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRoomService(booking)}
                                >
                                  Room Service
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Hotel Reception Settings</h2>
                  <p className="text-muted-foreground">Configure your hotel reception operations and preferences</p>
                </div>
                <Button onClick={saveAllSettings} disabled={isLoading} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save All Settings"}
                </Button>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
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
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Success</h3>
                      <div className="mt-2 text-sm text-green-700">{success}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Booking Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="newBookings">New Booking Requests</Label>
                          <Switch
                            id="newBookings"
                            checked={settings.notifications.newBookings}
                            onCheckedChange={(checked) => updateSettings('notifications', { newBookings: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="checkIns">Check-in Reminders</Label>
                          <Switch
                            id="checkIns"
                            checked={settings.notifications.checkIns}
                            onCheckedChange={(checked) => updateSettings('notifications', { checkIns: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="checkOuts">Check-out Reminders</Label>
                          <Switch
                            id="checkOuts"
                            checked={settings.notifications.checkOuts}
                            onCheckedChange={(checked) => updateSettings('notifications', { checkOuts: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="roomService">Room Service Requests</Label>
                          <Switch
                            id="roomService"
                            checked={settings.notifications.roomService}
                            onCheckedChange={(checked) => updateSettings('notifications', { roomService: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="urgentRequests">Urgent Requests</Label>
                          <Switch
                            id="urgentRequests"
                            checked={settings.notifications.urgentRequests}
                            onCheckedChange={(checked) => updateSettings('notifications', { urgentRequests: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Delivery Methods</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <Switch
                            id="emailNotifications"
                            checked={settings.notifications.emailNotifications}
                            onCheckedChange={(checked) => updateSettings('notifications', { emailNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="smsNotifications">SMS Notifications</Label>
                          <Switch
                            id="smsNotifications"
                            checked={settings.notifications.smsNotifications}
                            onCheckedChange={(checked) => updateSettings('notifications', { smsNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pushNotifications">Push Notifications</Label>
                          <Switch
                            id="pushNotifications"
                            checked={settings.notifications.pushNotifications}
                            onCheckedChange={(checked) => updateSettings('notifications', { pushNotifications: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hotel Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Hotel Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="hotelName">Hotel Name</Label>
                        <Input
                          id="hotelName"
                          value={settings.hotel.name}
                          onChange={(e) => updateSettings('hotel', { name: e.target.value })}
                          placeholder="Enter hotel name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotelAddress">Address</Label>
                        <Textarea
                          id="hotelAddress"
                          value={settings.hotel.address}
                          onChange={(e) => updateSettings('hotel', { address: e.target.value })}
                          placeholder="Enter hotel address"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotelPhone">Phone Number</Label>
                        <Input
                          id="hotelPhone"
                          value={settings.hotel.phone}
                          onChange={(e) => updateSettings('hotel', { phone: e.target.value })}
                          placeholder="+250 XXX XXX XXX"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="hotelEmail">Email Address</Label>
                        <Input
                          id="hotelEmail"
                          type="email"
                          value={settings.hotel.email}
                          onChange={(e) => updateSettings('hotel', { email: e.target.value })}
                          placeholder="info@hotel.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hotelWebsite">Website</Label>
                        <Input
                          id="hotelWebsite"
                          value={settings.hotel.website}
                          onChange={(e) => updateSettings('hotel', { website: e.target.value })}
                          placeholder="https://hotel.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={settings.hotel.timezone} onValueChange={(value) => updateSettings('hotel', { timezone: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Africa/Kigali">Africa/Kigali</SelectItem>
                            <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                            <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</SelectItem>
                            <SelectItem value="Africa/Kampala">Africa/Kampala</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reception Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Reception Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Booking Management</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoApproveBookings">Auto-approve Bookings</Label>
                          <Switch
                            id="autoApproveBookings"
                            checked={settings.reception.autoApproveBookings}
                            onCheckedChange={(checked) => updateSettings('reception', { autoApproveBookings: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireGuestID">Require Guest ID</Label>
                          <Switch
                            id="requireGuestID"
                            checked={settings.reception.requireGuestID}
                            onCheckedChange={(checked) => updateSettings('reception', { requireGuestID: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowEarlyCheckIn">Allow Early Check-in</Label>
                          <Switch
                            id="allowEarlyCheckIn"
                            checked={settings.reception.allowEarlyCheckIn}
                            onCheckedChange={(checked) => updateSettings('reception', { allowEarlyCheckIn: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowLateCheckOut">Allow Late Check-out</Label>
                          <Switch
                            id="allowLateCheckOut"
                            checked={settings.reception.allowLateCheckOut}
                            onCheckedChange={(checked) => updateSettings('reception', { allowLateCheckOut: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Service Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="checkInTime">Check-in Time</Label>
                          <Input
                            id="checkInTime"
                            type="time"
                            value={settings.hotel.checkInTime}
                            onChange={(e) => updateSettings('hotel', { checkInTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="checkOutTime">Check-out Time</Label>
                          <Input
                            id="checkOutTime"
                            type="time"
                            value={settings.hotel.checkOutTime}
                            onChange={(e) => updateSettings('hotel', { checkOutTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxGuestsPerRoom">Max Guests per Room</Label>
                          <Input
                            id="maxGuestsPerRoom"
                            type="number"
                            value={settings.reception.maxGuestsPerRoom}
                            onChange={(e) => updateSettings('reception', { maxGuestsPerRoom: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="defaultRoomServiceTime">Default Room Service Time (minutes)</Label>
                          <Input
                            id="defaultRoomServiceTime"
                            type="number"
                            value={settings.reception.defaultRoomServiceTime}
                            onChange={(e) => updateSettings('reception', { defaultRoomServiceTime: parseInt(e.target.value) })}
                            min="5"
                            max="120"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Guest Security</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requirePhotoID">Require Photo ID</Label>
                          <Switch
                            id="requirePhotoID"
                            checked={settings.security.requirePhotoID}
                            onCheckedChange={(checked) => updateSettings('security', { requirePhotoID: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="trackGuestAccess">Track Guest Access</Label>
                          <Switch
                            id="trackGuestAccess"
                            checked={settings.security.trackGuestAccess}
                            onCheckedChange={(checked) => updateSettings('security', { trackGuestAccess: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="monitorCommonAreas">Monitor Common Areas</Label>
                          <Switch
                            id="monitorCommonAreas"
                            checked={settings.security.monitorCommonAreas}
                            onCheckedChange={(checked) => updateSettings('security', { monitorCommonAreas: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="emergencyProcedures">Emergency Procedures</Label>
                          <Switch
                            id="emergencyProcedures"
                            checked={settings.security.emergencyProcedures}
                            onCheckedChange={(checked) => updateSettings('security', { emergencyProcedures: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">System Security</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                          <Switch
                            id="twoFactorAuth"
                            checked={settings.security.twoFactorAuth}
                            onCheckedChange={(checked) => updateSettings('security', { twoFactorAuth: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auditLogs">Audit Logs</Label>
                          <Switch
                            id="auditLogs"
                            checked={settings.security.auditLogs}
                            onCheckedChange={(checked) => updateSettings('security', { auditLogs: checked })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                          <Input
                            id="sessionTimeout"
                            type="number"
                            value={settings.security.sessionTimeout}
                            onChange={(e) => updateSettings('security', { sessionTimeout: parseInt(e.target.value) })}
                            min="5"
                            max="480"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guestDataRetention">Guest Data Retention (days)</Label>
                          <Input
                            id="guestDataRetention"
                            type="number"
                            value={settings.security.guestDataRetention}
                            onChange={(e) => updateSettings('security', { guestDataRetention: parseInt(e.target.value) })}
                            min="30"
                            max="3650"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Hotel Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Additional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={settings.hotel.currency} onValueChange={(value) => updateSettings('hotel', { currency: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                            <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="lateCheckOutFee">Late Check-out Fee</Label>
                        <Input
                          id="lateCheckOutFee"
                          type="number"
                          value={settings.hotel.lateCheckOutFee}
                          onChange={(e) => updateSettings('hotel', { lateCheckOutFee: parseInt(e.target.value) })}
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wifiPassword">WiFi Password</Label>
                        <Input
                          id="wifiPassword"
                          type="password"
                          value={settings.hotel.wifiPassword}
                          onChange={(e) => updateSettings('hotel', { wifiPassword: e.target.value })}
                          placeholder="Enter WiFi password"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input
                          id="emergencyContact"
                          value={settings.hotel.emergencyContact}
                          onChange={(e) => updateSettings('hotel', { emergencyContact: e.target.value })}
                          placeholder="+250 XXX XXX XXX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                        <Textarea
                          id="cancellationPolicy"
                          value={settings.hotel.cancellationPolicy}
                          onChange={(e) => updateSettings('hotel', { cancellationPolicy: e.target.value })}
                          placeholder="Enter cancellation policy"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="loyaltyProgram">Loyalty Program</Label>
                        <Switch
                          id="loyaltyProgram"
                          checked={settings.reception.loyaltyProgram}
                          onCheckedChange={(checked) => updateSettings('reception', { loyaltyProgram: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Account Settings</h2>
                  <p className="text-muted-foreground">Manage your personal information and account preferences</p>
                </div>
                <Button onClick={saveAccountSettings} disabled={isLoading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Account Settings"}
                </Button>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
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
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Success</h3>
                      <div className="mt-2 text-sm text-green-700">{success}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={accountSettings.personalInfo.firstName}
                          onChange={(e) => updateAccountSettings('personalInfo', { firstName: e.target.value })}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={accountSettings.personalInfo.lastName}
                          onChange={(e) => updateAccountSettings('personalInfo', { lastName: e.target.value })}
                          placeholder="Enter your last name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={accountSettings.personalInfo.email}
                          onChange={(e) => updateAccountSettings('personalInfo', { email: e.target.value })}
                          placeholder="your.email@hotel.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={accountSettings.personalInfo.phone}
                          onChange={(e) => updateAccountSettings('personalInfo', { phone: e.target.value })}
                          placeholder="+250 XXX XXX XXX"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          value={accountSettings.personalInfo.position}
                          onChange={(e) => updateAccountSettings('personalInfo', { position: e.target.value })}
                          placeholder="Receptionist"
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={accountSettings.personalInfo.department}
                          onChange={(e) => updateAccountSettings('personalInfo', { department: e.target.value })}
                          placeholder="Front Desk"
                        />
                      </div>
                      <div>
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={accountSettings.personalInfo.employeeId}
                          onChange={(e) => updateAccountSettings('personalInfo', { employeeId: e.target.value })}
                          placeholder="EMP001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hireDate">Hire Date</Label>
                        <Input
                          id="hireDate"
                          type="date"
                          value={accountSettings.personalInfo.hireDate}
                          onChange={(e) => updateAccountSettings('personalInfo', { hireDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContact"
                        value={accountSettings.personalInfo.emergencyContact}
                        onChange={(e) => updateAccountSettings('personalInfo', { emergencyContact: e.target.value })}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={accountSettings.personalInfo.emergencyPhone}
                        onChange={(e) => updateAccountSettings('personalInfo', { emergencyPhone: e.target.value })}
                        placeholder="+250 XXX XXX XXX"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select value={accountSettings.preferences.language} onValueChange={(value) => updateAccountSettings('preferences', { language: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="rw">Kinyarwanda</SelectItem>
                            <SelectItem value="sw">Kiswahili</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={accountSettings.preferences.theme} onValueChange={(value) => updateAccountSettings('preferences', { theme: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select value={accountSettings.preferences.dateFormat} onValueChange={(value) => updateAccountSettings('preferences', { dateFormat: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="timeFormat">Time Format</Label>
                        <Select value={accountSettings.preferences.timeFormat} onValueChange={(value) => updateAccountSettings('preferences', { timeFormat: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                            <SelectItem value="24h">24 Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="defaultView">Default Dashboard View</Label>
                        <Select value={accountSettings.preferences.defaultView} onValueChange={(value) => updateAccountSettings('preferences', { defaultView: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="room-bookings">Room Bookings</SelectItem>
                            <SelectItem value="room-service">Room Service</SelectItem>
                            <SelectItem value="guest-management">Guest Management</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoLogout">Auto Logout</Label>
                          <Switch
                            id="autoLogout"
                            checked={accountSettings.preferences.autoLogout}
                            onCheckedChange={(checked) => updateAccountSettings('preferences', { autoLogout: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="showNotifications">Show Notifications</Label>
                          <Switch
                            id="showNotifications"
                            checked={accountSettings.preferences.showNotifications}
                            onCheckedChange={(checked) => updateAccountSettings('preferences', { showNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="soundEnabled">Sound Notifications</Label>
                          <Switch
                            id="soundEnabled"
                            checked={accountSettings.preferences.soundEnabled}
                            onCheckedChange={(checked) => updateAccountSettings('preferences', { soundEnabled: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="keyboardShortcuts">Keyboard Shortcuts</Label>
                          <Switch
                            id="keyboardShortcuts"
                            checked={accountSettings.preferences.keyboardShortcuts}
                            onCheckedChange={(checked) => updateAccountSettings('preferences', { keyboardShortcuts: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={accountSettings.security.currentPassword}
                          onChange={(e) => updateAccountSettings('security', { currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-6 h-10 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={accountSettings.security.newPassword}
                          onChange={(e) => updateAccountSettings('security', { newPassword: e.target.value })}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-6 h-10 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={accountSettings.security.confirmPassword}
                          onChange={(e) => updateAccountSettings('security', { confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-6 h-10 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button onClick={changePassword} disabled={isLoading} className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      {isLoading ? "Changing Password..." : "Change Password"}
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Enable 2FA</p>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                        </div>
                        <Switch
                          checked={accountSettings.security.twoFactorEnabled}
                          onCheckedChange={(checked) => updateAccountSettings('security', { twoFactorEnabled: checked })}
                        />
                      </div>
                      {accountSettings.security.twoFactorEnabled && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Backup Codes:</strong> Save these codes in a safe place. You can use them to access your account if you lose your phone.
                          </p>
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }, (_, i) => (
                              <div key={i} className="bg-white p-2 rounded text-center font-mono text-sm">
                                {Math.random().toString(36).substring(2, 8).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <Button size="sm" variant="outline" className="mt-2">
                            Generate New Codes
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Security Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Last Password Change</Label>
                          <p className="text-sm text-muted-foreground">
                            {accountSettings.security.lastPasswordChange || "Never"}
                          </p>
                        </div>
                        <div>
                          <Label>Active Sessions</Label>
                          <p className="text-sm text-muted-foreground">
                            {accountSettings.security.activeSessions.length} active session(s)
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Login History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Guest Details Dialog */}
      <Dialog open={showGuestDetailsDialog} onOpenChange={setShowGuestDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Details</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Guest Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedGuest.customerName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Contact</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedGuest.customerPhone} | {selectedGuest.customerEmail}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Room Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedGuest.roomType}</p>
                </div>
                <div>
                  <Label className="font-semibold">Guests</Label>
                  <p className="text-sm text-muted-foreground">{selectedGuest.guests} guests, {selectedGuest.rooms} room(s)</p>
                </div>
                <div>
                  <Label className="font-semibold">Check-in Date</Label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedGuest.checkIn).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Check-out Date</Label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedGuest.checkOut).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Total Amount</Label>
                  <p className="text-sm font-semibold text-primary">RWF {selectedGuest.totalAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge variant={
                    selectedGuest.status === "approved" ? "default" :
                    selectedGuest.status === "pending" ? "secondary" :
                    "destructive"
                  }>
                    {selectedGuest.status}
                  </Badge>
                </div>
              </div>
              
              {selectedGuest.specialRequests && (
                <div>
                  <Label className="font-semibold">Special Requests</Label>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {selectedGuest.specialRequests}
                  </p>
                </div>
              )}

              <div>
                <Label className="font-semibold">Booking Information</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Booking ID: {selectedGuest._id.slice(-8)}</p>
                  <p>Created: {new Date(selectedGuest.createdAt).toLocaleString()}</p>
                  {selectedGuest.updatedAt && (
                    <p>Last Updated: {new Date(selectedGuest.updatedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuestDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Service Dialog */}
      <Dialog open={showRoomServiceDialog} onOpenChange={setShowRoomServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Room Service Request</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <RoomServiceForm 
              guest={selectedGuest}
              onSubmit={handleRoomServiceRequest}
              onCancel={() => setShowRoomServiceDialog(false)}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
