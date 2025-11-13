"use client"

import { useState, useEffect, useMemo } from "react"
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
  Users, 
  Clock, 
  Calendar, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  UserCheck,
  CalendarDays,
  Settings,
  Bell,
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Download,
  LogOut
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Employee {
  _id: string
  name: string
  email: string
  role: string
  position: string
  department: string
  phone: string
  address: string
  hireDate: string
  salary: string
  emergencyContact: string
  emergencyPhone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AttendanceRecord {
  _id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  status: "present" | "absent" | "late" | "half-day"
  notes: string
  createdAt: string
}

interface Shift {
  _id: string
  name: string
  role: string
  day: string
  startTime: string
  endTime: string
  maxEmployees: number
  assignedEmployees: string[]
  isActive: boolean
  createdAt: string
}

interface HrSettings {
  notifications: {
    newHires: boolean
    attendanceAlerts: boolean
    scheduleChanges: boolean
    payrollReminders: boolean
    emailNotifications: boolean
    smsNotifications: boolean
  }
  attendance: {
    autoClockOut: boolean
    lateThreshold: number
    overtimeThreshold: number
    requireNotes: boolean
    allowSelfCheckIn: boolean
  }
  payroll: {
    payPeriod: string
    overtimeRate: number
    currency: string
    taxRate: number
    benefits: string[]
  }
  policies: {
    vacationDays: number
    sickDays: number
    personalDays: number
    probationPeriod: number
    noticePeriod: number
  }
}

export default function HrDashboard() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const { user } = useAuth()
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [settings, setSettings] = useState<HrSettings>({
    notifications: {
      newHires: true,
      attendanceAlerts: true,
      scheduleChanges: true,
      payrollReminders: true,
      emailNotifications: true,
      smsNotifications: false
    },
    attendance: {
      autoClockOut: false,
      lateThreshold: 15,
      overtimeThreshold: 8,
      requireNotes: false,
      allowSelfCheckIn: true
    },
    payroll: {
      payPeriod: "monthly",
      overtimeRate: 1.5,
      currency: "RWF",
      taxRate: 0.15,
      benefits: []
    },
    policies: {
      vacationDays: 21,
      sickDays: 7,
      personalDays: 3,
      probationPeriod: 90,
      noticePeriod: 30
    }
  })
  
  // Dialog states
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false)
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false)
  const [showEmployeeDetailsDialog, setShowEmployeeDetailsDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null)
  
  // Form states
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
    position: "",
    department: "",
    phone: "",
    address: "",
    hireDate: "",
    salary: "",
    emergencyContact: "",
    emergencyPhone: ""
  })
  
  const [newAttendance, setNewAttendance] = useState({
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: ""
  })
  
  const [newShift, setNewShift] = useState({
    name: "",
    role: "",
    day: "",
    startTime: "",
    endTime: "",
    maxEmployees: 1
  })
  
  // Filter and search states
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [employeeFilterRole, setEmployeeFilterRole] = useState("all")
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState("all")
  const [attendanceDateFilter, setAttendanceDateFilter] = useState("")
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState("all")
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Report generation state
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    format: "json"
  })
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)

  // Check if HR is supported for this establishment
  const isHrSupported = useMemo(() => {
    const establishmentType = (user as any)?.establishmentType?.toString().toLowerCase()
    return establishmentType === "hotel" || establishmentType === "restaurant"
  }, [user])

  // Fetch data on component mount
  useEffect(() => {
    if (restaurantId) {
      // Check if user is logged in
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to access HR features.')
        return
      }
      
      fetchEmployees()
      fetchAttendanceRecords()
      fetchShifts()
      fetchSettings()
    }
  }, [restaurantId])

  // Data fetching functions
  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      } else {
        console.error('Failed to fetch employees:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('Error details:', errorData)
        
        if (response.status === 401) {
          setError('Authentication required. Please log in to access HR features.')
          // Optionally redirect to login
          // window.location.href = '/login'
        } else {
          setError(errorData.error || 'Failed to fetch employees')
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
    }
  }

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/shifts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setShifts(data.shifts || [])
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/settings`, {
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

  // Employee management functions
  const handleAddEmployee = async () => {
    try {
      setIsLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/employees`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmployee)
      })
      
      if (response.ok) {
        setSuccess('Employee added successfully!')
        setShowAddEmployeeDialog(false)
        setNewEmployee({
          name: "",
          email: "",
          password: "",
          role: "receptionist",
          position: "",
          department: "",
          phone: "",
          address: "",
          hireDate: "",
          salary: "",
          emergencyContact: "",
          emergencyPhone: ""
        })
        fetchEmployees()
        setTimeout(() => setSuccess(""), 5000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add employee')
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      setError('Error adding employee')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEmployee = async (employeeId: string, updatedData: any) => {
    try {
      setIsLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      
      if (response.ok) {
        setSuccess('Employee updated successfully!')
        setShowEditEmployeeDialog(false)
        setSelectedEmployee(null)
        fetchEmployees()
        setTimeout(() => setSuccess(""), 5000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      setError('Error updating employee')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    
    try {
      setIsLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setSuccess('Employee deleted successfully!')
        fetchEmployees()
        setTimeout(() => setSuccess(""), 5000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      setError('Error deleting employee')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewEmployeeDetails = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEmployeeDetailsDialog(true)
  }

  const handleEditEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditEmployeeDialog(true)
  }

  // Attendance management functions
  const handleAddAttendance = async () => {
    try {
      setIsLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hr/${restaurantId}/attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAttendance)
      })
      
      if (response.ok) {
        setSuccess('Attendance record added successfully!')
        setShowAttendanceDialog(false)
        setNewAttendance({
          employeeId: "",
          date: new Date().toISOString().split('T')[0],
          checkIn: "",
          checkOut: "",
          status: "present",
          notes: ""
        })
        fetchAttendanceRecords()
        setTimeout(() => setSuccess(""), 5000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add attendance record')
      }
    } catch (error) {
      console.error('Error adding attendance record:', error)
      setError('Error adding attendance record')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter functions
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.position?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    
    const matchesRole = employeeFilterRole === "all" || employee.role === employeeFilterRole
    const matchesStatus = employeeFilterStatus === "all" || employee.isActive === (employeeFilterStatus === "active")
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const filteredAttendance = attendanceRecords.filter(record => {
    const matchesDate = !attendanceDateFilter || record.date === attendanceDateFilter
    const matchesStatus = attendanceStatusFilter === "all" || record.status === attendanceStatusFilter
    
    return matchesDate && matchesStatus
  })

  // Report generation functions
  const generateReport = async (reportType: string) => {
    try {
      setGeneratingReport(reportType)
      setError("")
      
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams({
        startDate: reportFilters.startDate,
        endDate: reportFilters.endDate,
        format: reportFilters.format
      })
      
      const response = await fetch(`/api/hr/${restaurantId}/reports/${reportType}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        if (reportFilters.format === "csv") {
          // Handle CSV download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          setSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully`)
        } else {
          // Handle JSON response
          const data = await response.json()
          console.log('Report data received:', data)
          setReportData(data.data)
          setShowReportDialog(true)
          setSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`)
        }
      } else {
        const errorData = await response.json()
        console.error('Report generation failed:', errorData)
        setError(errorData.error || `Failed to generate ${reportType} report`)
      }
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error)
      setError(`Failed to generate ${reportType} report`)
    } finally {
      setGeneratingReport(null)
    }
  }

  const handleReportFilterChange = (field: string, value: string) => {
    setReportFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Statistics calculations
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(emp => emp.isActive).length
  const todayAttendance = attendanceRecords.filter(record => 
    record.date === new Date().toISOString().split('T')[0]
  )
  const presentToday = todayAttendance.filter(record => record.status === "present").length
  const absentToday = todayAttendance.filter(record => record.status === "absent").length
  const lateToday = todayAttendance.filter(record => record.status === "late").length

  if (!isHrSupported) {
    return (
      <ProtectedRoute allowedRoles={["hr"]}>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">HR Dashboard Not Available</h2>
            <p className="text-muted-foreground">
              HR functionality is only available for hotels and restaurants with HR management capabilities.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["hr"]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground mt-2">Human Resources Management System</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
              <AlertCircle className="h-5 w-5 text-red-400" />
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

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold">{activeEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                  <p className="text-2xl font-bold">{presentToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Absent Today</p>
                  <p className="text-2xl font-bold">{absentToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
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
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Attendance Management</h2>
                <p className="text-muted-foreground">Track employee attendance and working hours</p>
              </div>
              <Button onClick={() => setShowAttendanceDialog(true)} className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Add Attendance
              </Button>
            </div>

            {/* Attendance Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={attendanceDateFilter}
                      onChange={(e) => setAttendanceDateFilter(e.target.value)}
                    />
                  </div>
                  <Select value={attendanceStatusFilter} onValueChange={setAttendanceStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    setAttendanceDateFilter("")
                    setAttendanceStatusFilter("all")
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Records ({filteredAttendance.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAttendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendance.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">{record.employeeName}</TableCell>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.checkIn || "N/A"}</TableCell>
                          <TableCell>{record.checkOut || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === "present" ? "default" :
                              record.status === "late" ? "outline" :
                              record.status === "half-day" ? "secondary" :
                              "destructive"
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.notes || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
                    <p className="text-muted-foreground mb-4">
                      {attendanceRecords.length === 0 
                        ? "No attendance records have been created yet."
                        : "No records match your current filter criteria."
                      }
                    </p>
                    {attendanceRecords.length === 0 && (
                      <Button onClick={() => setShowAttendanceDialog(true)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Add First Record
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Shift Scheduling</h2>
                <p className="text-muted-foreground">Manage employee shifts and schedules</p>
              </div>
              <Button onClick={() => setShowShiftDialog(true)} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Add Shift
              </Button>
            </div>

            {/* Shifts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Shifts ({shifts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shifts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shift Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Max Employees</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shifts.map((shift) => (
                        <TableRow key={shift._id}>
                          <TableCell className="font-medium">{shift.name}</TableCell>
                          <TableCell>{shift.role}</TableCell>
                          <TableCell>{shift.day}</TableCell>
                          <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                          <TableCell>{shift.maxEmployees}</TableCell>
                          <TableCell>
                            <Badge variant={shift.isActive ? "default" : "secondary"}>
                              {shift.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No shifts found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first shift schedule to get started.
                    </p>
                    <Button onClick={() => setShowShiftDialog(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Add First Shift
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">HR Reports & Analytics</h2>
              <p className="text-muted-foreground">Generate comprehensive reports and view analytics</p>
            </div>

            {/* Report Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Report Filters</CardTitle>
                <CardDescription>Configure date range and output format for your reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) => handleReportFilterChange("startDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) => handleReportFilterChange("endDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <Select
                      value={reportFilters.format}
                      onValueChange={(value) => handleReportFilterChange("format", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON (View in Browser)</SelectItem>
                        <SelectItem value="csv">CSV (Download)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Generation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Employee Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate comprehensive employee reports including personal information, attendance, and performance metrics.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => generateReport("employee")}
                    disabled={generatingReport === "employee"}
                  >
                    {generatingReport === "employee" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Attendance Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View attendance trends, late arrivals, absence patterns, and department-wise attendance statistics.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => generateReport("attendance")}
                    disabled={generatingReport === "attendance"}
                  >
                    {generatingReport === "attendance" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate detailed payroll reports with salary calculations, overtime, deductions, and department-wise totals.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => generateReport("payroll")}
                    disabled={generatingReport === "payroll"}
                  >
                    {generatingReport === "payroll" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Report Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Performance Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analyze employee performance metrics, productivity trends, and goal achievements.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate compliance reports for labor laws, safety regulations, and policy adherence.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">HR Settings</h2>
              <p className="text-muted-foreground">Configure HR policies and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newHires">New Hire Notifications</Label>
                    <Switch
                      id="newHires"
                      checked={settings.notifications.newHires}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, newHires: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="attendanceAlerts">Attendance Alerts</Label>
                    <Switch
                      id="attendanceAlerts"
                      checked={settings.notifications.attendanceAlerts}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, attendanceAlerts: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scheduleChanges">Schedule Changes</Label>
                    <Switch
                      id="scheduleChanges"
                      checked={settings.notifications.scheduleChanges}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, scheduleChanges: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Attendance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                    <Input
                      id="lateThreshold"
                      type="number"
                      value={settings.attendance.lateThreshold}
                      onChange={(e) => setSettings({
                        ...settings,
                        attendance: { ...settings.attendance, lateThreshold: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtimeThreshold">Overtime Threshold (hours)</Label>
                    <Input
                      id="overtimeThreshold"
                      type="number"
                      value={settings.attendance.overtimeThreshold}
                      onChange={(e) => setSettings({
                        ...settings,
                        attendance: { ...settings.attendance, overtimeThreshold: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowSelfCheckIn">Allow Self Check-in</Label>
                    <Switch
                      id="allowSelfCheckIn"
                      checked={settings.attendance.allowSelfCheckIn}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        attendance: { ...settings.attendance, allowSelfCheckIn: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="payPeriod">Pay Period</Label>
                    <Select value={settings.payroll.payPeriod} onValueChange={(value) => setSettings({
                      ...settings,
                      payroll: { ...settings.payroll, payPeriod: value }
                    })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="overtimeRate">Overtime Rate</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.1"
                      value={settings.payroll.overtimeRate}
                      onChange={(e) => setSettings({
                        ...settings,
                        payroll: { ...settings.payroll, overtimeRate: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.payroll.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        payroll: { ...settings.payroll, currency: e.target.value }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Company Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vacationDays">Vacation Days</Label>
                    <Input
                      id="vacationDays"
                      type="number"
                      value={settings.policies.vacationDays}
                      onChange={(e) => setSettings({
                        ...settings,
                        policies: { ...settings.policies, vacationDays: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sickDays">Sick Days</Label>
                    <Input
                      id="sickDays"
                      type="number"
                      value={settings.policies.sickDays}
                      onChange={(e) => setSettings({
                        ...settings,
                        policies: { ...settings.policies, sickDays: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="probationPeriod">Probation Period (days)</Label>
                    <Input
                      id="probationPeriod"
                      type="number"
                      value={settings.policies.probationPeriod}
                      onChange={(e) => setSettings({
                        ...settings,
                        policies: { ...settings.policies, probationPeriod: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => {
                // Save settings logic here
                setSuccess('Settings saved successfully!')
                setTimeout(() => setSuccess(""), 5000)
              }}>
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Employee Dialog */}
        <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
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
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                    placeholder="Temporary password"
                    required
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    placeholder="+250 XXX XXX XXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Role *</Label>
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
                  <Label>Position</Label>
                  <Input
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                    placeholder="Job position"
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                    placeholder="Department"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hire Date</Label>
                  <Input
                    type="date"
                    value={newEmployee.hireDate}
                    onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Salary</Label>
                  <Input
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                    placeholder="Monthly salary"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={newEmployee.address}
                  onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                  placeholder="Employee address"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact</Label>
                  <Input
                    value={newEmployee.emergencyContact}
                    onChange={(e) => setNewEmployee({...newEmployee, emergencyContact: e.target.value})}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <Label>Emergency Phone</Label>
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
              <Button onClick={handleAddEmployee} disabled={isLoading || !newEmployee.name || !newEmployee.email || !newEmployee.password}>
                {isLoading ? "Adding..." : "Add Employee"}
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
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-semibold">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p>{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p>{selectedEmployee.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge variant="outline">{selectedEmployee.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                    <p>{selectedEmployee.position || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p>{selectedEmployee.department || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                    <p>{selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedEmployee.isActive ? "default" : "secondary"}>
                      {selectedEmployee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                {selectedEmployee.address && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="bg-gray-50 p-3 rounded">{selectedEmployee.address}</p>
                  </div>
                )}
                
                {(selectedEmployee.emergencyContact || selectedEmployee.emergencyPhone) && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                    <p>{selectedEmployee.emergencyContact || "N/A"} - {selectedEmployee.emergencyPhone || "N/A"}</p>
                  </div>
                )}
                
                {selectedEmployee.salary && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Salary</Label>
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
                handleEditEmployeeClick(selectedEmployee!)
              }}>
                Edit Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Attendance Dialog */}
        <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Attendance Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Employee *</Label>
                <Select value={newAttendance.employeeId} onValueChange={(value) => setNewAttendance({...newAttendance, employeeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newAttendance.date}
                  onChange={(e) => setNewAttendance({...newAttendance, date: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check In</Label>
                  <Input
                    type="time"
                    value={newAttendance.checkIn}
                    onChange={(e) => setNewAttendance({...newAttendance, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Check Out</Label>
                  <Input
                    type="time"
                    value={newAttendance.checkOut}
                    onChange={(e) => setNewAttendance({...newAttendance, checkOut: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Status *</Label>
                <Select value={newAttendance.status} onValueChange={(value: any) => setNewAttendance({...newAttendance, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newAttendance.notes}
                  onChange={(e) => setNewAttendance({...newAttendance, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAttendanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAttendance} disabled={isLoading || !newAttendance.employeeId || !newAttendance.date}>
                {isLoading ? "Adding..." : "Add Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Report Display Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generated Report</DialogTitle>
            </DialogHeader>
            {reportData && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Report Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Report Type:</span> {reportData.reportType}
                    </div>
                    <div>
                      <span className="font-medium">Generated At:</span> {new Date(reportData.generatedAt).toLocaleString()}
                    </div>
                    {reportData.dateRange && (
                      <>
                        <div>
                          <span className="font-medium">Start Date:</span> {reportData.dateRange.startDate || "All time"}
                        </div>
                        <div>
                          <span className="font-medium">End Date:</span> {reportData.dateRange.endDate || "All time"}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {reportData.summary && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Summary Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {Object.entries(reportData.summary).map(([key, value]) => {
                        // Handle department stats specially
                        if (key === 'departmentStats' && typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="col-span-full">
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(value).map(([dept, count]) => (
                                  <div key={dept} className="bg-white p-2 rounded border">
                                    <span className="font-medium">{dept}:</span> {count}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        
                        // Handle other object values
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="col-span-full">
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          )
                        }
                        
                        // Handle primitive values
                        return (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {reportData.employees && (
                  <div>
                    <h3 className="font-semibold mb-2">Employee Data</h3>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.employees.slice(0, 10).map((emp: any) => (
                            <TableRow key={emp._id}>
                              <TableCell>{emp.name}</TableCell>
                              <TableCell>{emp.email}</TableCell>
                              <TableCell>{emp.role}</TableCell>
                              <TableCell>{emp.department}</TableCell>
                              <TableCell>
                                <Badge variant={emp.isActive ? "default" : "secondary"}>
                                  {emp.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {reportData.employees.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Showing first 10 of {reportData.employees.length} employees
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {reportData.attendanceRecords && (
                  <div>
                    <h3 className="font-semibold mb-2">Attendance Records</h3>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.attendanceRecords.slice(0, 10).map((record: any) => (
                            <TableRow key={record._id}>
                              <TableCell>{record.employeeName}</TableCell>
                              <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  record.status === "present" ? "default" :
                                  record.status === "absent" ? "destructive" :
                                  record.status === "late" ? "secondary" : "outline"
                                }>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.checkIn || "N/A"}</TableCell>
                              <TableCell>{record.checkOut || "N/A"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {reportData.attendanceRecords.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Showing first 10 of {reportData.attendanceRecords.length} records
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {reportData.payrollData && (
                  <div>
                    <h3 className="font-semibold mb-2">Payroll Data</h3>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Base Salary</TableHead>
                            <TableHead>Total Pay</TableHead>
                            <TableHead>Net Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.payrollData.slice(0, 10).map((emp: any) => (
                            <TableRow key={emp.employeeId}>
                              <TableCell>{emp.name}</TableCell>
                              <TableCell>{emp.department}</TableCell>
                              <TableCell>{emp.currency} {emp.baseSalary}</TableCell>
                              <TableCell>{emp.currency} {emp.totalPay}</TableCell>
                              <TableCell>{emp.currency} {emp.netPay}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {reportData.payrollData.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Showing first 10 of {reportData.payrollData.length} employees
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={async () => {
                try {
                  const token = localStorage.getItem('token')
                  const queryParams = new URLSearchParams({
                    startDate: reportFilters.startDate,
                    endDate: reportFilters.endDate,
                    format: "csv"
                  })
                  
                  // Determine report type from the data
                  const reportType = reportData.reportType?.toLowerCase().replace(' report', '') || 'employee'
                  
                  const response = await fetch(`/api/hr/${restaurantId}/reports/${reportType}?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    setSuccess('CSV report downloaded successfully')
                  } else {
                    setError('Failed to download CSV report')
                  }
                } catch (error) {
                  console.error('CSV download error:', error)
                  setError('Failed to download CSV report')
                }
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button onClick={() => {
                const dataStr = JSON.stringify(reportData, null, 2)
                const dataBlob = new Blob([dataStr], {type: 'application/json'})
                const url = URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `report-${new Date().toISOString().split('T')[0]}.json`
                link.click()
                URL.revokeObjectURL(url)
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}