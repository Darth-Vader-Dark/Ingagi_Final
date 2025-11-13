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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Star, MapPin, Phone, Mail, Clock, Wifi, Car, CreditCard, Utensils, Coffee, Cake, Wine, Users, Calendar, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Restaurant {
  _id: string
  name: string
  type: string
  description: string
  location: string
  phone: string
  email: string
  logo?: string
  banner?: string
  rating: number
  reviewCount: number
  priceRange: string
  hours: string
  amenities: string[]
  menu: any[]
  promotions: any[]
  hotel?: {
    starRating: number
    roomTypes: string[]
    amenities: string[]
    services: string[]
    rooms: any[]
  }
  cafe?: {
    coffeeTypes: string[]
    wifi: boolean
    outdoorSeating: boolean
  }
  bakery?: {
    specialties: string[]
    hasCustomCakes: boolean
  }
  bar?: {
    drinkTypes: string[]
    happyHour: boolean
  }
}

interface AttachedEstablishment {
  _id: string
  name: string
  type: string
  description: string
  menu: any[]
  isAttached: boolean
  hotelName: string
}

export default function RestaurantDetailPage() {
  const params = useParams()
  const restaurantId = params.id as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [attachedEstablishments, setAttachedEstablishments] = useState<AttachedEstablishment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    guests: 1,
    name: "",
    phone: "",
    email: "",
    specialRequests: ""
  })
  const [orderData, setOrderData] = useState({
    items: [] as any[],
    total: 0,
    customerName: "",
    phone: "",
    deliveryAddress: "",
    notes: ""
  })
  const [cart, setCart] = useState<Array<{item: any, quantity: number}>>([])

  // Cart functions
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item._id === item._id)
      if (existing) {
        return prev.map(cartItem => 
          cartItem.item._id === item._id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prev, { item, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.item._id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(prev => prev.map(cartItem => 
        cartItem.item._id === itemId 
          ? { ...cartItem, quantity }
          : cartItem
      ))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Please add items to your cart first!")
      return
    }

    if (!orderData.customerName || !orderData.phone) {
      alert("Please fill in your name and phone number!")
      return
    }

    try {
      const orderPayload = {
        restaurantId: restaurantId,
        customerName: orderData.customerName,
        phone: orderData.phone,
        deliveryAddress: orderData.deliveryAddress,
        notes: orderData.notes,
        items: cart.map(cartItem => ({
          itemId: cartItem.item._id,
          name: cartItem.item.name,
          price: cartItem.item.price,
          quantity: cartItem.quantity
        })),
        total: getCartTotal(),
        status: "pending",
        createdAt: new Date()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      })

      if (response.ok) {
        alert("Order placed successfully! We'll contact you soon.")
        setCart([])
        setOrderData({
          items: [],
          total: 0,
          customerName: "",
          phone: "",
          deliveryAddress: "",
          notes: ""
        })
        setShowOrderDialog(false)
      } else {
        alert("Failed to place order. Please try again.")
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert("Failed to place order. Please try again.")
    }
  }

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        // Fetch main restaurant data
        const res = await fetch(`/api/restaurant/${restaurantId}`, {
          headers: {
            'x-public-access': 'true'
          }
        })
        const data = await res.json()
        if (data.success) {
          console.log('Public page - Restaurant data received:', data.restaurant)
          console.log('Public page - Amenities received:', data.restaurant?.amenities)
          console.log('Public page - Menu received:', data.restaurant?.menu)
          console.log('Public page - Menu length:', data.restaurant?.menu?.length)
          setRestaurant(data.restaurant)
        }

        // Fetch attached establishments if it's a hotel
        if (data.restaurant?.type === "hotel" || data.restaurant?.name?.toLowerCase().includes("hotel")) {
          const attachedRes = await fetch(`/api/hotel/${restaurantId}/attached-establishments`)
          const attachedData = await attachedRes.json()
          if (attachedData.success) {
            setAttachedEstablishments(attachedData.establishments || [])
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      fetchRestaurantData()
    }
  }, [restaurantId])

  const isHotel = restaurant?.type === "hotel" || restaurant?.name?.toLowerCase().includes("hotel") || restaurant?.hotel
  const isCafe = restaurant?.type === "cafe" || restaurant?.name?.toLowerCase().includes("cafe") || restaurant?.cafe
  const isBakery = restaurant?.type === "bakery" || restaurant?.name?.toLowerCase().includes("bakery") || restaurant?.bakery
  const isBar = restaurant?.type === "bar" || restaurant?.name?.toLowerCase().includes("bar") || restaurant?.bar

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant details...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
          <p className="text-gray-600 mb-6">The restaurant you're looking for doesn't exist or has been removed.</p>
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
      
      {/* Hero Section with Banner Image */}
      <div className="relative h-96">
        {restaurant.banner && restaurant.banner !== "/placeholder.svg" ? (
          <Image
            src={restaurant.banner}
            alt={`${restaurant.name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full bg-gradient-to-r from-primary to-primary/80"></div>
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">{restaurant.name}</h1>
              {isHotel && restaurant.hotel?.starRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold">{restaurant.hotel.starRating}</span>
                </div>
              )}
            </div>
            <p className="text-xl text-gray-200 mb-4">{restaurant.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{restaurant.rating} ({restaurant.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{restaurant.hours}</span>
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {restaurant.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
                    
                    {/* Hotel-specific information */}
                    {isHotel && restaurant.hotel && (
                      <div className="mt-6 space-y-4">
                        {restaurant.hotel.roomTypes && restaurant.hotel.roomTypes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">🏨 Room Types</h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.hotel.roomTypes.map((roomType, index) => (
                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                  {roomType}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {restaurant.hotel.amenities && restaurant.hotel.amenities.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">🛎️ Hotel Amenities</h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.hotel.amenities.map((amenity, index) => (
                                <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {restaurant.hotel.services && restaurant.hotel.services.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">🏢 Hotel Services</h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.hotel.services.map((service, index) => (
                                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cafe-specific information */}
                    {isCafe && restaurant.cafe && (
                      <div className="mt-6 space-y-4">
                        {restaurant.cafe.coffeeTypes && restaurant.cafe.coffeeTypes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">☕ Coffee Types</h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.cafe.coffeeTypes.map((coffee, index) => (
                                <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800">
                                  {coffee}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4">
                          {restaurant.cafe.wifi && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Wifi className="h-4 w-4" />
                              <span>Free WiFi</span>
                            </div>
                          )}
                          {restaurant.cafe.outdoorSeating && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Utensils className="h-4 w-4" />
                              <span>Outdoor Seating</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bakery-specific information */}
                    {isBakery && restaurant.bakery && (
                      <div className="mt-6 space-y-4">
                        {restaurant.bakery.specialties && restaurant.bakery.specialties.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">🥖 Bakery Specialties</h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.bakery.specialties.map((specialty, index) => (
                                <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {restaurant.bakery.hasCustomCakes && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Cake className="h-4 w-4" />
                            <span>Custom Cakes Available</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bar-specific information */}
                    {isBar && restaurant.bar && (
                      <div className="mt-6 space-y-4">
                        {restaurant.bar.drinkTypes && restaurant.bar.drinkTypes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">🍺 Drink Types</h4>
                            <div className="flex flex-wrap gap-2">
                              {restaurant.bar.drinkTypes.map((drink, index) => (
                                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                  {drink}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {restaurant.bar.happyHour && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Wine className="h-4 w-4" />
                            <span>Happy Hour Available</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Attached Establishments */}
                {isHotel && attachedEstablishments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>🏢 Hotel Outlets</CardTitle>
                      <CardDescription>Additional services available at this hotel</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attachedEstablishments.map((establishment) => (
                          <Card key={establishment._id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {establishment.type === "restaurant" && <Utensils className="h-4 w-4 text-primary" />}
                                {establishment.type === "cafe" && <Coffee className="h-4 w-4 text-primary" />}
                                {establishment.type === "bakery" && <Cake className="h-4 w-4 text-primary" />}
                                {establishment.type === "bar" && <Wine className="h-4 w-4 text-primary" />}
                                <h4 className="font-semibold">{establishment.name}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{establishment.description}</p>
                              <Button variant="outline" size="sm" className="w-full">
                                View {establishment.type === "restaurant" ? "Menu" : 
                                      establishment.type === "cafe" ? "Coffee Menu" :
                                      establishment.type === "bakery" ? "Products" :
                                      "Drinks Menu"}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="menu" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isHotel ? "Hotel Restaurant Menu" : 
                       isCafe ? "Coffee & Food Menu" :
                       isBakery ? "Bakery Products" :
                       isBar ? "Drinks Menu" : "Menu"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {restaurant.menu && restaurant.menu.length > 0 ? (
                      <div className="space-y-4">
                        {restaurant.menu.map((item, index) => {
                          const cartItem = cart.find(cartItem => cartItem.item._id === item._id)
                          const quantity = cartItem ? cartItem.quantity : 0
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  {item.image && (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      width={60}
                                      height={60}
                                      className="rounded-lg object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-sm text-gray-600">{item.description}</p>
                                    <p className="text-sm font-medium text-primary">RWF {item.price.toLocaleString()}</p>
                                    {!item.isAvailable && (
                                      <p className="text-xs text-red-500">Currently unavailable</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4 flex items-center gap-2">
                                {quantity > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateQuantity(item._id, quantity - 1)}
                                    >
                                      -
                                    </Button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateQuantity(item._id, quantity + 1)}
                                      disabled={!item.isAvailable}
                                    >
                                      +
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => removeFromCart(item._id)}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                    disabled={!item.isAvailable}
                                  >
                                    {!item.isAvailable ? "Unavailable" : "Add to Cart"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* Cart Summary */}
                        {cart.length > 0 && (
                          <div className="mt-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                  <Utensils className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">Your Order</h3>
                                  <p className="text-sm text-gray-600">{cart.length} item{cart.length !== 1 ? 's' : ''} selected</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => setShowOrderDialog(true)}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
                              >
                                <Utensils className="h-4 w-4 mr-2" />
                                Checkout
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              {cart.map((cartItem, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-primary/10">
                                  <div className="flex items-center gap-3">
                                    {cartItem.item.image && (
                                      <Image
                                        src={cartItem.item.image}
                                        alt={cartItem.item.name}
                                        width={40}
                                        height={40}
                                        className="rounded-lg object-cover"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">{cartItem.item.name}</p>
                                      <p className="text-xs text-gray-600">RWF {cartItem.item.price.toLocaleString()} each</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">× {cartItem.quantity}</span>
                                    <span className="font-semibold text-primary">RWF {(cartItem.item.price * cartItem.quantity).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="border-t border-primary/20 pt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-bold">Total:</span>
                                  <span className="text-xl font-bold text-primary">RWF {getCartTotal().toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Click Checkout to complete your order</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Menu coming soon...</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Services & Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {restaurant.amenities && restaurant.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {restaurant.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No amenities listed yet.</p>
                        <p className="text-xs mt-2">Debug: {JSON.stringify(restaurant.amenities)}</p>
                      </div>
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
                      <span>{restaurant.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{restaurant.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{restaurant.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{restaurant.hours}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Book or Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isHotel ? (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowBookingDialog(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book a Room
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowOrderDialog(true)}
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Order Food
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowOrderDialog(true)}
                  >
                    <Utensils className="h-4 w-4 mr-2" />
                    {isCafe ? "Order Coffee" : isBakery ? "Order Products" : isBar ? "Order Drinks" : "Order Now"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{restaurant.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span>{restaurant.priceRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span>{restaurant.reviewCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book a Room</DialogTitle>
            <DialogDescription>
              Fill in your details to book a room at {restaurant.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Check-in Date</label>
                <Input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Check-in Time</label>
                <Input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Number of Guests</label>
              <Select value={bookingData.guests.toString()} onValueChange={(value) => setBookingData({...bookingData, guests: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Guest' : 'Guests'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={bookingData.name}
                onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={bookingData.phone}
                onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                placeholder="Your phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={bookingData.email}
                onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Special Requests</label>
              <Textarea
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                placeholder="Any special requests or requirements..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => {
                  // Handle booking submission
                  alert("Booking request submitted! We'll contact you soon.")
                  setShowBookingDialog(false)
                }}
              >
                Submit Booking
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBookingDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              {isCafe ? "Order Coffee" : isBakery ? "Order Products" : isBar ? "Order Drinks" : "Checkout"}
            </DialogTitle>
            <DialogDescription>
              Review your order and provide delivery information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Order Summary
              </h3>
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((cartItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        {cartItem.item.image && (
                          <Image
                            src={cartItem.item.image}
                            alt={cartItem.item.name}
                            width={50}
                            height={50}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{cartItem.item.name}</p>
                          <p className="text-sm text-gray-600">RWF {cartItem.item.price.toLocaleString()} each</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(cartItem.item._id, cartItem.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(cartItem.item._id, cartItem.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">RWF {(cartItem.item.price * cartItem.quantity).toLocaleString()}</p>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(cartItem.item._id)}
                            className="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">RWF {getCartTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Your cart is empty</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowOrderDialog(false)}
                    className="mt-2"
                  >
                    Continue Shopping
                  </Button>
                </div>
              )}
            </div>

            {/* Customer Information */}
            {cart.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Delivery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input
                      value={orderData.customerName}
                      onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
                      placeholder="Your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input
                      value={orderData.phone}
                      onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                      placeholder="Your phone number"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Address</label>
                  <Textarea
                    value={orderData.deliveryAddress}
                    onChange={(e) => setOrderData({...orderData, deliveryAddress: e.target.value})}
                    placeholder="Your delivery address"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Special Instructions</label>
                  <Textarea
                    value={orderData.notes}
                    onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                    placeholder="Any special instructions for your order..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {cart.length > 0 && (
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0}
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  Place Order - RWF {getCartTotal().toLocaleString()}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowOrderDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
