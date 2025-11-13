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
import { Star, MapPin, Phone, Mail, Clock, Wifi, Utensils, Coffee, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Cafe {
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
  cafe: {
    coffeeTypes: string[]
    foodService: boolean
    wifi: boolean
    outdoorSeating: boolean
  }
}

export default function CafeDetailPage() {
  const params = useParams()
  const cafeId = params.id as string
  const [cafe, setCafe] = useState<Cafe | null>(null)
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
    const fetchCafeData = async () => {
      try {
        const res = await fetch(`/api/restaurant/${cafeId}`)
        const data = await res.json()
        if (data.success) {
          setCafe(data.restaurant)
        }
      } catch (error) {
        console.error("Error fetching cafe data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (cafeId) {
      fetchCafeData()
    }
  }, [cafeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cafe details...</p>
        </div>
      </div>
    )
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cafe Not Found</h1>
          <p className="text-gray-600 mb-6">The cafe you're looking for doesn't exist or has been removed.</p>
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
      <div className="relative h-96 bg-gradient-to-r from-amber-600 to-amber-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="h-6 w-6" />
              <h1 className="text-4xl font-bold">{cafe.name}</h1>
            </div>
            <p className="text-xl text-gray-200 mb-4">{cafe.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{cafe.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{cafe.rating} ({cafe.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{cafe.hours}</span>
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
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {cafe.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{cafe.description}</p>
                    
                    {/* Coffee Types */}
                    {cafe.cafe.coffeeTypes && cafe.cafe.coffeeTypes.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">☕ Coffee Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {cafe.cafe.coffeeTypes.map((coffee, index) => (
                            <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800">
                              {coffee}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cafe Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">🏪 Cafe Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cafe.cafe.wifi && (
                          <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50">
                            <Wifi className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Free WiFi</span>
                          </div>
                        )}
                        {cafe.cafe.outdoorSeating && (
                          <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
                            <Utensils className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Outdoor Seating</span>
                          </div>
                        )}
                        {cafe.cafe.foodService && (
                          <div className="flex items-center gap-2 p-3 border rounded-lg bg-orange-50">
                            <Utensils className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">Food Service</span>
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
                    <CardTitle>Coffee & Food Menu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cafe.menu && cafe.menu.length > 0 ? (
                      <div className="space-y-4">
                        {cafe.menu.map((item, index) => (
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
                      <p className="text-gray-500 text-center py-8">Menu coming soon...</p>
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
                      <span>{cafe.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{cafe.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{cafe.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{cafe.hours}</span>
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
                <CardTitle>Order Coffee</CardTitle>
                <CardDescription>Place your order from {cafe.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => setShowOrderDialog(true)}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Order Now
                </Button>
                <div className="text-sm text-gray-600">
                  <p>⭐ {cafe.rating} rating from {cafe.reviewCount} reviews</p>
                  <p>📍 {cafe.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Cafe Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{cafe.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span>{cafe.priceRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span>{cafe.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WiFi</span>
                  <span>{cafe.cafe.wifi ? "Available" : "Not Available"}</span>
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
            <DialogTitle>Order Coffee</DialogTitle>
            <DialogDescription>
              Place your order from {cafe.name}
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
