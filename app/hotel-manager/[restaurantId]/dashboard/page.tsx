"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import Link from "next/link"
import FeatureGate from "@/components/FeatureGate"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { LogOut, RefreshCw, Users, Search, Edit, Trash2, Plus, UserPlus, Eye, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

export default function HotelManagerDashboard() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const [rooms, setRooms] = useState<any[]>([])
  const [outlets, setOutlets] = useState<Array<{ type: string; name: string }>>([])
  const [newOutletType, setNewOutletType] = useState<string>("restaurant")
  const [newOutletName, setNewOutletName] = useState<string>("")
  const { registerEmployee, logout } = useAuth()
  const [emp, setEmp] = useState({ name: "", email: "", password: "", role: "accountant" })
  const [newRoom, setNewRoom] = useState({ 
    number: "", 
    type: "Standard Room", 
    price: "", 
    image: "",
    description: "",
    maxOccupancy: 2,
    bedType: "Double",
    roomSize: "",
    services: [] as string[],
    amenities: [] as string[],
    photos: [] as string[]
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [customRoomType, setCustomRoomType] = useState("")
  const [newRoomService, setNewRoomService] = useState("")
  const [newRoomAmenity, setNewRoomAmenity] = useState("")
  const [roomPhotos, setRoomPhotos] = useState<string[]>([])
  const [showRoomDialog, setShowRoomDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [showEditRoomDialog, setShowEditRoomDialog] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  
  // Employee management state
  const [employees, setEmployees] = useState<any[]>([])
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false)
  const [showEmployeeDetailsDialog, setShowEmployeeDetailsDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [employeeFilterRole, setEmployeeFilterRole] = useState("all")
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState("all")
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
    phone: "",
    position: "",
    department: "",
    hireDate: "",
    salary: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: ""
  })
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [promotions, setPromotions] = useState<Array<{ id: string; title: string; description: string; startDate: string; endDate: string; discount: number }>>([])
  const [newPromo, setNewPromo] = useState({ title: "", description: "", startDate: "", endDate: "", discount: 0 })
  const [settings, setSettings] = useState({ name: "", description: "", location: "", phone: "", email: "", checkInTime: "14:00", checkOutTime: "11:00" })
  const [upgradeTier, setUpgradeTier] = useState<"pro" | "enterprise">("pro")
  const [attachedEstablishments, setAttachedEstablishments] = useState<Array<{ id: string; type: string; name: string; status: "pending" | "approved" | "rejected" }>>([])
  const [newAttachedEst, setNewAttachedEst] = useState({ type: "restaurant", name: "", description: "" })
  const [showManagementDialog, setShowManagementDialog] = useState(false)
  const [selectedEstablishment, setSelectedEstablishment] = useState<any>(null)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [newMenuItem, setNewMenuItem] = useState({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [establishmentToDelete, setEstablishmentToDelete] = useState<any>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [establishmentSettings, setEstablishmentSettings] = useState({ name: "", description: "", type: "", status: "" })
  const [hotelServices, setHotelServices] = useState<string[]>([])
  const [newService, setNewService] = useState("")
  const [hotelAmenities, setHotelAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/restaurant/${restaurantId}/rooms`)
        const data = await res.json()
        if (data.success) setRooms(data.rooms)
      } catch (e) {}

      try {
        const bookingsRes = await fetch(`/api/hotel/${restaurantId}/bookings`)
        const bookingsData = await bookingsRes.json()
        if (bookingsData.success) setBookings(bookingsData.bookings || [])
      } catch (e) {}

      // Fetch employees
      try {
        const token = localStorage.getItem('token')
        const employeesRes = await fetch(`/api/hotel/${restaurantId}/employees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const employeesData = await employeesRes.json()
        if (employeesData.success) setEmployees(employeesData.employees || [])
      } catch (e) {}

      try {
        const estRes = await fetch(`/api/restaurant/${restaurantId}`)
        const estData = await estRes.json()
        if (estData.success) {
          setOutlets(estData.restaurant?.outlets || [])
          setSettings({
            name: estData.restaurant?.name || "",
            description: estData.restaurant?.description || "",
            location: estData.restaurant?.location || "",
            phone: estData.restaurant?.phone || "",
            email: estData.restaurant?.email || "",
            checkInTime: estData.restaurant?.hotel?.checkInTime || "14:00",
            checkOutTime: estData.restaurant?.hotel?.checkOutTime || "11:00",
          })
          // Load hotel services and amenities
          if (estData.restaurant?.hotel?.services) {
            setHotelServices(estData.restaurant.hotel.services)
          }
          if (estData.restaurant?.hotel?.amenities) {
            setHotelAmenities(estData.restaurant.hotel.amenities)
          }
        }
      } catch (e) {}

      try {
        const promosRes = await fetch(`/api/restaurant/${restaurantId}/promotions`)
        const promosData = await promosRes.json()
        if (promosData.success && Array.isArray(promosData.promotions)) setPromotions(promosData.promotions)
      } catch (e) {}

      try {
        const token = localStorage.getItem("token")
        const attachedRes = await fetch(`/api/restaurant/${restaurantId}/attached-establishments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const attachedData = await attachedRes.json()
        if (attachedData.success && Array.isArray(attachedData.establishments)) {
          setAttachedEstablishments(attachedData.establishments)
        }
      } catch (e) {}
    }
    if (restaurantId) load()
  }, [restaurantId])

  // Employee management functions
  const handleAddEmployee = async () => {
    try {
      setIsLoadingEmployees(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hotel/${restaurantId}/employees`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmployee)
      })
      
      if (response.ok) {
        setShowAddEmployeeDialog(false)
        setNewEmployee({
          name: "",
          email: "",
          password: "",
          role: "receptionist",
          phone: "",
          position: "",
          department: "",
          hireDate: "",
          salary: "",
          address: "",
          emergencyContact: "",
          emergencyPhone: ""
        })
        // Refresh employees list
        try {
          const employeesRes = await fetch(`/api/hotel/${restaurantId}/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const employeesData = await employeesRes.json()
          if (employeesData.success) setEmployees(employeesData.employees || [])
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error adding employee:', error)
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const handleEditEmployee = async (employeeId: string, updatedData: any) => {
    try {
      setIsLoadingEmployees(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hotel/${restaurantId}/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      
      if (response.ok) {
        setShowEditEmployeeDialog(false)
        setSelectedEmployee(null)
        // Refresh employees list
        try {
          const employeesRes = await fetch(`/api/hotel/${restaurantId}/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const employeesData = await employeesRes.json()
          if (employeesData.success) setEmployees(employeesData.employees || [])
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error editing employee:', error)
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    
    try {
      setIsLoadingEmployees(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hotel/${restaurantId}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        // Refresh employees list
        try {
          const employeesRes = await fetch(`/api/hotel/${restaurantId}/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const employeesData = await employeesRes.json()
          if (employeesData.success) setEmployees(employeesData.employees || [])
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const handleViewEmployeeDetails = (employee: any) => {
    setSelectedEmployee(employee)
    setShowEmployeeDetailsDialog(true)
  }

  const handleEditEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee)
    setShowEditEmployeeDialog(true)
  }

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.position?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    
    const matchesRole = employeeFilterRole === "all" || employee.role === employeeFilterRole
    const matchesStatus = employeeFilterStatus === "all" || employee.isActive === (employeeFilterStatus === "active")
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const openManagementDialog = async (establishment: any) => {
    setSelectedEstablishment(establishment)
    setShowManagementDialog(true)
    
    // Load establishment-specific data
    try {
      if (establishment.type === "restaurant") {
        const menuRes = await fetch(`/api/restaurant/${restaurantId}/menu`)
        const menuData = await menuRes.json()
        if (menuData.success) setMenuItems(menuData.menuItems || [])
        
        const ordersRes = await fetch(`/api/restaurant/${restaurantId}/orders`)
        const ordersData = await ordersRes.json()
        if (ordersData.success) setOrders(ordersData.orders || [])
      } else if (establishment.type === "bar") {
        // Load menu items for attached bar
        const token = localStorage.getItem("token")
        const menuRes = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${establishment.id}/menu`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        const menuData = await menuRes.json()
        if (menuData.success) setMenuItems(menuData.menuItems || [])
        
        // Load orders for bar (if available)
        setOrders([]) // For now, no orders for bars
      }
    } catch (e) {
      console.error("Error loading establishment data:", e)
    }
  }

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price || !selectedEstablishment) return
    
    const payload = {
      ...newMenuItem,
      price: Number(newMenuItem.price)
    }
    
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${selectedEstablishment.id}/menu`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        const data = await res.json()
        setMenuItems(prev => [...prev, data.menuItem || payload])
        setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
      } else {
        setMenuItems(prev => [...prev, payload])
        setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
      }
    } catch (e) {
      setMenuItems(prev => [...prev, payload])
      setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
    }
  }

  const editMenuItem = (item: any) => {
    setEditingMenuItem(item)
    setNewMenuItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      isAvailable: item.isAvailable,
      image: item.image || ""
    })
  }

  const updateMenuItem = async () => {
    if (!editingMenuItem || !newMenuItem.name || !newMenuItem.price || !selectedEstablishment) return
    
    const payload = {
      ...newMenuItem,
      price: Number(newMenuItem.price)
    }
    
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${selectedEstablishment.id}/menu`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          menuItemId: editingMenuItem._id,
          ...payload
        })
      })
      
      if (res.ok) {
        setMenuItems(prev => prev.map(item => item._id === editingMenuItem._id ? { ...item, ...payload } : item))
        setEditingMenuItem(null)
        setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
      } else {
        setMenuItems(prev => prev.map(item => item._id === editingMenuItem._id ? { ...item, ...payload } : item))
        setEditingMenuItem(null)
        setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
      }
    } catch (e) {
      setMenuItems(prev => prev.map(item => item._id === editingMenuItem._id ? { ...item, ...payload } : item))
      setEditingMenuItem(null)
      setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
    }
  }

  const deleteMenuItem = async (item: any) => {
    if (!selectedEstablishment) return
    
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${selectedEstablishment.id}/menu`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          menuItemId: item._id
        })
      })
      
      if (res.ok) {
        setMenuItems(prev => prev.filter(menuItem => menuItem._id !== item._id))
      } else {
        setMenuItems(prev => prev.filter(menuItem => menuItem._id !== item._id))
      }
    } catch (e) {
      setMenuItems(prev => prev.filter(menuItem => menuItem._id !== item._id))
    }
  }

  const toggleMenuItemAvailability = async (item: any) => {
    if (!selectedEstablishment) return
    
    const updatedItem = { ...item, isAvailable: !item.isAvailable }
    
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${selectedEstablishment.id}/menu`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          menuItemId: item._id,
          isAvailable: !item.isAvailable
        })
      })
      
      if (res.ok) {
        setMenuItems(prev => prev.map(menuItem => menuItem._id === item._id ? updatedItem : menuItem))
      } else {
        setMenuItems(prev => prev.map(menuItem => menuItem._id === item._id ? updatedItem : menuItem))
      }
    } catch (e) {
      setMenuItems(prev => prev.map(menuItem => menuItem._id === item._id ? updatedItem : menuItem))
    }
  }

  const openSettingsDialog = (establishment: any) => {
    setEstablishmentSettings({
      name: establishment.name,
      description: establishment.description || "",
      type: establishment.type,
      status: establishment.status
    })
    setShowSettingsDialog(true)
  }

  const updateEstablishmentSettings = async () => {
    if (!selectedEstablishment) return
    
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${selectedEstablishment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(establishmentSettings)
      })
      
      if (res.ok) {
        setAttachedEstablishments(prev => prev.map(est => 
          est.id === selectedEstablishment.id 
            ? { ...est, name: establishmentSettings.name, description: establishmentSettings.description }
            : est
        ))
        setShowSettingsDialog(false)
      }
    } catch (e) {
      console.error("Error updating establishment:", e)
    }
  }

  const deleteEstablishment = async () => {
    if (!establishmentToDelete) return
    
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments/${establishmentToDelete.id}`, {
        method: "DELETE"
      })
      
      if (res.ok) {
        setAttachedEstablishments(prev => prev.filter(est => est.id !== establishmentToDelete.id))
        setShowDeleteDialog(false)
        setEstablishmentToDelete(null)
        setShowManagementDialog(false)
      }
    } catch (e) {
      console.error("Error deleting establishment:", e)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["hotel_manager", "manager", "restaurant_admin"]}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hotel Manager</h1>
          <div className="flex items-center space-x-2">
            <Link href={`/qr-room/${restaurantId}`}>
              <Button variant="outline">Generate Room QR</Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  await logout()
                } catch (error) {
                  console.error('Logout error:', error)
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
        </div>
        </div>
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="attached">Attached</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
              {rooms.map((room) => (
                    <Card key={room._id || room.number} className="overflow-hidden">
                      <div className="flex">
                        {room.image && (
                          <div className="w-32 h-32 flex-shrink-0">
                            <img src={room.image} alt={room.type} className="w-full h-full object-cover" />
                </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{room.type}</h3>
                              <p className="text-sm text-muted-foreground">Room {room.number}</p>
                              <p className="text-lg font-bold text-primary">RWF {room.price?.toLocaleString()}/night</p>
                            </div>
                            <Badge variant={room.isActive ? "default" : "secondary"}>
                              {room.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          {room.description && (
                            <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                          )}
                          
                          <div className="grid md:grid-cols-3 gap-4 mb-3">
                            {room.maxOccupancy && (
                              <div className="text-sm">
                                <span className="font-medium">Max Occupancy:</span> {room.maxOccupancy} guests
                              </div>
                            )}
                            {room.bedType && (
                              <div className="text-sm">
                                <span className="font-medium">Bed Type:</span> {room.bedType}
                              </div>
                            )}
                            {room.roomSize && (
                              <div className="text-sm">
                                <span className="font-medium">Size:</span> {room.roomSize} sq ft
                              </div>
                            )}
                          </div>
                          
                          {room.services && room.services.length > 0 && (
                            <div className="mb-3">
                              <span className="text-sm font-medium">Services:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {room.services.map((service, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="mb-3">
                              <span className="text-sm font-medium">Amenities:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {room.amenities.map((amenity, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {room.photos && room.photos.length > 0 && (
                            <div className="mb-3">
                              <span className="text-sm font-medium">Photos:</span>
                              <div className="flex gap-2 mt-1">
                                {room.photos.slice(0, 4).map((photo, index) => (
                                  <img key={index} src={photo} alt={`Room photo ${index + 1}`} className="w-16 h-16 object-cover rounded border" />
                                ))}
                                {room.photos.length > 4 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                    +{room.photos.length - 4} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setRooms(prev => prev.map(r => r._id === room._id || r.number === room.number ? { ...r, isActive: !r.isActive } : r))
                              }}
                            >
                              {room.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingRoom(room)
                                setNewRoom({
                                  number: room.number || "",
                                  type: room.type || "Standard Room",
                                  price: room.price?.toString() || "",
                                  image: room.image || "",
                                  description: room.description || "",
                                  maxOccupancy: room.maxOccupancy || 2,
                                  bedType: room.bedType || "Double",
                                  roomSize: room.roomSize || "",
                                  services: room.services || [],
                                  amenities: room.amenities || [],
                                  photos: room.photos || []
                                })
                                setUploadedFiles([])
                                setShowEditRoomDialog(true)
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {rooms.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🏨</div>
                      <p className="text-muted-foreground">No room types created yet.</p>
                      <p className="text-sm text-muted-foreground">Create your first room type above to get started.</p>
                    </div>
                  )}
            </div>
          </CardContent>
        </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Types Management</CardTitle>
                <CardDescription>Create and manage your hotel room types with detailed specifications, pricing, and amenities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Room Type Name</label>
                      <Select value={newRoom.type} onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard Room">Standard Room</SelectItem>
                          <SelectItem value="Deluxe Room">Deluxe Room</SelectItem>
                          <SelectItem value="Executive Suite">Executive Suite</SelectItem>
                          <SelectItem value="Presidential Suite">Presidential Suite</SelectItem>
                          <SelectItem value="Family Room">Family Room</SelectItem>
                          <SelectItem value="Business Room">Business Room</SelectItem>
                          <SelectItem value="Honeymoon Suite">Honeymoon Suite</SelectItem>
                          <SelectItem value="Penthouse">Penthouse</SelectItem>
                          <SelectItem value="Custom">Custom (Enter manually)</SelectItem>
                        </SelectContent>
                      </Select>
                      {newRoom.type === "Custom" && (
                        <Input 
                          placeholder="Enter custom room type name" 
                          value={customRoomType} 
                          onChange={(e) => {
                            setCustomRoomType(e.target.value)
                            setNewRoom({ ...newRoom, type: e.target.value })
                          }} 
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price per Night (RWF)</label>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        value={newRoom.price} 
                        onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      placeholder="Describe the room type, its features, and what makes it special..."
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Max Occupancy</label>
                      <Input 
                        type="number" 
                        placeholder="2" 
                        value={newRoom.maxOccupancy} 
                        onChange={(e) => setNewRoom({ ...newRoom, maxOccupancy: Number(e.target.value) })} 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bed Type</label>
                      <Select value={newRoom.bedType} onValueChange={(value) => setNewRoom({ ...newRoom, bedType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Double">Double</SelectItem>
                          <SelectItem value="Queen">Queen</SelectItem>
                          <SelectItem value="King">King</SelectItem>
                          <SelectItem value="Twin">Twin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Room Size (sq ft)</label>
                      <Input 
                        placeholder="300" 
                        value={newRoom.roomSize} 
                        onChange={(e) => setNewRoom({ ...newRoom, roomSize: e.target.value })} 
                      />
                    </div>
                  </div>

                  {/* Services Section */}
                  <div>
                    <label className="text-sm font-medium">Room Services</label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="e.g. Room Service, Concierge, Laundry"
                        value={newRoomService}
                        onChange={(e) => setNewRoomService(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newRoomService.trim()) {
                            setNewRoom({ ...newRoom, services: [...newRoom.services, newRoomService.trim()] })
                            setNewRoomService("")
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          if (newRoomService.trim()) {
                            setNewRoom({ ...newRoom, services: [...newRoom.services, newRoomService.trim()] })
                            setNewRoomService("")
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {["Room Service", "Concierge", "Laundry", "Housekeeping", "Turndown Service", "Wake-up Call", "Valet Parking"].map((service) => (
                        <Button
                          key={service}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!newRoom.services.includes(service)) {
                              setNewRoom({ ...newRoom, services: [...newRoom.services, service] })
                            }
                          }}
                          disabled={newRoom.services.includes(service)}
                        >
                          {service}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newRoom.services.map((service, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => {
                          setNewRoom({ ...newRoom, services: newRoom.services.filter((_, i) => i !== index) })
                        }}>
                          {service} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div>
                    <label className="text-sm font-medium">Room Amenities</label>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        placeholder="e.g. WiFi, TV, Mini Bar, Balcony"
                        value={newRoomAmenity}
                        onChange={(e) => setNewRoomAmenity(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newRoomAmenity.trim()) {
                            setNewRoom({ ...newRoom, amenities: [...newRoom.amenities, newRoomAmenity.trim()] })
                            setNewRoomAmenity("")
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          if (newRoomAmenity.trim()) {
                            setNewRoom({ ...newRoom, amenities: [...newRoom.amenities, newRoomAmenity.trim()] })
                            setNewRoomAmenity("")
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {["WiFi", "TV", "Mini Bar", "Balcony", "Air Conditioning", "Safe", "Coffee Machine", "Iron", "Hair Dryer", "Bathrobe", "Slippers", "Ocean View", "City View", "Garden View"].map((amenity) => (
                        <Button
                          key={amenity}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!newRoom.amenities.includes(amenity)) {
                              setNewRoom({ ...newRoom, amenities: [...newRoom.amenities, amenity] })
                            }
                          }}
                          disabled={newRoom.amenities.includes(amenity)}
                        >
                          {amenity}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newRoom.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => {
                          setNewRoom({ ...newRoom, amenities: newRoom.amenities.filter((_, i) => i !== index) })
                        }}>
                          {amenity} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="text-sm font-medium">Room Photos</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files)
                            setUploadedFiles(prev => [...prev, ...files])
                            
                            // Convert files to data URLs for preview
                            files.forEach(file => {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                if (e.target?.result) {
                                  setNewRoom({ 
                                    ...newRoom, 
                                    photos: [...newRoom.photos, e.target.result as string] 
                                  })
                                }
                              }
                              reader.readAsDataURL(file)
                            })
                          }
                        }}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Select multiple images to upload (JPG, PNG, GIF)
                      </p>
                    </div>
                    
                    {/* Preview uploaded images */}
                    {newRoom.photos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Uploaded Images:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {newRoom.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={photo} 
                                alt={`Room photo ${index + 1}`} 
                                className="w-full h-20 object-cover rounded border" 
                              />
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                onClick={() => {
                                  setNewRoom({ ...newRoom, photos: newRoom.photos.filter((_, i) => i !== index) })
                                  setUploadedFiles(prev => prev.filter((_, i) => i !== index))
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {
                        if (!newRoom.type || !newRoom.price) {
                          alert("Please fill in room type name and price")
                          return
                        }
                        
                        let uploadedPhotos = newRoom.photos
                        
                        // Upload files if any were selected
                        if (uploadedFiles.length > 0) {
                          try {
                            const formData = new FormData()
                            uploadedFiles.forEach(file => {
                              formData.append("files", file)
                            })
                            
                            const uploadRes = await fetch("/api/upload/room-images", {
                              method: "POST",
                              body: formData
                            })
                            
                            if (uploadRes.ok) {
                              const uploadData = await uploadRes.json()
                              uploadedPhotos = uploadData.files
                            }
                          } catch (error) {
                            console.error("Error uploading files:", error)
                            alert("Error uploading images. Room will be created without images.")
                          }
                        }
                        
                        const payload = { 
                          number: newRoom.number || `Room-${Date.now()}`, 
                          type: newRoom.type, 
                          price: Number(newRoom.price),
                          description: newRoom.description,
                          maxOccupancy: newRoom.maxOccupancy,
                          bedType: newRoom.bedType,
                          roomSize: newRoom.roomSize,
                          services: newRoom.services,
                          amenities: newRoom.amenities,
                          photos: uploadedPhotos,
                          image: uploadedPhotos[0] || ""
                        }
                        try {
                          const res = await fetch(`/api/restaurant/${restaurantId}/rooms`, { 
                            method: "POST", 
                            headers: { "Content-Type": "application/json" }, 
                            body: JSON.stringify(payload) 
                          })
                          if (res.ok) {
                            const data = await res.json()
                            const created = data.room || payload
                            setRooms(prev => [...prev, created])
                            alert(`Room type "${newRoom.type}" created successfully!`)
                          } else {
                            setRooms(prev => [...prev, payload])
                            alert(`Room type "${newRoom.type}" added locally!`)
                          }
                          setNewRoom({ 
                            number: "", 
                            type: "Standard Room", 
                            price: "", 
                            image: "",
                            description: "",
                            maxOccupancy: 2,
                            bedType: "Double",
                            roomSize: "",
                            services: [],
                            amenities: [],
                            photos: []
                          })
                          setUploadedFiles([])
                        } catch (_) {
                          setRooms(prev => [...prev, payload])
                          setNewRoom({ 
                            number: "", 
                            type: "Standard Room", 
                            price: "", 
                            image: "",
                            description: "",
                            maxOccupancy: 2,
                            bedType: "Double",
                            roomSize: "",
                            services: [],
                            amenities: [],
                            photos: []
                          })
                          setUploadedFiles([])
                        }
                      }}
                    >
                      Create Room Type
                    </Button>
                    <Button variant="outline" onClick={() => setShowRoomDialog(true)}>
                      View All Room Types
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Room Dialog */}
            <Dialog open={showEditRoomDialog} onOpenChange={setShowEditRoomDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Room Type</DialogTitle>
                  <DialogDescription>
                    Update the details for {editingRoom?.type || "this room type"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Room Type Name</label>
                      <Select value={newRoom.type} onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard Room">Standard Room</SelectItem>
                          <SelectItem value="Deluxe Room">Deluxe Room</SelectItem>
                          <SelectItem value="Suite">Suite</SelectItem>
                          <SelectItem value="Executive Suite">Executive Suite</SelectItem>
                          <SelectItem value="Presidential Suite">Presidential Suite</SelectItem>
                          <SelectItem value="Family Room">Family Room</SelectItem>
                          <SelectItem value="Studio">Studio</SelectItem>
                          <SelectItem value="Penthouse">Penthouse</SelectItem>
                          <SelectItem value="custom">Custom Type</SelectItem>
                        </SelectContent>
                      </Select>
                      {newRoom.type === "custom" && (
                        <Input 
                          placeholder="Enter custom room type" 
                          value={customRoomType}
                          onChange={(e) => {
                            setCustomRoomType(e.target.value)
                            setNewRoom({ ...newRoom, type: e.target.value })
                          }}
                          className="mt-2"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Price per Night</label>
                      <Input 
                        type="number" 
                        placeholder="Enter price" 
                        value={newRoom.price}
                        onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      placeholder="Describe the room type, features, and what makes it special..."
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Max Occupancy</label>
                      <Select value={newRoom.maxOccupancy.toString()} onValueChange={(value) => setNewRoom({ ...newRoom, maxOccupancy: Number(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Guest</SelectItem>
                          <SelectItem value="2">2 Guests</SelectItem>
                          <SelectItem value="3">3 Guests</SelectItem>
                          <SelectItem value="4">4 Guests</SelectItem>
                          <SelectItem value="5">5 Guests</SelectItem>
                          <SelectItem value="6">6+ Guests</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Bed Type</label>
                      <Select value={newRoom.bedType} onValueChange={(value) => setNewRoom({ ...newRoom, bedType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single Bed</SelectItem>
                          <SelectItem value="Double">Double Bed</SelectItem>
                          <SelectItem value="Queen">Queen Bed</SelectItem>
                          <SelectItem value="King">King Bed</SelectItem>
                          <SelectItem value="Twin">Twin Beds</SelectItem>
                          <SelectItem value="Bunk">Bunk Beds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Room Size (sq ft)</label>
                      <Input 
                        placeholder="e.g., 300" 
                        value={newRoom.roomSize}
                        onChange={(e) => setNewRoom({ ...newRoom, roomSize: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Services</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newRoom.services.map((service, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {service}
                          <button 
                            onClick={() => setNewRoom({ ...newRoom, services: newRoom.services.filter((_, i) => i !== index) })}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Select value={newRoomService} onValueChange={setNewRoomService}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Add service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Room Service">Room Service</SelectItem>
                          <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                          <SelectItem value="Concierge">Concierge</SelectItem>
                          <SelectItem value="Laundry">Laundry</SelectItem>
                          <SelectItem value="Turndown">Turndown Service</SelectItem>
                          <SelectItem value="Wake-up Call">Wake-up Call</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (newRoomService && !newRoom.services.includes(newRoomService)) {
                            setNewRoom({ ...newRoom, services: [...newRoom.services, newRoomService] })
                            setNewRoomService("")
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Amenities</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newRoom.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {amenity}
                          <button 
                            onClick={() => setNewRoom({ ...newRoom, amenities: newRoom.amenities.filter((_, i) => i !== index) })}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Select value={newRoomAmenity} onValueChange={setNewRoomAmenity}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Add amenity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Wi-Fi">Wi-Fi</SelectItem>
                          <SelectItem value="TV">TV</SelectItem>
                          <SelectItem value="Minibar">Minibar</SelectItem>
                          <SelectItem value="Balcony">Balcony</SelectItem>
                          <SelectItem value="Ocean View">Ocean View</SelectItem>
                          <SelectItem value="City View">City View</SelectItem>
                          <SelectItem value="Air Conditioning">Air Conditioning</SelectItem>
                          <SelectItem value="Safe">Safe</SelectItem>
                          <SelectItem value="Coffee Maker">Coffee Maker</SelectItem>
                          <SelectItem value="Work Desk">Work Desk</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          if (newRoomAmenity && !newRoom.amenities.includes(newRoomAmenity)) {
                            setNewRoom({ ...newRoom, amenities: [...newRoom.amenities, newRoomAmenity] })
                            setNewRoomAmenity("")
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Room Photos</label>
                    <Input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setUploadedFiles(prev => [...prev, ...files])
                      }}
                      className="mt-2"
                    />
                    {uploadedFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Selected files:</p>
                        <div className="flex flex-wrap gap-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                              {file.name}
                              <button 
                                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {newRoom.photos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Current photos:</p>
                        <div className="flex flex-wrap gap-2">
                          {newRoom.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <Image
                                src={photo}
                                alt={`Room photo ${index + 1}`}
                                width={60}
                                height={60}
                                className="rounded object-cover"
                              />
                              <button 
                                onClick={() => setNewRoom({ ...newRoom, photos: newRoom.photos.filter((_, i) => i !== index) })}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditRoomDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!newRoom.type || !newRoom.price) {
                        alert("Please fill in room type name and price")
                        return
                      }
                      
                      let uploadedPhotos = newRoom.photos
                      
                      // Upload new files if any were selected
                      if (uploadedFiles.length > 0) {
                        try {
                          const formData = new FormData()
                          uploadedFiles.forEach(file => {
                            formData.append("files", file)
                          })
                          
                          const uploadRes = await fetch("/api/upload/room-images", {
                            method: "POST",
                            body: formData
                          })
                          
                          if (uploadRes.ok) {
                            const uploadData = await uploadRes.json()
                            uploadedPhotos = [...newRoom.photos, ...uploadData.files]
                          }
                        } catch (error) {
                          console.error("Error uploading files:", error)
                          alert("Error uploading images. Room will be updated without new images.")
                        }
                      }
                      
                      const payload = { 
                        number: newRoom.number || `Room-${Date.now()}`, 
                        type: newRoom.type, 
                        price: Number(newRoom.price),
                        description: newRoom.description,
                        maxOccupancy: newRoom.maxOccupancy,
                        bedType: newRoom.bedType,
                        roomSize: newRoom.roomSize,
                        services: newRoom.services,
                        amenities: newRoom.amenities,
                        photos: uploadedPhotos,
                        image: uploadedPhotos[0] || ""
                      }

                      try {
                        const res = await fetch(`/api/restaurant/${restaurantId}/rooms/${editingRoom._id}`, { 
                          method: "PUT", 
                          headers: { "Content-Type": "application/json" }, 
                          body: JSON.stringify(payload) 
                        })
                        if (res.ok) {
                          const data = await res.json()
                          const updatedRoom = data.room || payload
                          setRooms(prev => prev.map(room => 
                            room._id === editingRoom._id ? { ...room, ...updatedRoom } : room
                          ))
                          alert(`Room type "${newRoom.type}" updated successfully!`)
                          setShowEditRoomDialog(false)
                          setEditingRoom(null)
                        } else {
                          alert("Failed to update room. Please try again.")
                        }
                      } catch (error) {
                        console.error("Error updating room:", error)
                        alert("Failed to update room. Please try again.")
                      }
                    }}
                  >
                    Update Room Type
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Requests</CardTitle>
                <CardDescription>Manage room booking requests from customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <Card key={booking._id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{booking.customerName}</h4>
                              <Badge variant={
                                booking.status === "pending" ? "secondary" :
                                booking.status === "approved" ? "default" :
                                "destructive"
                              }>
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Booking ID: {booking._id.slice(-8)}</p>
                              <p className="text-lg font-bold text-primary">
                                RWF {booking.totalAmount?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div>
                              <span className="font-medium">Check-in:</span>
                              <p>{new Date(booking.checkIn).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Check-out:</span>
                              <p>{new Date(booking.checkOut).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Guests:</span>
                              <p>{booking.guests}</p>
                            </div>
                            <div>
                              <span className="font-medium">Rooms:</span>
                              <p>{booking.rooms}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <span className="font-medium">Room Type:</span>
                            <p className="text-sm text-muted-foreground">{booking.roomType}</p>
                          </div>
                          
                          <div className="mb-3">
                            <span className="font-medium">Contact:</span>
                            <p className="text-sm text-muted-foreground">
                              {booking.customerPhone} | {booking.customerEmail}
                            </p>
                          </div>
                          
                          {booking.specialRequests && (
                            <div className="mb-3">
                              <span className="font-medium">Special Requests:</span>
                              <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                                {booking.specialRequests}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/receptionist/${restaurantId}/dashboard`, '_blank')}
                            >
                              View in Receptionist Dashboard
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(booking.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <p className="text-muted-foreground">No booking requests yet.</p>
                      <p className="text-sm text-muted-foreground">Customer bookings will appear here for review.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attached" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attached Establishments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attachedEstablishments.map((est) => (
                    <div key={est.id} className="border rounded p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">{est.type} - {est.name}</div>
                        <div className={`text-sm ${est.status === "approved" ? "text-green-600" : est.status === "rejected" ? "text-red-600" : "text-yellow-600"}`}>
                          Status: {est.status}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {est.status === "approved" && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openManagementDialog(est)}
                            >
                              Manage {est.type}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingsDialog(est)}
                            >
                              Settings
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setEstablishmentToDelete(est)
                                setShowDeleteDialog(true)
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                        {est.status === "pending" && (
                          <span className="text-sm text-muted-foreground">Awaiting approval</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {attachedEstablishments.length === 0 && (
                    <div className="text-sm text-muted-foreground">No attached establishments yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request New Attached Establishment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-2">
                  <Select value={newAttachedEst.type} onValueChange={(v) => setNewAttachedEst({ ...newAttachedEst, type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Cafe</SelectItem>
                      <SelectItem value="bakery">Bakery</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Establishment name" value={newAttachedEst.name} onChange={(e) => setNewAttachedEst({ ...newAttachedEst, name: e.target.value })} />
                  <Input placeholder="Description" value={newAttachedEst.description} onChange={(e) => setNewAttachedEst({ ...newAttachedEst, description: e.target.value })} />
                </div>
                <div className="mt-3">
                  <Button onClick={async () => {
                    if (!newAttachedEst.name.trim()) return
                    const payload = {
                      type: newAttachedEst.type,
                      name: newAttachedEst.name.trim(),
                      description: newAttachedEst.description,
                      status: "pending"
                    }
                    try {
                      const token = localStorage.getItem("token")
                      const res = await fetch(`/api/restaurant/${restaurantId}/attached-establishments`, {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                      })
                      if (res.ok) {
                        const data = await res.json()
                        const created = data.establishment || { ...payload, id: `EST-${Date.now()}` }
                        setAttachedEstablishments(prev => [...prev, created])
                        setNewAttachedEst({ type: "restaurant", name: "", description: "" })
                      } else {
                        const created = { ...payload, id: `EST-${Date.now()}` }
                        setAttachedEstablishments(prev => [...prev, created])
                        setNewAttachedEst({ type: "restaurant", name: "", description: "" })
                      }
                    } catch (_) {
                      const created = { ...payload, id: `EST-${Date.now()}` }
                      setAttachedEstablishments(prev => [...prev, created])
                      setNewAttachedEst({ type: "restaurant", name: "", description: "" })
                    }
                  }}>Request Establishment</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hotel Outlets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-2">
                    <Select value={newOutletType} onValueChange={setNewOutletType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outlet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="cafe">Cafe</SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Outlet name" value={newOutletName} onChange={(e) => setNewOutletName(e.target.value)} />
                    <Button
                      onClick={async () => {
                        if (!newOutletName.trim()) return
                        const updated = [...outlets, { type: newOutletType, name: newOutletName.trim() }]
                        try {
                          const res = await fetch(`/api/restaurant/${restaurantId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ outlets: updated })
                          })
                          if (res.ok) {
                            setOutlets(updated)
                            setNewOutletName("")
                            setNewOutletType("restaurant")
                          }
                        } catch (e) {}
                      }}
                    >
                      Add Outlet
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {outlets.map((o, idx) => (
                      <div key={`${o.type}-${o.name}-${idx}`} className="border rounded p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">{o.type}</div>
                          <div className="text-sm text-muted-foreground">{o.name}</div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/manager/${restaurantId}/dashboard`} className="text-primary text-sm">Open</Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const updated = outlets.filter((_, i) => i !== idx)
                              try {
                                const res = await fetch(`/api/restaurant/${restaurantId}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ outlets: updated })
                                })
                                if (res.ok) setOutlets(updated)
                              } catch (e) {}
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {outlets.length === 0 && (
                      <div className="text-sm text-muted-foreground">No outlets yet. Add a restaurant, cafe, bakery, or bar.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                {promotions.length === 0 && <div className="text-sm text-muted-foreground">No promotions yet.</div>}
                <div className="grid md:grid-cols-2 gap-3">
                  {promotions.map((p) => (
                    <div key={p.id} className="border rounded p-3">
                      <div className="font-medium">{p.title} • {p.discount}%</div>
                      <div className="text-sm text-muted-foreground">{p.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.startDate} - {p.endDate}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Create Promotion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-2">
                  <Input placeholder="Title" value={newPromo.title} onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })} />
                  <Input placeholder="Description" value={newPromo.description} onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })} />
                  <Input placeholder="Start date" type="date" value={newPromo.startDate} onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })} />
                  <Input placeholder="End date" type="date" value={newPromo.endDate} onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })} />
                  <Input placeholder="Discount %" type="number" value={String(newPromo.discount)} onChange={(e) => setNewPromo({ ...newPromo, discount: Number(e.target.value) })} />
                </div>
                <div className="mt-3">
                  <Button onClick={async () => {
                    if (!newPromo.title || !newPromo.startDate || !newPromo.endDate) return
                    const payload = { ...newPromo, id: `PR-${Date.now()}` }
                    try {
                      const res = await fetch(`/api/restaurant/${restaurantId}/promotions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                      if (res.ok) setPromotions(prev => [...prev, payload])
                      else setPromotions(prev => [...prev, payload])
                      setNewPromo({ title: "", description: "", startDate: "", endDate: "", discount: 0 })
                    } catch (_) {
                      setPromotions(prev => [...prev, payload])
                      setNewPromo({ title: "", description: "", startDate: "", endDate: "", discount: 0 })
                    }
                  }}>Create</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Employee Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Employee Management</h2>
                <p className="text-muted-foreground">Manage your hotel staff and employees</p>
              </div>
              <Button onClick={() => setShowAddEmployeeDialog(true)} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={employeeFilterRole} onValueChange={setEmployeeFilterRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={employeeFilterStatus} onValueChange={setEmployeeFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    setEmployeeSearchTerm("")
                    setEmployeeFilterRole("all")
                    setEmployeeFilterStatus("all")
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employees ({filteredEmployees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEmployees ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading employees...</p>
                  </div>
                ) : filteredEmployees.length > 0 ? (
                  <div className="space-y-4">
                    {filteredEmployees.map((employee) => (
                      <Card key={employee._id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{employee.name}</h4>
                                <Badge variant={employee.isActive ? "default" : "secondary"}>
                                  {employee.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">{employee.role}</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Email:</span>
                                  <p>{employee.email}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Position:</span>
                                  <p>{employee.position || "N/A"}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Department:</span>
                                  <p>{employee.department || "N/A"}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Hire Date:</span>
                                  <p>{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}</p>
                                </div>
                              </div>
                              {employee.phone && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  <span className="font-medium">Phone:</span> {employee.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewEmployeeDetails(employee)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEmployeeClick(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEmployee(employee._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                    <p className="text-muted-foreground mb-4">
                      {employees.length === 0 
                        ? "You haven't added any employees yet. Add your first employee to get started."
                        : "No employees match your current search and filter criteria."
                      }
                    </p>
                    {employees.length === 0 && (
                      <Button onClick={() => setShowAddEmployeeDialog(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Employee
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="Hotel name" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
                  <Input placeholder="Email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                  <Input placeholder="Phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                  <Input placeholder="Location" value={settings.location} onChange={(e) => setSettings({ ...settings, location: e.target.value })} />
                  <Input placeholder="Check-in (HH:mm)" value={settings.checkInTime} onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })} />
                  <Input placeholder="Check-out (HH:mm)" value={settings.checkOutTime} onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })} />
                </div>
                <div className="mt-3">
                  <Input placeholder="Description" value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={async () => {
                    try {
                      await fetch(`/api/restaurant/${restaurantId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
                        name: settings.name,
                        description: settings.description,
                        location: settings.location,
                        phone: settings.phone,
                        email: settings.email,
                        hotel: { checkInTime: settings.checkInTime, checkOutTime: settings.checkOutTime }
                      }) })
                    } catch (_) {}
                  }}>Save Settings</Button>
                  <Select value={upgradeTier} onValueChange={(v: any) => setUpgradeTier(v)}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={async () => {
                    try {
                      await fetch('/api/admin/subscription-upgrade-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId, desiredTier: upgradeTier }) })
                    } catch (_) {}
                  }}>Request Upgrade</Button>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Services Management */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Services</CardTitle>
                <CardDescription>Manage the services your hotel offers to guests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a service (e.g., Spa, Gym, Pool, Restaurant, Bar, Conference Room)"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newService.trim()) {
                        setHotelServices(prev => [...prev, newService.trim()])
                        setNewService("")
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      if (newService.trim()) {
                        setHotelServices(prev => [...prev, newService.trim()])
                        setNewService("")
                      }
                    }}
                    disabled={!newService.trim()}
                  >
                    Add Service
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Current Services:</h4>
                  {hotelServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No services added yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {hotelServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                          <span>{service}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-primary/20"
                            onClick={() => setHotelServices(prev => prev.filter((_, i) => i !== index))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/restaurant/${restaurantId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            $set: {
                              'hotel.services': hotelServices 
                            }
                          })
                        })
                        if (res.ok) {
                          showNotification('success', 'Services updated successfully')
                        }
                      } catch (e) {
                        showNotification('error', 'Failed to update services')
                      }
                    }}
                    disabled={hotelServices.length === 0}
                  >
                    Save Services
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hotel Amenities Management */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Amenities</CardTitle>
                <CardDescription>Manage the amenities your hotel offers to guests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add an amenity (e.g., WiFi, Parking, Pool, Gym, Spa, Restaurant)"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newAmenity.trim()) {
                        setHotelAmenities(prev => [...prev, newAmenity.trim()])
                        setNewAmenity("")
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      if (newAmenity.trim()) {
                        setHotelAmenities(prev => [...prev, newAmenity.trim()])
                        setNewAmenity("")
                      }
                    }}
                    disabled={!newAmenity.trim()}
                  >
                    Add Amenity
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Current Amenities:</h4>
                  {hotelAmenities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No amenities added yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {hotelAmenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          <span>{amenity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-orange-200"
                            onClick={() => setHotelAmenities(prev => prev.filter((_, i) => i !== index))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/restaurant/${restaurantId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            $set: {
                              'hotel.amenities': hotelAmenities 
                            }
                          })
                        })
                        if (res.ok) {
                          showNotification('success', 'Amenities updated successfully')
                        }
                      } catch (e) {
                        showNotification('error', 'Failed to update amenities')
                      }
                    }}
                    disabled={hotelAmenities.length === 0}
                  >
                    Save Amenities
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
        <FeatureGate feature="analytics" fallback={<div className="text-sm text-muted-foreground">Upgrade to Pro to unlock hotel analytics.</div>}>
          <Card>
            <CardHeader>
              <CardTitle>Hotel Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Analytics widgets go here.</div>
            </CardContent>
          </Card>
        </FeatureGate>

            {/* Reception Dashboard Link */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Reception Management</CardTitle>
                <CardDescription>Access reception dashboard to manage bookings and guest services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Reception Dashboard</h4>
                    <p className="text-sm text-gray-600">View and manage all hotel bookings, guest information, and check-ins</p>
                  </div>
                  <Link href={`/reception/${restaurantId}/dashboard`}>
                    <Button>
                      Open Reception Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Management Dialog */}
        <Dialog open={showManagementDialog} onOpenChange={setShowManagementDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage {selectedEstablishment?.type} - {selectedEstablishment?.name}</DialogTitle>
              <DialogDescription>
                Full management interface for your attached {selectedEstablishment?.type}
              </DialogDescription>
            </DialogHeader>
            
            {selectedEstablishment && (
              <div className="space-y-6">
                {/* Restaurant Management */}
                {selectedEstablishment.type === "restaurant" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Menu Management</h3>
                      <Badge variant="outline">Restaurant</Badge>
                    </div>
                    
                    {/* Add Menu Item */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Menu Item</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-4 gap-2">
                          <Input placeholder="Item name" value={newMenuItem.name} onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })} />
                          <Input placeholder="Category" value={newMenuItem.category} onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })} />
                          <Input placeholder="Price (RWF)" type="number" value={newMenuItem.price} onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })} />
                          <div className="flex items-center space-x-2">
                            <Switch checked={newMenuItem.isAvailable} onCheckedChange={(checked) => setNewMenuItem({ ...newMenuItem, isAvailable: checked })} />
                            <span className="text-sm">Available</span>
                          </div>
                        </div>
                        
                        {/* Image Upload for Restaurant */}
                        <div className="mt-4">
                          <label className="text-sm font-medium">Item Image</label>
                          <div className="mt-2 flex items-center space-x-4">
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
                              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                            />
                            {newMenuItem.image && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                <img src={newMenuItem.image} alt="Item preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Textarea placeholder="Description" value={newMenuItem.description} onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })} className="mt-2" />
                        <div className="mt-2 flex gap-2">
                          {editingMenuItem ? (
                            <>
                              <Button onClick={updateMenuItem}>Update Item</Button>
                              <Button variant="outline" onClick={() => {
                                setEditingMenuItem(null)
                                setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
                              }}>Cancel</Button>
                            </>
                          ) : (
                            <Button onClick={addMenuItem}>Add Item</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Menu Items List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Menu Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {menuItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-3">
                                {item.image && (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">{item.description}</div>
                                  <div className="text-sm">RWF {item.price} • {item.category}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                  {item.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => editMenuItem(item)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toggleMenuItemAvailability(item)}
                                >
                                  {item.isAvailable ? "Disable" : "Enable"}
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteMenuItem(item)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                          {menuItems.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">No menu items yet</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Orders */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {orders.slice(0, 5).map((order, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <div className="font-medium">Order #{order.id || idx + 1}</div>
                                <div className="text-sm text-muted-foreground">{order.items?.length || 0} items</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{order.status || "pending"}</Badge>
                                <span className="text-sm">RWF {order.total || 0}</span>
                              </div>
                            </div>
                          ))}
                          {orders.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">No orders yet</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Cafe Management */}
                {selectedEstablishment.type === "cafe" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Cafe Management</h3>
                      <Badge variant="outline">Cafe</Badge>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Coffee Menu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Espresso Drinks</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span>Espresso</span><span>RWF 1,500</span></div>
                              <div className="flex justify-between"><span>Americano</span><span>RWF 2,000</span></div>
                              <div className="flex justify-between"><span>Cappuccino</span><span>RWF 2,500</span></div>
                              <div className="flex justify-between"><span>Latte</span><span>RWF 2,800</span></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">Specialty Drinks</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span>Mocha</span><span>RWF 3,200</span></div>
                              <div className="flex justify-between"><span>Frappuccino</span><span>RWF 3,500</span></div>
                              <div className="flex justify-between"><span>Cold Brew</span><span>RWF 2,200</span></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Pastries & Snacks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>Croissant</span><span>RWF 1,200</span></div>
                            <div className="flex justify-between"><span>Muffin</span><span>RWF 1,500</span></div>
                            <div className="flex justify-between"><span>Sandwich</span><span>RWF 3,000</span></div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span>Cookie</span><span>RWF 800</span></div>
                            <div className="flex justify-between"><span>Cake Slice</span><span>RWF 2,500</span></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Bakery Management */}
                {selectedEstablishment.type === "bakery" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Bakery Management</h3>
                      <Badge variant="outline">Bakery</Badge>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Bread & Pastries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Bread</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span>White Bread</span><span>RWF 2,000</span></div>
                              <div className="flex justify-between"><span>Whole Wheat</span><span>RWF 2,200</span></div>
                              <div className="flex justify-between"><span>Baguette</span><span>RWF 1,800</span></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">Pastries</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span>Danish</span><span>RWF 1,500</span></div>
                              <div className="flex justify-between"><span>Croissant</span><span>RWF 1,200</span></div>
                              <div className="flex justify-between"><span>Eclair</span><span>RWF 2,000</span></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">Cakes</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span>Chocolate Cake</span><span>RWF 3,500</span></div>
                              <div className="flex justify-between"><span>Cheesecake</span><span>RWF 4,000</span></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Bar Management */}
                {selectedEstablishment.type === "bar" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Bar Management</h3>
                      <Badge variant="outline">Bar</Badge>
                    </div>
                    
                    {/* Add Bar Item */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Bar Item</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-4 gap-2">
                          <Input placeholder="Item name" value={newMenuItem.name} onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })} />
                          <Select value={newMenuItem.category} onValueChange={(value) => setNewMenuItem({ ...newMenuItem, category: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beer">Beer</SelectItem>
                              <SelectItem value="wine">Wine</SelectItem>
                              <SelectItem value="spirits">Spirits</SelectItem>
                              <SelectItem value="cocktails">Cocktails</SelectItem>
                              <SelectItem value="soft-drinks">Soft Drinks</SelectItem>
                              <SelectItem value="juice">Juice</SelectItem>
                              <SelectItem value="mocktails">Mocktails</SelectItem>
                              <SelectItem value="snacks">Snacks</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="Price (RWF)" type="number" value={newMenuItem.price} onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })} />
                          <div className="flex items-center space-x-2">
                            <Switch checked={newMenuItem.isAvailable} onCheckedChange={(checked) => setNewMenuItem({ ...newMenuItem, isAvailable: checked })} />
                            <span className="text-sm">Available</span>
                          </div>
                        </div>
                        
                        {/* Image Upload */}
                        <div className="mt-4">
                          <label className="text-sm font-medium">Item Image</label>
                          <div className="mt-2 flex items-center space-x-4">
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
                              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                            />
                            {newMenuItem.image && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border">
                                <img src={newMenuItem.image} alt="Item preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                        <Textarea placeholder="Description" value={newMenuItem.description} onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })} className="mt-2" />
                        <div className="mt-2 flex gap-2">
                          {editingMenuItem ? (
                            <>
                              <Button onClick={updateMenuItem}>Update Item</Button>
                              <Button variant="outline" onClick={() => {
                                setEditingMenuItem(null)
                                setNewMenuItem({ name: "", description: "", price: "", category: "", isAvailable: true, image: "" })
                              }}>Cancel</Button>
                            </>
                          ) : (
                            <Button onClick={addMenuItem}>Add Item</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bar Items List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Bar Menu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {menuItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center space-x-3">
                                {item.image && (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">{item.description}</div>
                                  <div className="text-sm">RWF {item.price} • {item.category}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                  {item.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => editMenuItem(item)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toggleMenuItemAvailability(item)}
                                >
                                  {item.isAvailable ? "Disable" : "Enable"}
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteMenuItem(item)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                          {menuItems.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">No bar items yet</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bar Orders */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {orders.slice(0, 5).map((order, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <div className="font-medium">Order #{order.id || idx + 1}</div>
                                <div className="text-sm text-muted-foreground">{order.items?.length || 0} items</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{order.status || "pending"}</Badge>
                                <span className="text-sm">RWF {order.total || 0}</span>
                              </div>
                            </div>
                          ))}
                          {orders.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">No orders yet</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings - {establishmentSettings.name}</DialogTitle>
              <DialogDescription>
                Update the settings for this attached establishment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Establishment Name</label>
                <Input 
                  value={establishmentSettings.name} 
                  onChange={(e) => setEstablishmentSettings({ ...establishmentSettings, name: e.target.value })}
                  placeholder="Enter establishment name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={establishmentSettings.description} 
                  onChange={(e) => setEstablishmentSettings({ ...establishmentSettings, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={establishmentSettings.type} 
                  onValueChange={(value) => setEstablishmentSettings({ ...establishmentSettings, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="text-sm text-muted-foreground">
                  Current status: <Badge variant="outline">{establishmentSettings.status}</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateEstablishmentSettings}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Attached Establishment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{establishmentToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">Warning</span>
              </div>
              <p className="text-sm text-red-700 mt-2">
                This will permanently delete the attached establishment and all its associated data including menu items, orders, and settings.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteEstablishment}>
                Delete Permanently
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Employee Dialog */}
        <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Add a new employee to your hotel roster</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    placeholder="employee@hotel.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                    placeholder="Temporary password"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    placeholder="+250 XXX XXX XXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <Select value={newEmployee.role} onValueChange={(value) => setNewEmployee({...newEmployee, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                    placeholder="Job position"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Input
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                    placeholder="Department"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hire Date</label>
                  <Input
                    type="date"
                    value={newEmployee.hireDate}
                    onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Salary</label>
                  <Input
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                    placeholder="Monthly salary"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Textarea
                  value={newEmployee.address}
                  onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                  placeholder="Employee address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Emergency Contact</label>
                  <Input
                    value={newEmployee.emergencyContact}
                    onChange={(e) => setNewEmployee({...newEmployee, emergencyContact: e.target.value})}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Emergency Phone</label>
                  <Input
                    value={newEmployee.emergencyPhone}
                    onChange={(e) => setNewEmployee({...newEmployee, emergencyPhone: e.target.value})}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddEmployeeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} disabled={isLoadingEmployees || !newEmployee.name || !newEmployee.email || !newEmployee.password}>
                {isLoadingEmployees ? "Adding..." : "Add Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Employee Details Dialog */}
        <Dialog open={showEmployeeDetailsDialog} onOpenChange={setShowEmployeeDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg font-semibold">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p>{selectedEmployee.phone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <Badge variant="outline">{selectedEmployee.role}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p>{selectedEmployee.position || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p>{selectedEmployee.department || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                    <p>{selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={selectedEmployee.isActive ? "default" : "secondary"}>
                      {selectedEmployee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                {selectedEmployee.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="bg-gray-50 p-3 rounded">{selectedEmployee.address}</p>
                  </div>
                )}
                
                {(selectedEmployee.emergencyContact || selectedEmployee.emergencyPhone) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                    <p>{selectedEmployee.emergencyContact || "N/A"} - {selectedEmployee.emergencyPhone || "N/A"}</p>
                  </div>
                )}
                
                {selectedEmployee.salary && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salary</label>
                    <p className="text-lg font-semibold text-primary">RWF {selectedEmployee.salary}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmployeeDetailsDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowEmployeeDetailsDialog(false)
                handleEditEmployeeClick(selectedEmployee)
              }}>
                Edit Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update employee information</DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      value={selectedEmployee.name}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, name: e.target.value})}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={selectedEmployee.email}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                      placeholder="employee@hotel.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={selectedEmployee.phone || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, phone: e.target.value})}
                      placeholder="+250 XXX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role *</label>
                    <Select value={selectedEmployee.role} onValueChange={(value) => setSelectedEmployee({...selectedEmployee, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Position</label>
                    <Input
                      value={selectedEmployee.position || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, position: e.target.value})}
                      placeholder="Job position"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <Input
                      value={selectedEmployee.department || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, department: e.target.value})}
                      placeholder="Department"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hire Date</label>
                    <Input
                      type="date"
                      value={selectedEmployee.hireDate || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, hireDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Salary</label>
                    <Input
                      value={selectedEmployee.salary || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, salary: e.target.value})}
                      placeholder="Monthly salary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Textarea
                    value={selectedEmployee.address || ""}
                    onChange={(e) => setSelectedEmployee({...selectedEmployee, address: e.target.value})}
                    placeholder="Employee address"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Emergency Contact</label>
                    <Input
                      value={selectedEmployee.emergencyContact || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, emergencyContact: e.target.value})}
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Emergency Phone</label>
                    <Input
                      value={selectedEmployee.emergencyPhone || ""}
                      onChange={(e) => setSelectedEmployee({...selectedEmployee, emergencyPhone: e.target.value})}
                      placeholder="Emergency contact phone"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={selectedEmployee.isActive}
                    onCheckedChange={(checked) => setSelectedEmployee({...selectedEmployee, isActive: checked})}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Active Employee</label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditEmployeeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleEditEmployee(selectedEmployee._id, selectedEmployee)} disabled={isLoadingEmployees || !selectedEmployee?.name || !selectedEmployee?.email}>
                {isLoadingEmployees ? "Updating..." : "Update Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}


