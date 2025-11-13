"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Users, Phone, Mail, MapPin, CheckCircle, XCircle, AlertCircle, Edit, Trash2, Eye } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Booking {
  _id: string
  hotelId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  roomType: string
  specialRequests: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export default function ReceptionDashboard() {
  const params = useParams()
  const hotelId = params.hotelId as string
  const { logout } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("all")
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/hotel/${hotelId}/bookings`)
        const data = await res.json()
        if (data.success) {
          setBookings(data.bookings)
        }
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hotelId) {
      fetchBookings()
    }
  }, [hotelId])

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, status: status as any } : booking
        ))
        alert(`Booking status updated to ${status}`)
      } else {
        alert("Failed to update booking status")
      }
    } catch (error) {
      console.error("Error updating booking:", error)
      alert("Failed to update booking status")
    }
  }

  const deleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setBookings(prev => prev.filter(booking => booking._id !== bookingId))
        alert("Booking deleted successfully")
      } else {
        alert("Failed to delete booking")
      }
    } catch (error) {
      console.error("Error deleting booking:", error)
      alert("Failed to delete booking")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "completed": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "confirmed": return <CheckCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === "all") return true
    return booking.status === statusFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["receptionist", "manager", "hotel_manager", "admin"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
                <p className="text-gray-600">Manage hotel bookings and guest services</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bookings.filter(b => b.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bookings.filter(b => b.status === "confirmed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Guests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bookings.reduce((sum, b) => sum + b.guests, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hotel Bookings</CardTitle>
                  <CardDescription>Manage all hotel bookings and guest information</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bookings</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{booking.customerName}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(booking.status)}
                                {booking.status.toUpperCase()}
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{booking.customerPhone}</span>
                            </div>
                            {booking.customerEmail && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{booking.customerEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{booking.guests} guests, {booking.rooms} rooms</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{booking.roomType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">RWF {booking.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          {booking.specialRequests && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Special Requests:</strong> {booking.specialRequests}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowBookingDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBookingStatus(booking._id, "confirmed")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateBookingStatus(booking._id, "cancelled")}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking._id, "completed")}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBooking(booking._id)}
                            className="text-red-600 hover:text-red-700"
                          >
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
        </div>

        {/* Booking Details Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information about this booking
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{selectedBooking.customerPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedBooking.customerEmail || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Check-in Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedBooking.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Check-out Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedBooking.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Guests</label>
                    <p className="text-sm text-gray-900">{selectedBooking.guests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rooms</label>
                    <p className="text-sm text-gray-900">{selectedBooking.rooms}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room Type</label>
                    <p className="text-sm text-gray-900">{selectedBooking.roomType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Amount</label>
                    <p className="text-sm text-gray-900 font-semibold">RWF {selectedBooking.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedBooking.specialRequests && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Special Requests</label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowBookingDialog(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {selectedBooking.status === "pending" && (
                    <Button
                      onClick={() => {
                        updateBookingStatus(selectedBooking._id, "confirmed")
                        setShowBookingDialog(false)
                      }}
                      className="flex-1"
                    >
                      Confirm Booking
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
