"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  LogOut,
  Calendar,
  Users,
  Home,
  AlertCircle,
  Settings
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AIHints } from "@/components/ai-hints"

interface MaintenanceRequest {
  _id: string
  title: string
  description: string
  category: "plumbing" | "electrical" | "hvac" | "furniture" | "appliance" | "structural" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  location: string
  roomNumber?: string
  assignedTo: string
  reportedBy: string
  reportedAt: string
  scheduledFor?: string
  completedAt?: string
  estimatedCost?: number
  actualCost?: number
  notes?: string
  images?: string[]
  equipment?: string[]
  parts?: string[]
}

interface Equipment {
  _id: string
  name: string
  type: string
  location: string
  status: "operational" | "maintenance" | "broken" | "retired"
  lastMaintenance?: string
  nextMaintenance?: string
  warranty?: string
  supplier?: string
  model?: string
  serialNumber?: string
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

interface MaintenanceSettings {
  autoAssignRequests: boolean
  maintenanceSchedule: {
    daily: string[]
    weekly: string[]
    monthly: string[]
    quarterly: string[]
  }
  equipment: string[]
  suppliers: string[]
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export default function MaintenanceDashboard() {
  const { user } = useAuth()
  const params = useParams()
  const restaurantId = params.restaurantId as string

  // State management
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<EquipmentPurchaseRequest[]>([])
  const [settings, setSettings] = useState<MaintenanceSettings>({
    autoAssignRequests: true,
    maintenanceSchedule: {
      daily: ["Check HVAC", "Inspect plumbing", "Test emergency systems"],
      weekly: ["Clean filters", "Check electrical panels", "Inspect fire safety"],
      monthly: ["Service equipment", "Deep clean systems", "Safety inspections"],
      quarterly: ["Major equipment service", "System upgrades", "Compliance checks"]
    },
    equipment: ["HVAC", "Plumbing", "Electrical", "Fire Safety", "Security"],
    suppliers: ["ABC Maintenance", "XYZ Services", "Local Electrician"],
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  })
  const [newRequest, setNewRequest] = useState<Partial<MaintenanceRequest>>({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    location: "",
    roomNumber: "",
    assignedTo: user?.name || "",
    reportedBy: user?.name || "",
    reportedAt: new Date().toISOString(),
    estimatedCost: 0
  })
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showRequestDetailsDialog, setShowRequestDetailsDialog] = useState(false)
  const [newPurchaseRequest, setNewPurchaseRequest] = useState<Partial<EquipmentPurchaseRequest>>({
    equipmentName: "",
    description: "",
    category: "",
    priority: "medium",
    estimatedCost: 0,
    quantity: 1,
    vendor: "",
    justification: ""
  })
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] = useState<EquipmentPurchaseRequest | null>(null)
  const [showPurchaseRequestDialog, setShowPurchaseRequestDialog] = useState(false)
  const [showPurchaseRequestDetailsDialog, setShowPurchaseRequestDetailsDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Check if maintenance is supported
  const isMaintenanceSupported = user?.establishmentType === "hotel" || user?.establishmentType === "restaurant"

  // Fetch data
  useEffect(() => {
    if (restaurantId && isMaintenanceSupported) {
      fetchRequests()
      fetchEquipment()
      fetchPurchaseRequests()
      fetchSettings()
    }
  }, [restaurantId, isMaintenanceSupported])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setError('Failed to fetch maintenance requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('Failed to fetch maintenance requests')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/equipment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEquipment(data.equipment || [])
      } else {
        setError('Failed to fetch equipment')
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
      setError('Failed to fetch equipment')
    }
  }

  const fetchPurchaseRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/purchase-requests`, {
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
  }

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  // Calculate statistics
  const totalRequests = requests.length
  const pendingRequests = requests.filter(req => req.status === "pending").length
  const inProgressRequests = requests.filter(req => req.status === "in_progress").length
  const completedRequests = requests.filter(req => req.status === "completed").length
  const urgentRequests = requests.filter(req => req.priority === "urgent").length
  const totalEquipment = equipment.length
  const operationalEquipment = equipment.filter(eq => eq.status === "operational").length
  const brokenEquipment = equipment.filter(eq => eq.status === "broken").length

  // Handlers
  const handleAddRequest = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      })

      if (response.ok) {
        setSuccess('Maintenance request created successfully')
        setShowRequestDialog(false)
        setNewRequest({
          title: "",
          description: "",
          category: "other",
          priority: "medium",
          location: "",
          roomNumber: "",
          assignedTo: user?.name || "",
          reportedBy: user?.name || "",
          reportedAt: new Date().toISOString(),
          estimatedCost: 0
        })
        fetchRequests()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create request')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      setError('Failed to create request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setSuccess('Request status updated successfully')
        fetchRequests()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update request')
      }
    } catch (error) {
      console.error('Error updating request:', error)
      setError('Failed to update request')
    }
  }

  const handleViewRequestDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request)
    setShowRequestDetailsDialog(true)
  }

  const handleCreatePurchaseRequest = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/purchase-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPurchaseRequest)
      })

      if (response.ok) {
        setSuccess('Purchase request created successfully')
        setShowPurchaseRequestDialog(false)
        setNewPurchaseRequest({
          equipmentName: "",
          description: "",
          category: "",
          priority: "medium",
          estimatedCost: 0,
          quantity: 1,
          vendor: "",
          justification: ""
        })
        fetchPurchaseRequests()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create purchase request')
      }
    } catch (error) {
      console.error('Error creating purchase request:', error)
      setError('Failed to create purchase request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPurchaseRequestDetails = (request: EquipmentPurchaseRequest) => {
    setSelectedPurchaseRequest(request)
    setShowPurchaseRequestDetailsDialog(true)
  }

  const handleDeletePurchaseRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/maintenance/${restaurantId}/purchase-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setSuccess('Purchase request deleted successfully')
        fetchPurchaseRequests()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete purchase request')
      }
    } catch (error) {
      console.error('Error deleting purchase request:', error)
      setError('Failed to delete purchase request')
    }
  }

  if (!isMaintenanceSupported) {
    return (
      <ProtectedRoute allowedRoles={["maintenance"]}>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Maintenance Not Supported</h2>
            <p className="text-muted-foreground">
              Maintenance features are only available for hotels and restaurants.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["maintenance"]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Dashboard</h1>
            <p className="text-muted-foreground">Manage maintenance requests and equipment</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              localStorage.removeItem('token')
              window.location.href = '/login'
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" onClick={() => {
              fetchRequests()
              fetchEquipment()
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{totalRequests}</p>
                </div>
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRequests}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{inProgressRequests}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedRequests}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="purchase-requests">Purchase Requests</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Maintenance Requests</h2>
              <Button onClick={() => setShowRequestDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Request
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === "completed" ? "default" :
                            request.status === "in_progress" ? "secondary" :
                            request.status === "pending" ? "outline" : "destructive"
                          }>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            request.priority === "urgent" ? "destructive" :
                            request.priority === "high" ? "secondary" : "outline"
                          }>
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>{request.assignedTo}</TableCell>
                        <TableCell>{new Date(request.reportedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewRequestDetails(request)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === "pending" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleUpdateRequestStatus(request._id, "in_progress")}
                              >
                                Start
                              </Button>
                            )}
                            {request.status === "in_progress" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleUpdateRequestStatus(request._id, "completed")}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <h2 className="text-2xl font-bold">Equipment Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map((item) => (
                <Card key={item._id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant={
                        item.status === "operational" ? "default" :
                        item.status === "maintenance" ? "secondary" :
                        item.status === "broken" ? "destructive" : "outline"
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.type}</p>
                    <p className="text-xs text-muted-foreground mb-2">Location: {item.location}</p>
                    {item.lastMaintenance && (
                      <p className="text-xs text-muted-foreground">
                        Last maintenance: {new Date(item.lastMaintenance).toLocaleDateString()}
                      </p>
                    )}
                    {item.nextMaintenance && (
                      <p className="text-xs text-muted-foreground">
                        Next maintenance: {new Date(item.nextMaintenance).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Purchase Requests Tab */}
          <TabsContent value="purchase-requests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Equipment Purchase Requests</h2>
              <Button onClick={() => setShowPurchaseRequestDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchaseRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{request.equipmentName}</h3>
                      <Badge variant={
                        request.status === "approved" ? "default" :
                        request.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><strong>Category:</strong> {request.category}</p>
                      <p><strong>Priority:</strong> {request.priority}</p>
                      <p><strong>Estimated Cost:</strong> ${request.estimatedCost}</p>
                      {request.approvedAmount && (
                        <p><strong>Approved Amount:</strong> ${request.approvedAmount}</p>
                      )}
                      <p><strong>Quantity:</strong> {request.quantity}</p>
                      <p><strong>Vendor:</strong> {request.vendor}</p>
                      <p><strong>Requested by:</strong> {request.requestedByName}</p>
                      <p><strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPurchaseRequestDetails(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {request.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePurchaseRequest(request._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {purchaseRequests.length === 0 && (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Purchase Requests</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any equipment purchase requests yet.
                </p>
                <Button onClick={() => setShowPurchaseRequestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <h2 className="text-2xl font-bold">Maintenance Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {settings.maintenanceSchedule.daily.map((task, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {settings.maintenanceSchedule.weekly.map((task, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {settings.maintenanceSchedule.monthly.map((task, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quarterly Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {settings.maintenanceSchedule.quarterly.map((task, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-2xl font-bold">Maintenance Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Equipment Categories</CardTitle>
                <CardDescription>Manage equipment types and suppliers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Equipment Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.equipment.map((item, index) => (
                      <Badge key={index} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Suppliers</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.suppliers.map((supplier, index) => (
                      <Badge key={index} variant="secondary">{supplier}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Maintenance Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Detailed description of the maintenance needed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={newRequest.category}
                    onValueChange={(value) => setNewRequest({...newRequest, category: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="appliance">Appliance</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value) => setNewRequest({...newRequest, priority: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newRequest.location}
                    onChange={(e) => setNewRequest({...newRequest, location: e.target.value})}
                    placeholder="General location"
                  />
                </div>
                <div>
                  <Label>Room Number (if applicable)</Label>
                  <Input
                    value={newRequest.roomNumber}
                    onChange={(e) => setNewRequest({...newRequest, roomNumber: e.target.value})}
                    placeholder="Room number"
                  />
                </div>
              </div>
              <div>
                <Label>Estimated Cost</Label>
                <Input
                  type="number"
                  value={newRequest.estimatedCost}
                  onChange={(e) => setNewRequest({...newRequest, estimatedCost: parseFloat(e.target.value)})}
                  placeholder="Estimated cost in RWF"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRequest} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Details Dialog */}
        <Dialog open={showRequestDetailsDialog} onOpenChange={setShowRequestDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="text-lg font-semibold">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <Badge variant="outline">{selectedRequest.category}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={
                      selectedRequest.status === "completed" ? "default" :
                      selectedRequest.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <Badge variant={
                      selectedRequest.priority === "urgent" ? "destructive" :
                      selectedRequest.priority === "high" ? "secondary" : "outline"
                    }>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="text-sm">{selectedRequest.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                    <p className="text-sm">{selectedRequest.assignedTo}</p>
                  </div>
                </div>
                {selectedRequest.estimatedCost && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Cost</Label>
                    <p className="text-sm">RWF {selectedRequest.estimatedCost.toLocaleString()}</p>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequestDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Purchase Request Dialog */}
        <Dialog open={showPurchaseRequestDialog} onOpenChange={setShowPurchaseRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Equipment Purchase Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipmentName">Equipment Name *</Label>
                  <Input
                    id="equipmentName"
                    value={newPurchaseRequest.equipmentName || ""}
                    onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, equipmentName: e.target.value})}
                    placeholder="e.g., Industrial Vacuum Cleaner"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={newPurchaseRequest.category || ""}
                    onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, category: e.target.value})}
                    placeholder="e.g., Cleaning Equipment"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newPurchaseRequest.description || ""}
                  onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, description: e.target.value})}
                  placeholder="Detailed description of the equipment needed"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={newPurchaseRequest.priority || "medium"}
                    onValueChange={(value) => setNewPurchaseRequest({...newPurchaseRequest, priority: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newPurchaseRequest.quantity || 1}
                    onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, quantity: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedCost">Estimated Cost (RWF)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    value={newPurchaseRequest.estimatedCost || 0}
                    onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, estimatedCost: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    value={newPurchaseRequest.vendor || ""}
                    onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, vendor: e.target.value})}
                    placeholder="Preferred vendor name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  value={newPurchaseRequest.justification || ""}
                  onChange={(e) => setNewPurchaseRequest({...newPurchaseRequest, justification: e.target.value})}
                  placeholder="Why is this equipment needed? How will it improve operations?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPurchaseRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePurchaseRequest} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Purchase Request Details Dialog */}
        <Dialog open={showPurchaseRequestDetailsDialog} onOpenChange={setShowPurchaseRequestDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Request Details</DialogTitle>
            </DialogHeader>
            {selectedPurchaseRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Equipment Name</Label>
                    <p className="text-lg font-semibold">{selectedPurchaseRequest.equipmentName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={
                      selectedPurchaseRequest.status === "approved" ? "default" :
                      selectedPurchaseRequest.status === "rejected" ? "destructive" : "secondary"
                    }>
                      {selectedPurchaseRequest.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-sm">{selectedPurchaseRequest.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <Badge variant={
                      selectedPurchaseRequest.priority === "urgent" ? "destructive" :
                      selectedPurchaseRequest.priority === "high" ? "secondary" : "outline"
                    }>
                      {selectedPurchaseRequest.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedPurchaseRequest.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Cost</Label>
                    <p className="text-sm">RWF {selectedPurchaseRequest.estimatedCost.toLocaleString()}</p>
                  </div>
                  {selectedPurchaseRequest.approvedAmount && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Approved Amount</Label>
                      <p className="text-sm">RWF {selectedPurchaseRequest.approvedAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                    <p className="text-sm">{selectedPurchaseRequest.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Vendor</Label>
                    <p className="text-sm">{selectedPurchaseRequest.vendor || "Not specified"}</p>
                  </div>
                </div>
                {selectedPurchaseRequest.justification && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Justification</Label>
                    <p className="text-sm">{selectedPurchaseRequest.justification}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Requested By</Label>
                    <p className="text-sm">{selectedPurchaseRequest.requestedByName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <p className="text-sm">{new Date(selectedPurchaseRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedPurchaseRequest.reviewedByName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Reviewed By</Label>
                      <p className="text-sm">{selectedPurchaseRequest.reviewedByName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Review Date</Label>
                      <p className="text-sm">{selectedPurchaseRequest.reviewedAt ? new Date(selectedPurchaseRequest.reviewedAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                )}
                {selectedPurchaseRequest.comments && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Comments</Label>
                    <p className="text-sm">{selectedPurchaseRequest.comments}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPurchaseRequestDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Hints */}
        <AIHints 
          data={{
            requests,
            equipment,
            purchaseRequests,
            settings,
            statistics: {
              totalRequests,
              pendingRequests,
              inProgressRequests,
              completedRequests,
              urgentRequests,
              totalEquipment,
              operationalEquipment,
              brokenEquipment
            }
          }}
        />
      </div>
    </ProtectedRoute>
  )
}
