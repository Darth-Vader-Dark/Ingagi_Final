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
  Home, 
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
  Bed,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AIHints } from "@/components/ai-hints"

interface Room {
  _id: string
  number: string
  type: string
  status: "clean" | "dirty" | "maintenance" | "occupied" | "out_of_order"
  lastCleaned?: string
  nextCleaning?: string
  assignedTo?: string
  notes?: string
  priority: "low" | "medium" | "high" | "urgent"
  cleaningType: "standard" | "deep" | "checkout" | "maintenance"
  estimatedTime?: number
  actualTime?: number
  supplies?: string[]
  issues?: string[]
}

interface CleaningTask {
  _id: string
  roomNumber: string
  type: "standard" | "deep" | "checkout" | "maintenance"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  assignedTo: string
  priority: "low" | "medium" | "high" | "urgent"
  scheduledTime: string
  estimatedDuration: number
  actualDuration?: number
  notes?: string
  supplies: string[]
  checklist: Array<{
    item: string
    completed: boolean
    notes?: string
  }>
  issues?: string[]
  completedAt?: string
  createdAt: string
}

interface HousekeepingSettings {
  autoAssignTasks: boolean
  cleaningSchedule: {
    standard: number // hours
    deep: number
    checkout: number
    maintenance: number
  }
  supplies: string[]
  checklist: string[]
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export default function HousekeepingDashboard() {
  const { user } = useAuth()
  const params = useParams()
  const restaurantId = params.restaurantId as string

  // State management
  const [rooms, setRooms] = useState<Room[]>([])
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [settings, setSettings] = useState<HousekeepingSettings>({
    autoAssignTasks: true,
    cleaningSchedule: {
      standard: 1,
      deep: 3,
      checkout: 2,
      maintenance: 4
    },
    supplies: ["Towels", "Soap", "Toilet Paper", "Trash Bags", "Cleaning Spray"],
    checklist: ["Bathroom", "Bed", "Floor", "Windows", "Furniture"],
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  })
  const [newTask, setNewTask] = useState<Partial<CleaningTask>>({
    roomNumber: "",
    type: "standard",
    priority: "medium",
    assignedTo: user?.name || "",
    scheduledTime: new Date().toISOString().slice(0, 16),
    estimatedDuration: 60,
    supplies: [],
    checklist: []
  })
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showTaskDetailsDialog, setShowTaskDetailsDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Check if housekeeping is supported
  const isHousekeepingSupported = user?.establishmentType === "hotel"

  // Fetch data
  useEffect(() => {
    if (restaurantId && isHousekeepingSupported) {
      fetchRooms()
      fetchTasks()
      fetchSettings()
    }
  }, [restaurantId, isHousekeepingSupported])

  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hotel/${restaurantId}/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      } else {
        setError('Failed to fetch rooms')
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setError('Failed to fetch rooms')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/housekeeping/${restaurantId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        setError('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Failed to fetch tasks')
    }
  }

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/housekeeping/${restaurantId}/settings`, {
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
  const totalRooms = rooms.length
  const cleanRooms = rooms.filter(room => room.status === "clean").length
  const dirtyRooms = rooms.filter(room => room.status === "dirty").length
  const maintenanceRooms = rooms.filter(room => room.status === "maintenance").length
  const pendingTasks = tasks.filter(task => task.status === "pending").length
  const inProgressTasks = tasks.filter(task => task.status === "in_progress").length
  const completedToday = tasks.filter(task => {
    const today = new Date().toDateString()
    return task.status === "completed" && task.completedAt && new Date(task.completedAt).toDateString() === today
  }).length

  // Handlers
  const handleAddTask = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/housekeeping/${restaurantId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setSuccess('Task created successfully')
        setShowTaskDialog(false)
        setNewTask({
          roomNumber: "",
          type: "standard",
          priority: "medium",
          assignedTo: user?.name || "",
          scheduledTime: new Date().toISOString().slice(0, 16),
          estimatedDuration: 60,
          supplies: [],
          checklist: []
        })
        fetchTasks()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      setError('Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/housekeeping/${restaurantId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setSuccess('Task status updated successfully')
        fetchTasks()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      setError('Failed to update task')
    }
  }

  const handleViewTaskDetails = (task: CleaningTask) => {
    setSelectedTask(task)
    setShowTaskDetailsDialog(true)
  }

  if (!isHousekeepingSupported) {
    return (
      <ProtectedRoute allowedRoles={["housekeeping"]}>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Housekeeping Not Supported</h2>
            <p className="text-muted-foreground">
              Housekeeping features are only available for hotels.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["housekeeping"]}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Housekeeping Dashboard</h1>
            <p className="text-muted-foreground">Manage room cleaning and maintenance tasks</p>
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
              fetchRooms()
              fetchTasks()
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
                  <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                  <p className="text-2xl font-bold">{totalRooms}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clean Rooms</p>
                  <p className="text-2xl font-bold text-green-600">{cleanRooms}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirty Rooms</p>
                  <p className="text-2xl font-bold text-red-600">{dirtyRooms}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Cleaning Tasks</h2>
              <Button onClick={() => setShowTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell className="font-medium">{task.roomNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            task.status === "completed" ? "default" :
                            task.status === "in_progress" ? "secondary" :
                            task.status === "pending" ? "outline" : "destructive"
                          }>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.assignedTo}</TableCell>
                        <TableCell>
                          <Badge variant={
                            task.priority === "urgent" ? "destructive" :
                            task.priority === "high" ? "secondary" : "outline"
                          }>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(task.scheduledTime).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewTaskDetails(task)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {task.status === "pending" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleUpdateTaskStatus(task._id, "in_progress")}
                              >
                                Start
                              </Button>
                            )}
                            {task.status === "in_progress" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleUpdateTaskStatus(task._id, "completed")}
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

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-4">
            <h2 className="text-2xl font-bold">Room Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room._id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">Room {room.number}</h3>
                      <Badge variant={
                        room.status === "clean" ? "default" :
                        room.status === "dirty" ? "destructive" :
                        room.status === "maintenance" ? "secondary" : "outline"
                      }>
                        {room.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{room.type}</p>
                    {room.lastCleaned && (
                      <p className="text-xs text-muted-foreground">
                        Last cleaned: {new Date(room.lastCleaned).toLocaleDateString()}
                      </p>
                    )}
                    {room.assignedTo && (
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {room.assignedTo}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <h2 className="text-2xl font-bold">Cleaning Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks.filter(task => {
                      const today = new Date().toDateString()
                      return new Date(task.scheduledTime).toDateString() === today
                    }).map((task) => (
                      <div key={task._id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">Room {task.roomNumber}</p>
                          <p className="text-sm text-muted-foreground">{task.type} cleaning</p>
                        </div>
                        <Badge variant={
                          task.status === "completed" ? "default" :
                          task.status === "in_progress" ? "secondary" : "outline"
                        }>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Completed Today</span>
                      <span className="font-semibold">{completedToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Progress</span>
                      <span className="font-semibold">{inProgressTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span className="font-semibold">{pendingTasks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-2xl font-bold">Housekeeping Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Cleaning Schedule</CardTitle>
                <CardDescription>Configure standard cleaning times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Standard Cleaning (hours)</Label>
                    <Input 
                      type="number" 
                      value={settings.cleaningSchedule.standard}
                      onChange={(e) => setSettings({
                        ...settings,
                        cleaningSchedule: {
                          ...settings.cleaningSchedule,
                          standard: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Deep Cleaning (hours)</Label>
                    <Input 
                      type="number" 
                      value={settings.cleaningSchedule.deep}
                      onChange={(e) => setSettings({
                        ...settings,
                        cleaningSchedule: {
                          ...settings.cleaningSchedule,
                          deep: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Task Dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Cleaning Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Number</Label>
                  <Input
                    value={newTask.roomNumber}
                    onChange={(e) => setNewTask({...newTask, roomNumber: e.target.value})}
                    placeholder="Enter room number"
                  />
                </div>
                <div>
                  <Label>Cleaning Type</Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value) => setNewTask({...newTask, type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({...newTask, priority: value as any})}
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
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newTask.estimatedDuration}
                    onChange={(e) => setNewTask({...newTask, estimatedDuration: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  value={newTask.scheduledTime}
                  onChange={(e) => setNewTask({...newTask, scheduledTime: e.target.value})}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                  placeholder="Additional notes for this task"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog open={showTaskDetailsDialog} onOpenChange={setShowTaskDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Room Number</Label>
                    <p className="text-lg font-semibold">{selectedTask.roomNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <p className="text-lg font-semibold">{selectedTask.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={
                      selectedTask.status === "completed" ? "default" :
                      selectedTask.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {selectedTask.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <Badge variant={
                      selectedTask.priority === "urgent" ? "destructive" :
                      selectedTask.priority === "high" ? "secondary" : "outline"
                    }>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </div>
                {selectedTask.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm">{selectedTask.notes}</p>
                  </div>
                )}
                {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Checklist</Label>
                    <div className="space-y-2">
                      {selectedTask.checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${item.completed ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                            {item.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Hints */}
        <AIHints 
          data={{
            rooms,
            tasks,
            settings,
            statistics: {
              totalRooms,
              cleanRooms,
              dirtyRooms,
              pendingTasks,
              completedToday
            }
          }}
        />
      </div>
    </ProtectedRoute>
  )
}
