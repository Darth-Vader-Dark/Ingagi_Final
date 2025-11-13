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
import { Star, MapPin, Phone, Mail, Clock, Wine, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Bar {
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
  bar: {
    drinkTypes: string[]
    happyHour: boolean
  }
}

export default function BarDetailPage() {
  const params = useParams()
  const barId = params.id as string
  const [bar, setBar] = useState<Bar | null>(null)
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
    const fetchBarData = async () => {
      try {
        const res = await fetch(`/api/attached-establishments/${barId}`)
        const data = await res.json()
        if (data.success) {
          setBar(data.bar)
        }
      } catch (error) {
        console.error("Error fetching bar data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (barId) {
      fetchBarData()
    }
  }, [barId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bar details...</p>
        </div>
      </div>
    )
  }

  if (!bar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bar Not Found</h1>
          <p className="text-gray-600 mb-6">The bar you're looking for doesn't exist or has been removed.</p>
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
      <div className="relative h-96 bg-gradient-to-r from-purple-600 to-purple-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Wine className="h-6 w-6" />
              <h1 className="text-4xl font-bold">{bar.name}</h1>
            </div>
            <p className="text-xl text-gray-200 mb-4">{bar.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{bar.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{bar.rating} ({bar.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{bar.hours}</span>
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
                <TabsTrigger value="menu">Drinks Menu</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {bar.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{bar.description}</p>
                    
                    {/* Drink Types */}
                    {bar.bar.drinkTypes && bar.bar.drinkTypes.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🍺 Drink Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {bar.bar.drinkTypes.map((drink, index) => (
                            <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                              {drink}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bar Features */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">🍻 Bar Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bar.bar.happyHour && (
                          <div className="flex items-center gap-2 p-3 border rounded-lg bg-yellow-50">
                            <Wine className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">Happy Hour Available</span>
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
                    <CardTitle>Drinks Menu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bar.menu && bar.menu.length > 0 ? (
                      <div className="space-y-4">
                        {bar.menu.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <p className="text-sm font-medium text-primary">RWF {item.price}</p>
                            </div>
                            <div className="flex items-center gap-3">
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
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setOrderData({
                                    ...orderData,
                                    items: [...orderData.items, {
                                      name: item.name,
                                      price: item.price,
                                      quantity: 1
                                    }],
                                    total: orderData.total + item.price
                                  })
                                  setShowOrderDialog(true)
                                }}
                              >
                                Order Now
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Drinks menu coming soon...</p>
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
                      <span>{bar.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{bar.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{bar.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{bar.hours}</span>
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
                <CardTitle>Order Drinks</CardTitle>
                <CardDescription>Place your order from {bar.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => setShowOrderDialog(true)}
                >
                  <Wine className="h-4 w-4 mr-2" />
                  Order Now
                </Button>
                <div className="text-sm text-gray-600">
                  <p>⭐ {bar.rating} rating from {bar.reviewCount} reviews</p>
                  <p>📍 {bar.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Bar Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{bar.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span>{bar.priceRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span>{bar.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Happy Hour</span>
                  <span>{bar.bar.happyHour ? "Available" : "Not Available"}</span>
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
            <DialogTitle>Order Drinks</DialogTitle>
            <DialogDescription>
              Place your order from {bar.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Order Items */}
            {orderData.items.length > 0 && (
              <div>
                <label className="text-sm font-medium">Order Items</label>
                <div className="space-y-2 mt-2">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{item.name} x {item.quantity}</span>
                      <span className="text-sm font-medium">RWF {item.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-2 bg-primary/10 rounded font-medium">
                    <span>Total</span>
                    <span>RWF {orderData.total}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setOrderData({...orderData, items: [], total: 0})}
                    className="w-full mt-2"
                  >
                    Clear Order
                  </Button>
                </div>
              </div>
            )}
            
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
                  const orderSummary = orderData.items.map(item => `${item.name} x ${item.quantity}`).join(', ')
                  alert(`Order placed successfully!\n\nItems: ${orderSummary}\nTotal: RWF ${orderData.total}\n\nWe'll contact you soon for delivery.`)
                  setShowOrderDialog(false)
                  // Reset order data
                  setOrderData({
                    items: [],
                    total: 0,
                    customerName: "",
                    phone: "",
                    deliveryAddress: "",
                    notes: ""
                  })
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
