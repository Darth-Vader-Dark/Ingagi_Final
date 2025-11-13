"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Edit, Save, X, AlertTriangle, CheckCircle } from "lucide-react"

interface Establishment {
  _id: string
  name: string
  type: string
  isApproved: boolean
  description: string
  createdAt: string
  hotel?: any
  restaurant?: any
  location?: string
  phone?: string
  email?: string
}

export default function DebugEstablishmentsPage() {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Establishment>>({})
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchEstablishments()
  }, [])

  const fetchEstablishments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/establishments')
      if (response.ok) {
        const data = await response.json()
        setEstablishments(data.establishments || [])
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch establishments' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching establishments' })
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (establishment: Establishment) => {
    setEditingId(establishment._id)
    setEditData({
      name: establishment.name,
      type: establishment.type,
      description: establishment.description,
      location: establishment.location,
      phone: establishment.phone,
      email: establishment.email
    })
    setShowEditDialog(true)
  }

  const saveChanges = async () => {
    if (!editingId) return
    
    try {
      setSaving(true)
      const response = await fetch(`/api/restaurant/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Establishment updated successfully' })
        setShowEditDialog(false)
        setEditingId(null)
        setEditData({})
        fetchEstablishments()
      } else {
        setMessage({ type: 'error', text: 'Failed to update establishment' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating establishment' })
    } finally {
      setSaving(false)
    }
  }

  const getTypeIcon = (type: string, hotel?: any, restaurant?: any) => {
    if (type === "hotel" || hotel) return "🏨"
    if (type === "restaurant" || restaurant) return "🍽️"
    if (type === "cafe") return "☕"
    if (type === "bakery") return "🥖"
    if (type === "bar") return "🍺"
    return "❓"
  }

  const getTypeColor = (type: string, hotel?: any, restaurant?: any) => {
    if (type === "hotel" || hotel) return "bg-blue-100 text-blue-800"
    if (type === "restaurant" || restaurant) return "bg-green-100 text-green-800"
    if (type === "cafe") return "bg-orange-100 text-orange-800"
    if (type === "bakery") return "bg-yellow-100 text-yellow-800"
    if (type === "bar") return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  const getDisplayType = (establishment: Establishment) => {
    const { type, hotel, restaurant } = establishment
    
    // If it has hotel data, it's a hotel
    if (hotel && Object.keys(hotel).length > 0) return "Hotel"
    
    // If it has restaurant data, it's a restaurant
    if (restaurant && Object.keys(restaurant).length > 0) return "Restaurant"
    
    // Use the type field
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getIssues = (establishment: Establishment) => {
    const issues = []
    const { type, hotel, restaurant, name } = establishment
    
    // Check for type mismatches
    if (type === "restaurant" && hotel && Object.keys(hotel).length > 0) {
      issues.push("Type says 'restaurant' but has hotel data")
    }
    
    if (type === "hotel" && restaurant && Object.keys(restaurant).length > 0) {
      issues.push("Type says 'hotel' but has restaurant data")
    }
    
    // Check for missing type data
    if (type === "restaurant" && (!restaurant || Object.keys(restaurant).length === 0)) {
      issues.push("Type is 'restaurant' but no restaurant data")
    }
    
    if (type === "hotel" && (!hotel || Object.keys(hotel).length === 0)) {
      issues.push("Type is 'hotel' but no hotel data")
    }
    
    // Check for name-based detection
    if (name.toLowerCase().includes("hotel") && type !== "hotel") {
      issues.push("Name contains 'hotel' but type is not 'hotel'")
    }
    
    return issues
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading establishments...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Establishments Debug</h1>
            <p className="text-muted-foreground">Debug and fix establishment type issues</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/fix-hotels', { method: 'POST' })
                  if (response.ok) {
                    const data = await response.json()
                    setMessage({ type: 'success', text: data.message })
                    fetchEstablishments()
                  } else {
                    setMessage({ type: 'error', text: 'Failed to fix hotels' })
                  }
                } catch (error) {
                  setMessage({ type: 'error', text: 'Error fixing hotels' })
                }
              }}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Auto-Fix All Types
            </Button>
            <Button onClick={fetchEstablishments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {establishments.map((establishment) => {
            const issues = getIssues(establishment)
            const displayType = getDisplayType(establishment)
            
            return (
              <Card key={establishment._id} className={issues.length > 0 ? "border-orange-200 bg-orange-50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTypeIcon(establishment.type, establishment.hotel, establishment.restaurant)}</span>
                      <div>
                        <CardTitle className="text-lg">{establishment.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getTypeColor(establishment.type, establishment.hotel, establishment.restaurant)}>
                              {displayType}
                            </Badge>
                            <Badge variant={establishment.isApproved ? "default" : "secondary"}>
                              {establishment.isApproved ? "Approved" : "Pending"}
                            </Badge>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => startEdit(establishment)} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Database Type:</strong> {establishment.type}
                      </div>
                      <div>
                        <strong>Display Type:</strong> {displayType}
                      </div>
                      <div>
                        <strong>Location:</strong> {establishment.location || "Not set"}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(establishment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {establishment.description && (
                      <div className="text-sm">
                        <strong>Description:</strong> {establishment.description}
                      </div>
                    )}
                    
                    {establishment.hotel && Object.keys(establishment.hotel).length > 0 && (
                      <div className="text-sm">
                        <strong>Hotel Data:</strong> 
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(establishment.hotel, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {establishment.restaurant && Object.keys(establishment.restaurant).length > 0 && (
                      <div className="text-sm">
                        <strong>Restaurant Data:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(establishment.restaurant, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {issues.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <strong className="text-orange-800">Issues Found:</strong>
                        </div>
                        <ul className="text-sm text-orange-700 space-y-1">
                          {issues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {establishments.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No establishments found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Establishment</DialogTitle>
            <DialogDescription>
              Update the establishment information to fix type issues
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editData.name || ""}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Establishment name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={editData.type || ""} onValueChange={(value) => setEditData({ ...editData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="bakery">Bakery</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Establishment description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={editData.location || ""}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  placeholder="Location"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
