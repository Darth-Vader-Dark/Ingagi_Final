"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, Smartphone, CreditCard, Bot, Star, Check } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Restaurant {
  _id: string
  name: string
  type: string
  cuisine?: string
  rating?: number
  description?: string
  location?: string
  logo?: string
  isPremium?: boolean
  priceRange?: string
  hours?: string
  contact?: {
    address?: string
  }
  isAttached?: boolean
  hotelName?: string
  hotelId?: string
  hotel?: any
  restaurant?: any
}

interface PlatformStats {
  totalEstablishments: number
  premiumEstablishments: number
  totalUsers: number
  totalOrders: number
}

export default function HomePage() {
  const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [hotelOutlets, setHotelOutlets] = useState<{[hotelId: string]: Restaurant[]}>({})
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalEstablishments: 0,
    premiumEstablishments: 0,
    totalUsers: 0,
    totalOrders: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured establishments
        const restaurantsResponse = await fetch('/api/restaurants/featured')
        let restaurants = []
        if (restaurantsResponse.ok) {
          const data = await restaurantsResponse.json()
          console.log('Featured restaurants response:', data)
          restaurants = data.restaurants || []
        } else {
          console.error('Featured restaurants response not ok:', restaurantsResponse.status)
        }

        // Fetch attached establishments with images
        const attachedResponse = await fetch('/api/attached-establishments/menu')
        let attachedEstablishments = []
        if (attachedResponse.ok) {
          const attachedData = await attachedResponse.json()
          console.log('Attached establishments response:', attachedData)
          attachedEstablishments = attachedData.establishments || []
        } else {
          console.error('Attached establishments response not ok:', attachedResponse.status)
        }

        // Combine both types of establishments
        const allEstablishments = [...restaurants, ...attachedEstablishments]
        console.log('All establishments:', allEstablishments.map(est => ({ 
          name: est.name, 
          type: est.type, 
          isAttached: est.isAttached,
          hotelId: est.hotelId,
          description: est.description,
          location: est.location,
          hotel: est.hotel,
          restaurant: est.restaurant
        })))
        // Filter out attached establishments from main list
        const mainEstablishments = allEstablishments.filter(est => !est.isAttached)
        setFeaturedRestaurants(mainEstablishments)

        // Fetch outlets for each hotel
        const hotels = allEstablishments.filter(est => {
          const name = est.name?.toLowerCase() || "";
          const description = est.description?.toLowerCase() || "";
          return est.type === "hotel" || 
                 est.type === "hotel_manager" ||
                 name.includes("hotel") ||
                 description.includes("hotel") ||
                 (est.hotel && Object.keys(est.hotel).length > 0);
        })

        const outletsMap: {[hotelId: string]: Restaurant[]} = {}
        
        for (const hotel of hotels) {
          try {
            const outletsRes = await fetch(`/api/hotel/${hotel._id}/attached-establishments`)
            if (outletsRes.ok) {
              const outletsData = await outletsRes.json()
              if (outletsData.success) {
                outletsMap[hotel._id] = outletsData.establishments || []
                console.log(`Outlets for ${hotel.name}:`, outletsData.establishments)
              }
            }
          } catch (e) {
            console.error(`Error fetching outlets for ${hotel.name}:`, e)
          }
        }
        
        setHotelOutlets(outletsMap)

        // Fetch platform stats
        const statsResponse = await fetch('/api/stats/platform')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setPlatformStats(statsData.stats || {})
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">I</span>
              </div>
              <span className="text-xl font-bold text-foreground">Ingagi</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#restaurants" className="text-muted-foreground hover:text-foreground transition-colors">
                Restaurants
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  The Future of Smart Dining
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Ingagi – The Future of Smart Dining & Hospitality in Rwanda
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Revolutionary ERP + POS system that digitizes restaurants and hotels with QR menus, mobile payments,
                  and IoT integration.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/restaurants">
                  <Button size="lg" className="text-lg px-8">
                    Browse Restaurants & Hotels
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                    Sign up your establishment
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-card rounded-xl border border-border overflow-hidden">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Ingagi Platform Demo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Ingagi by the Numbers
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of restaurants and customers already using our platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {loading ? "..." : platformStats.totalEstablishments || 0}
              </div>
              <p className="text-muted-foreground">Approved Establishments</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {loading ? "..." : platformStats.premiumEstablishments || 0}
              </div>
              <p className="text-muted-foreground">Premium Establishments</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {loading ? "..." : platformStats.totalUsers || 0}
              </div>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {loading ? "..." : platformStats.totalOrders || 0}
              </div>
              <p className="text-muted-foreground">Total Orders</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Revolutionizing Rwanda's Hospitality Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ingagi is a comprehensive platform where restaurants, cafes, and hotels can create digital presences, manage
              operations, and serve customers with cutting-edge technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>QR Menu System</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Customers scan QR codes to instantly browse menus, place orders, and pay through mobile money.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mobile Money Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Seamless payments through MTN Mobile Money and Airtel Money for convenient transactions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Robot Waiter Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  IoT-ready platform with optional robot waiter integration for automated order delivery.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Preview */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Choose Your Growth Path</h2>
            <p className="text-xl text-muted-foreground">Start free with Core, scale with Pro, or go enterprise with NeuralSuite</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center p-6 border-2 border-blue-200 bg-white">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-bold mb-2">Ingagi ERP Core</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">Free</p>
              <p className="text-sm text-muted-foreground mb-4">Perfect for small businesses starting their digital journey</p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Up to 5 employees
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Basic menu management
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  QR code generation
                </li>
              </ul>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">Learn More</Button>
              </Link>
            </Card>

            <Card className="text-center p-6 border-2 border-purple-200 bg-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">Most Popular</Badge>
              </div>
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-2">Ingagi Pro</h3>
              <p className="text-3xl font-bold text-purple-600 mb-2">RWF 25K/mo</p>
              <p className="text-sm text-muted-foreground mb-4">Advanced features for growing businesses</p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Up to 20 employees
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  AI-powered insights
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Advanced analytics
                </li>
              </ul>
              <Link href="/pricing">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Start Pro Trial</Button>
              </Link>
            </Card>

            <Card className="text-center p-6 border-2 border-pink-200 bg-white">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Ingagi Enterprise</h3>
              <p className="text-3xl font-bold text-pink-600 mb-2">RWF 100K/mo</p>
              <p className="text-sm text-muted-foreground mb-4">Full enterprise solution with AI/ML capabilities</p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Unlimited everything
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  White-label solutions
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  NeuralSuite AI
                </li>
              </ul>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Full Pricing & Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section id="restaurants" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Approved Establishments</h2>
            <p className="text-xl text-muted-foreground">Quality-assured restaurants, cafes, hotels, and attached establishments on the Ingagi platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse"></div>
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-9 bg-muted rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))
            ) : featuredRestaurants.length > 0 ? (
              // Real restaurant data
              featuredRestaurants.map((restaurant, index) => (
                <Card key={restaurant._id || index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted">
                    {restaurant.logo ? (
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl font-bold text-muted-foreground">🍽️</span>
                          </div>
                          <p className="text-sm">No Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {(() => {
                                // If it's an attached establishment, use its type
                                if (restaurant.isAttached) {
                                  if (restaurant.type === "restaurant") return "🍽️ Restaurant";
                                  if (restaurant.type === "cafe") return "☕ Cafe";
                                  if (restaurant.type === "bakery") return "🥖 Bakery";
                                  if (restaurant.type === "bar") return "🍺 Bar";
                                  return "🍽️ Restaurant";
                                }
                                
                                // For main establishments, use comprehensive detection
                                const name = restaurant.name?.toLowerCase() || "";
                                const description = restaurant.description?.toLowerCase() || "";
                                
                                // Check for hotel indicators
                                const isHotel = restaurant.type === "hotel" || 
                                              restaurant.type === "hotel_manager" ||
                                              name.includes("hotel") ||
                                              description.includes("hotel") ||
                                              (restaurant.hotel && Object.keys(restaurant.hotel).length > 0);
                                
                                // Check for cafe indicators
                                const isCafe = restaurant.type === "cafe" ||
                                             name.includes("cafe") ||
                                             name.includes("coffee") ||
                                             description.includes("cafe") ||
                                             description.includes("coffee");
                                
                                // Check for bakery indicators
                                const isBakery = restaurant.type === "bakery" ||
                                               name.includes("bakery") ||
                                               name.includes("bake") ||
                                               description.includes("bakery") ||
                                               description.includes("bake");
                                
                                // Check for bar indicators
                                const isBar = restaurant.type === "bar" ||
                                            name.includes("bar") ||
                                            name.includes("pub") ||
                                            description.includes("bar") ||
                                            description.includes("pub");
                                
                                // Return detected type
                                if (isHotel) return "🏨 Hotel";
                                if (isCafe) return "☕ Cafe";
                                if (isBakery) return "🥖 Bakery";
                                if (isBar) return "🍺 Bar";
                                if (restaurant.type === "restaurant") return "🍽️ Restaurant";
                                
                                // Default fallback
                                return "🏨 Hotel";
                              })()}
                            </Badge>
                            {restaurant.isAttached && (
                              <Badge variant="secondary" className="text-xs">
                                🏨 {restaurant.hotelName}
                              </Badge>
                            )}
                            {restaurant.cuisine && restaurant.type === "restaurant" && (
                              <span className="text-xs text-muted-foreground">{restaurant.cuisine}</span>
                            )}
                          </div>
                          <span className="text-sm">{restaurant.location || restaurant.contact?.address || 'Location not specified'}</span>
                          {restaurant.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {restaurant.description}
                            </p>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <Badge variant="secondary">{restaurant.rating || "4.5"}</Badge>
                        {restaurant.isPremium && (
                          <Badge variant="default" className="ml-1">Premium</Badge>
                        )}

                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        // Show establishment-specific information
                        const name = restaurant.name?.toLowerCase() || "";
                        const description = restaurant.description?.toLowerCase() || "";
                        
                        // Check for hotel indicators
                        const isHotel = restaurant.type === "hotel" || 
                                      restaurant.type === "hotel_manager" ||
                                      name.includes("hotel") ||
                                      description.includes("hotel") ||
                                      (restaurant.hotel && Object.keys(restaurant.hotel).length > 0);
                        
                        // Check for cafe indicators
                        const isCafe = restaurant.type === "cafe" ||
                                     name.includes("cafe") ||
                                     name.includes("coffee") ||
                                     description.includes("cafe") ||
                                     description.includes("coffee");
                        
                        // Check for bakery indicators
                        const isBakery = restaurant.type === "bakery" ||
                                       name.includes("bakery") ||
                                       name.includes("bake") ||
                                       description.includes("bakery") ||
                                       description.includes("bake");
                        
                        // Check for bar indicators
                        const isBar = restaurant.type === "bar" ||
                                    name.includes("bar") ||
                                    name.includes("pub") ||
                                    description.includes("bar") ||
                                    description.includes("pub");
                        
                        // Return appropriate information
                        if (isHotel) {
                          return (
                            <>
                              {restaurant.hotel?.starRating && (
                                <p className="text-xs text-muted-foreground">
                                  ⭐ {restaurant.hotel.starRating} Star Hotel
                                </p>
                              )}
                              {restaurant.hotel?.roomTypes && restaurant.hotel.roomTypes.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">🏨 Room Types:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {restaurant.hotel.roomTypes.map((roomType, index) => (
                                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {roomType}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {restaurant.hotel?.amenities && restaurant.hotel.amenities.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">🛎️ Hotel Amenities:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {restaurant.hotel.amenities.slice(0, 4).map((amenity, index) => (
                                      <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                        {amenity}
                                      </span>
                                    ))}
                                    {restaurant.hotel.amenities.length > 4 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{restaurant.hotel.amenities.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {restaurant.hotel?.services && restaurant.hotel.services.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">🏢 Hotel Services:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {restaurant.hotel.services.slice(0, 4).map((service, index) => (
                                      <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        {service}
                                      </span>
                                    ))}
                                    {restaurant.hotel.services.length > 4 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{restaurant.hotel.services.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {restaurant.hotel?.rooms && restaurant.hotel.rooms.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">🛏️ Available Room Types:</p>
                                  <div className="space-y-1">
                                    {restaurant.hotel.rooms.filter(room => room.isActive).slice(0, 3).map((room, index) => (
                                      <div key={index} className="text-xs bg-blue-50 p-2 rounded border">
                                        <div className="font-medium">{room.type}</div>
                                        <div className="text-muted-foreground">RWF {room.price?.toLocaleString()}/night</div>
                                        {room.maxOccupancy && (
                                          <div className="text-muted-foreground">Up to {room.maxOccupancy} guests</div>
                                        )}
                                        {room.amenities && room.amenities.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {room.amenities.slice(0, 3).map((amenity, amenityIndex) => (
                                              <span key={amenityIndex} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                                {amenity}
                                              </span>
                                            ))}
                                            {room.amenities.length > 3 && (
                                              <span className="text-xs text-muted-foreground">+{room.amenities.length - 3} more</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {restaurant.hotel.rooms.filter(room => room.isActive).length > 3 && (
                                      <div className="text-xs text-muted-foreground">
                                        +{restaurant.hotel.rooms.filter(room => room.isActive).length - 3} more room types
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {restaurant.hours && (
                                <p className="text-xs text-muted-foreground">{restaurant.hours}</p>
                              )}
                              {/* Show attached establishments for this hotel */}
                              {(() => {
                                // Get outlets for this specific hotel
                                const hotelOutletsList = hotelOutlets[restaurant._id] || []
                                
                                console.log('Hotel:', restaurant.name, 'ID:', restaurant._id)
                                console.log('Hotel outlets:', hotelOutletsList)
                                
                                if (hotelOutletsList.length > 0) {
                                  return (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground">🏢 Hotel Outlets:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {hotelOutletsList.map((outlet, index) => (
                                          <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                            {outlet.type === "restaurant" ? "🍽️" : 
                                             outlet.type === "cafe" ? "☕" :
                                             outlet.type === "bakery" ? "🥖" :
                                             outlet.type === "bar" ? "🍺" : "🏢"} {outlet.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </>
                          );
                        } else if (isCafe) {
                          return (
                            <>
                              {restaurant.cafe?.coffeeTypes && (
                                <p className="text-xs text-muted-foreground">
                                  ☕ {restaurant.cafe.coffeeTypes.slice(0, 3).join(", ")}
                                </p>
                              )}
                              {restaurant.cafe?.wifi && (
                                <p className="text-xs text-muted-foreground">📶 Free WiFi</p>
                              )}
                              {restaurant.cafe?.outdoorSeating && (
                                <p className="text-xs text-muted-foreground">🌿 Outdoor Seating</p>
                              )}
                              {restaurant.hours && (
                                <p className="text-xs text-muted-foreground">{restaurant.hours}</p>
                              )}
                            </>
                          );
                        } else if (isBakery) {
                          return (
                            <>
                              {restaurant.bakery?.specialties && restaurant.bakery.specialties.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  🥖 {restaurant.bakery.specialties.slice(0, 3).join(", ")}
                                </p>
                              )}
                              {restaurant.bakery?.hasCustomCakes && (
                                <p className="text-xs text-muted-foreground">🎂 Custom Cakes Available</p>
                              )}
                              {restaurant.hours && (
                                <p className="text-xs text-muted-foreground">{restaurant.hours}</p>
                              )}
                            </>
                          );
                        } else if (isBar) {
                          return (
                            <>
                              <p className="text-xs text-muted-foreground">🍺 Drinks & Beverages</p>
                              {restaurant.hours && (
                                <p className="text-xs text-muted-foreground">{restaurant.hours}</p>
                              )}
                            </>
                          );
                        } else {
                          // Default restaurant information
                          return (
                            <>
                              {restaurant.priceRange && (
                                <p className="text-xs text-muted-foreground">{restaurant.priceRange}</p>
                              )}
                              {restaurant.hours && (
                                <p className="text-xs text-muted-foreground">{restaurant.hours}</p>
                              )}
                            </>
                          );
                        }
                      })()}
                      {(() => {
                        // Determine the appropriate action based on establishment type
                        const name = restaurant.name?.toLowerCase() || "";
                        const description = restaurant.description?.toLowerCase() || "";
                        
                        // Check for hotel indicators
                        const isHotel = restaurant.type === "hotel" || 
                                      restaurant.type === "hotel_manager" ||
                                      name.includes("hotel") ||
                                      description.includes("hotel") ||
                                      (restaurant.hotel && Object.keys(restaurant.hotel).length > 0);
                        
                        // Check for cafe indicators
                        const isCafe = restaurant.type === "cafe" ||
                                     name.includes("cafe") ||
                                     name.includes("coffee") ||
                                     description.includes("cafe") ||
                                     description.includes("coffee");
                        
                        // Check for bakery indicators
                        const isBakery = restaurant.type === "bakery" ||
                                       name.includes("bakery") ||
                                       name.includes("bake") ||
                                       description.includes("bakery") ||
                                       description.includes("bake");
                        
                        // Check for bar indicators
                        const isBar = restaurant.type === "bar" ||
                                    name.includes("bar") ||
                                    name.includes("pub") ||
                                    description.includes("bar") ||
                                    description.includes("pub");
                        
                        // Return appropriate action button
                        if (isHotel) {
                          return (
                            <Link href={`/hotel/${restaurant._id}`}>
                              <Button variant="outline" className="w-full bg-transparent">
                                View Rooms & Services
                              </Button>
                            </Link>
                          );
                        } else if (isCafe) {
                          return (
                            <Link href={`/cafe/${restaurant._id}`}>
                              <Button variant="outline" className="w-full bg-transparent">
                                View Coffee Menu
                              </Button>
                            </Link>
                          );
                        } else if (isBakery) {
                          return (
                            <Link href={`/bakery/${restaurant._id}`}>
                              <Button variant="outline" className="w-full bg-transparent">
                                View Products
                              </Button>
                            </Link>
                          );
                        } else if (isBar) {
                          return (
                            <Link href={`/bar/${restaurant._id}`}>
                              <Button variant="outline" className="w-full bg-transparent">
                                View Drinks Menu
                              </Button>
                            </Link>
                          );
                        } else {
                          return (
                            <Link href={`/restaurant/${restaurant._id}`}>
                              <Button variant="outline" className="w-full bg-transparent">
                                View Menu
                              </Button>
                            </Link>
                          );
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No restaurants found
              <div className="col-span-3 text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Approved Establishments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Establishments will appear here after they are approved by our team.
                </p>
                <div className="space-y-2">
                  <Link href="/login">
                    <Button>Register Your Restaurant</Button>
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    <p>Already registered? Your restaurant is pending approval.</p>
                    <p>We review each restaurant to ensure quality standards.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/restaurants">
              <Button size="lg" variant="outline" className="bg-transparent">
                View All Restaurants & Hotels
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">How Ingagi Works</h2>
            <p className="text-xl text-muted-foreground">Simple steps to revolutionize your dining experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold">Browse Establishments</h3>
              <p className="text-muted-foreground">Explore featured restaurants, hotels and other establishments on the Ingagi platform</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold">View Menu & Promotions</h3>
              <p className="text-muted-foreground">Scan QR codes or browse online menus with real-time promotions</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold">Order & Pay Instantly</h3>
              <p className="text-muted-foreground">Place orders and pay securely through mobile money integration</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Ingagi */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Why Choose Ingagi?</h2>
            <p className="text-xl text-muted-foreground">Benefits for customers and Establishment owners</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-foreground">For Customers</h3>
              <div className="space-y-6">
                {[
                  "Easy restaurant browsing and discovery",
                  "QR code menu access - no app downloads",
                  "Instant mobile money payments",
                  "Real-time promotions and events",
                  "Seamless ordering experience",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-foreground">For Establishments</h3>
              <div className="space-y-6">
                {[
                  "Complete ERP system with role-based dashboards",
                  "Advanced analytics and sales insights",
                  "Employee management and performance tracking",
                  "Inventory automation and supplier integration",
                  "IoT-ready for robot waiter integration",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Join the future of smart hospitality and dining in Rwanda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                              <Link href="/login">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    {loading ? "Loading..." : featuredRestaurants.length > 0 ? "Join Ingagi Today" : "Be the First Establishment"}
                  </Button>
                </Link>
                {featuredRestaurants.length > 0 && (
                  <Link href="/restaurants">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                    >
                      Browse Restaurants
                    </Button>
                  </Link>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-bold text-foreground">Ingagi</span>
              </div>
              <p className="text-muted-foreground">The future of smart dining and hospitality in Rwanda.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  API
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center">
            <p className="text-muted-foreground">© 2025 Ingagi. All rights reserved. Made with ❤️ in Rwanda.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
