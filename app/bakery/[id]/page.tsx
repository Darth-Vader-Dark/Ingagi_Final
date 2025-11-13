"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Star, MapPin, Phone, Mail, Clock, Cake, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Bakery {
  _id: string
  name: string
  type: string
  description: string
  location: string
  phone: string
  email: string
  rating: number
  reviewCount: number
  priceRange: string
  hours: string
  amenities: string[]
  menu: any[]
  bakery: {
    specialties: string[]
    hasCustomCakes: boolean
  }
}

export default function BakeryDetailPage() {
  const params = useParams()
  const bakeryId = params.id as string
  const [bakery, setBakery] = useState<Bakery | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [orderData, setOrderData] = useState({
    items: [] as any[],
    total: 0,
    customerName: "",
    phone: "",
    deliveryAddress: "",
    notes: ""
  })

  useEffect(() => {
    const fetchBakeryData = async () => {
      try {
        const res = await fetch(`/api/restaurant/${bakeryId}`)
        const data = await res.json()
        if (data.success) {
          setBakery(data.restaurant)
        }
      } catch (error) {
        console.error("Error fetching bakery data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (bakeryId) {
      fetchBakeryData()
    }
  }, [bakeryId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bakery details...</p>
        </div>
      </div>
    )
  }

  if (!bakery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bakery Not Found</h1>
          <p className="text-gray-600 mb-6">The bakery you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
      </div>
      
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-yellow-600 to-yellow-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Cake className="h-6 w-6" />
              <h1 className="text-4xl font-bold">{bakery.name}</h1>
            </div>
            <p className="text-xl text-gray-200 mb-4">{bakery.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{bakery.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{bakery.rating} ({bakery.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{bakery.hours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="menu">Products</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {bakery.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{bakery.description}</p>
                    
                    {/* Bakery Specialties */}
                    {bakery.bakery.specialties && bakery.bakery.specialties.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🥖 Bakery Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {bakery.bakery.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bakery Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">🏪 Bakery Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bakery.bakery.hasCustomCakes && (
                          <div className="flex items-center gap-2 p-3 border rounded-lg bg-pink-50">
                            <Cake className="h-4 w-4 text-pink-600" />
                            <span className="text-sm">Custom Cakes Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="menu" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bakery Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bakery.menu && bakery.menu.length > 0 ? (
                      <div className="space-y-4">
                        {bakery.menu.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <p className="text-sm font-medium text-primary">RWF {item.price}</p>
                            </div>
                            {item.image && (
                              <div className="ml-4">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Products coming soon...</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <span>{bakery.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{bakery.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{bakery.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{bakery.hours}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Products</CardTitle>
                <CardDescription>Place your order from {bakery.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => setShowOrderDialog(true)}
                >
                  <Cake className="h-4 w-4 mr-2" />
                  Order Now
                </Button>
                <div className="text-sm text-gray-600">
                  <p>⭐ {bakery.rating} rating from {bakery.reviewCount} reviews</p>
                  <p>📍 {bakery.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Bakery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{bakery.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span>{bakery.priceRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span>{bakery.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Custom Cakes</span>
                  <span>{bakery.bakery.hasCustomCakes ? "Available" : "Not Available"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Products</DialogTitle>
            <DialogDescription>
              Place your order from {bakery.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                value={orderData.customerName}
                onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={orderData.phone}
                onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                placeholder="Your phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Delivery Address</label>
              <Textarea
                value={orderData.deliveryAddress}
                onChange={(e) => setOrderData({...orderData, deliveryAddress: e.target.value})}
                placeholder="Your delivery address"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Order Notes</label>
              <Textarea
                value={orderData.notes}
                onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                placeholder="Special instructions for your order..."
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => {
                  // Handle order submission
                  alert("Order placed! We'll contact you soon.")
                  setShowOrderDialog(false)
                }}
              >
                Place Order
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowOrderDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
