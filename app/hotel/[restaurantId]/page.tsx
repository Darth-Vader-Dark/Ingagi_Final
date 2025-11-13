"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Star, MapPin, Phone, Mail, Clock, Wifi, Car, CreditCard, Utensils, Coffee, Cake, Wine, Users, Calendar, CheckCircle, Bed, Bath, Wifi as WifiIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Hotel {
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
  hotel: {
    starRating: number
    roomTypes: string[]
    amenities: string[]
    services: string[]
    rooms: Array<{
      _id: string
      number: string
      floor: string
      type: string
      price: number
      isActive: boolean
      image?: string
      features: string[]
    }>
    checkInTime: string
    checkOutTime: string
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

export default function HotelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const hotelId = params.restaurantId as string
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [attachedEstablishments, setAttachedEstablishments] = useState<AttachedEstablishment[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [showPromotionsDialog, setShowPromotionsDialog] = useState(false)
  const [showServicesDialog, setShowServicesDialog] = useState(false)
  const [promotions, setPromotions] = useState<any[]>([])
  const [hotelServices, setHotelServices] = useState<any[]>([])
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
    rooms: 1,
    roomType: "",
    roomId: "",
    price: 0,
    name: "",
    phone: "",
    email: "",
    specialRequests: ""
  })
  const [orderData, setOrderData] = useState({
    serviceType: "",
    serviceName: "",
    quantity: 1,
    customerName: "",
    phone: "",
    email: "",
    deliveryAddress: "",
    specialRequests: "",
    totalAmount: 0
  })

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        // Fetch main hotel data
        const res = await fetch(`/api/restaurant/${hotelId}`)
        const data = await res.json()
        if (data.success) {
          setHotel(data.restaurant)
        }

        // Fetch attached establishments
        const attachedRes = await fetch(`/api/hotel/${hotelId}/attached-establishments`)
        const attachedData = await attachedRes.json()
        console.log('Fetched attached establishments:', attachedData)
        if (attachedData.success) {
          const uniqueEstablishments = Array.from(
            new Map(attachedData.establishments?.map((est: any) => [est._id, est])).values()
          )
          console.log('After deduplication:', uniqueEstablishments)
          setAttachedEstablishments(uniqueEstablishments || [])
        }

        // Fetch promotions
        const promosRes = await fetch(`/api/restaurant/${hotelId}/promotions`)
        const promosData = await promosRes.json()
        if (promosData.success) {
          setPromotions(promosData.promotions || [])
        }

        // Fetch hotel services
        const servicesRes = await fetch(`/api/restaurant/${hotelId}/services`)
        const servicesData = await servicesRes.json()
        if (servicesData.success) {
          setHotelServices(servicesData.services || [])
        }

        // Fetch hotel rooms
        const roomsRes = await fetch(`/api/restaurant/${hotelId}/rooms`)
        const roomsData = await roomsRes.json()
        console.log('Fetched rooms:', roomsData)
        if (roomsData.success) {
          setRooms(roomsData.rooms || [])
          // Debug room data
          roomsData.rooms?.forEach((room: any, index: number) => {
            console.log(`Room ${index}:`, {
              type: room.type,
              hasImage: !!room.image,
              hasPhotos: !!(room.photos && room.photos.length > 0),
              image: room.image,
              photos: room.photos
            })
          })
        }
      } catch (error) {
        console.error("Error fetching hotel data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hotelId) {
      fetchHotelData()
    }
  }, [hotelId])

  if (loading) {
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
        
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading hotel details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hotel) {
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
        
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Hotel Not Found</h1>
            <p className="text-gray-600 mb-6">The hotel you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
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
      <div className="relative h-96 bg-gradient-to-r from-primary to-primary/80">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">{hotel.name}</h1>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">{hotel.hotel.starRating} Star Hotel</span>
              </div>
            </div>
            <p className="text-xl text-gray-200 mb-4">{hotel.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{hotel.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{hotel.rating} ({hotel.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Check-in: {hotel.hotel.checkInTime} | Check-out: {hotel.hotel.checkOutTime}</span>
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="promotions">Promotions</TabsTrigger>
                <TabsTrigger value="outlets">Outlets</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {hotel.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{hotel.description}</p>
                    
                    {/* Room Types */}
                    {hotel.hotel?.roomTypes && hotel.hotel.roomTypes.length > 0 ? (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🏨 Available Room Types</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {hotel.hotel.roomTypes.map((roomType, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50">
                              <Bed className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{roomType}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🏨 Available Room Types</h4>
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-500 text-center">Room types will be displayed here once the hotel manager adds them.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Hotel Amenities */}
                    {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 ? (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🛎️ Hotel Amenities</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {hotel.hotel.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-orange-50">
                              <CheckCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🛎️ Hotel Amenities</h4>
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-500 text-center">Hotel amenities will be displayed here once the hotel manager adds them.</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Hotel Services */}
                    {hotel.hotel?.services && hotel.hotel.services.length > 0 ? (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🏢 Hotel Services</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {hotel.hotel.services.map((service, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">🏢 Hotel Services</h4>
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-500 text-center">Hotel services will be displayed here once the hotel manager adds them.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </TabsContent>

              <TabsContent value="rooms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Rooms</CardTitle>
                    <CardDescription>Choose from our selection of comfortable rooms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {rooms && rooms.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rooms.filter(room => room.isActive).map((room) => (
                          <Card key={room._id} className="overflow-hidden">
                            <div className="relative">
                              <div className="h-48 w-full">
                                {(() => {
                                  console.log(`Rendering room ${room.type}:`, {
                                    hasImage: !!room.image,
                                    image: room.image,
                                    hasPhotos: !!(room.photos && room.photos.length > 0)
                                  })
                                  const displayImage = room.image || (room.photos && room.photos[0])
                                  return displayImage ? (
                                    <Image
                                      src={displayImage}
                                      alt={`${room.type} room`}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                      <div className="text-center">
                                        <Bed className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">{room.type}</p>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                              <div className="absolute top-4 right-4">
                                <Badge variant="secondary" className="bg-white/90 text-black">
                                  {room.type}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Bed className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold text-lg">{room.type}</h4>
                              </div>
                              
                              {room.description && (
                                <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                {room.maxOccupancy && (
                                  <div>
                                    <span className="font-medium">Max Occupancy:</span> {room.maxOccupancy} guests
                                  </div>
                                )}
                                {room.bedType && (
                                  <div>
                                    <span className="font-medium">Bed Type:</span> {room.bedType}
                                  </div>
                                )}
                                {room.roomSize && (
                                  <div>
                                    <span className="font-medium">Size:</span> {room.roomSize} sq ft
                                  </div>
                                )}
                                {room.floor && (
                                  <div>
                                    <span className="font-medium">Floor:</span> {room.floor}
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
                                  <span className="text-sm font-medium">Room Photos:</span>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    {room.photos.slice(0, 4).map((photo, index) => (
                                      <div key={index} className="relative group cursor-pointer">
                                        <img 
                                          src={photo} 
                                          alt={`Room photo ${index + 1}`} 
                                          className="w-full h-16 object-cover rounded border hover:opacity-80 transition-opacity" 
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded"></div>
                                      </div>
                                    ))}
                                    {room.photos.length > 4 && (
                                      <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200 transition-colors">
                                        +{room.photos.length - 4} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4">
                                <div>
                                  <p className="text-lg font-bold text-primary">
                                    {room.price ? `RWF ${room.price.toLocaleString()}/night` : 'Price on request'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">Room {room.number}</p>
                                </div>
                                <Button 
                                  onClick={() => {
                                    setBookingData({
                                      ...bookingData,
                                      roomType: room.type,
                                      roomId: room._id,
                                      price: room.price
                                    })
                                    setShowBookingDialog(true)
                                  }}
                                >
                                  Book Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🏨</div>
                        <p className="text-gray-500">No rooms available</p>
                        <p className="text-sm text-gray-400 mt-2">Room information will be displayed here when available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hotel Services & Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Hotel Amenities */}
                      {hotel.hotel.amenities && hotel.hotel.amenities.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">🛎️ Hotel Amenities</h4>
                          <div className="space-y-2">
                            {hotel.hotel.amenities.map((amenity, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hotel Services */}
                      {hotel.hotel.services && hotel.hotel.services.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">🏢 Hotel Services</h4>
                          <div className="space-y-2">
                            {hotel.hotel.services.map((service, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">{service}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="promotions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Promotions</CardTitle>
                    <CardDescription>Special offers and deals available at our hotel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {promotions.length > 0 ? (
                      <div className="space-y-4">
                        {promotions.map((promo, index) => (
                          <Card key={index} className="border-l-4 border-l-yellow-500 bg-yellow-50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{promo.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span>📅 {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}</span>
                                    <span>💰 {promo.discount}% OFF</span>
                                  </div>
                                </div>
                                <Badge className="bg-yellow-500 text-white">
                                  {promo.discount}% OFF
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🎉</div>
                        <p className="text-gray-500">No current promotions available</p>
                        <p className="text-sm text-gray-400 mt-2">Check back later for special offers!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outlets" className="space-y-6">
      <Card>
        <CardHeader>
                    <CardTitle>Hotel Outlets</CardTitle>
                    <CardDescription>Restaurants, cafes, bars, and other services within our hotel</CardDescription>
        </CardHeader>
        <CardContent>
                    {attachedEstablishments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {console.log('Rendering outlets:', attachedEstablishments.length, 'establishments')}
                        {attachedEstablishments.map((establishment) => (
                          <Card key={`outlets-${establishment._id}`} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {establishment.type === "restaurant" && <Utensils className="h-4 w-4 text-primary" />}
                                {establishment.type === "cafe" && <Coffee className="h-4 w-4 text-primary" />}
                                {establishment.type === "bakery" && <Cake className="h-4 w-4 text-primary" />}
                                {establishment.type === "bar" && <Wine className="h-4 w-4 text-primary" />}
                                <h4 className="font-semibold">{establishment.name}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{establishment.description}</p>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => router.push(`/bar/${establishment._id}`)}
                                >
                                  View Menu
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => {
                                    setOrderData({
                                      ...orderData,
                                      serviceType: establishment.type,
                                      serviceName: establishment.name,
                                      totalAmount: 0
                                    })
                                    setShowOrderDialog(true)
                                  }}
                                >
                                  Order Now
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🏢</div>
                        <p className="text-gray-500">No hotel outlets available</p>
                        <p className="text-sm text-gray-400 mt-2">Additional services will be displayed here when available.</p>
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
                      <span>{hotel.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{hotel.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{hotel.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Check-in: {hotel.hotel.checkInTime} | Check-out: {hotel.hotel.checkOutTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle>Book Your Stay</CardTitle>
                <CardDescription>Reserve your room at {hotel.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => setShowBookingDialog(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <div className="text-sm text-gray-600">
                  <p>⭐ {hotel.rating} rating from {hotel.reviewCount} reviews</p>
                  <p>🏨 {hotel.hotel.starRating} star hotel</p>
                  <p>📍 {hotel.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Services & Ordering */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Services</CardTitle>
                <CardDescription>Order services and amenities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowServicesDialog(true)}
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  View Services
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowOrderDialog(true)}
                >
                  <Wine className="h-4 w-4 mr-2" />
                  Order Services
                </Button>
                {promotions.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPromotionsDialog(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    View Promotions
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Hotel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Star Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{hotel.hotel.starRating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span>{hotel.hotel.checkInTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span>{hotel.hotel.checkOutTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Types</span>
                  <span>{hotel.hotel.roomTypes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outlets</span>
                  <span>{attachedEstablishments.length}</span>
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
              Fill in your details to book a room at {hotel.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Check-in Date</label>
                <Input
                  type="date"
                  value={bookingData.checkIn}
                  onChange={(e) => setBookingData({...bookingData, checkIn: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Check-out Date</label>
                <Input
                  type="date"
                  value={bookingData.checkOut}
                  onChange={(e) => setBookingData({...bookingData, checkOut: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <label className="text-sm font-medium">Number of Rooms</label>
                <Select value={bookingData.rooms.toString()} onValueChange={(value) => setBookingData({...bookingData, rooms: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Room' : 'Rooms'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Room Type</label>
              {bookingData.roomType ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{bookingData.roomType}</p>
                      {bookingData.price && (
                        <p className="text-sm text-blue-700">RWF {bookingData.price.toLocaleString()}/night</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBookingData({...bookingData, roomType: "", roomId: "", price: 0})}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <Select value={bookingData.roomType} onValueChange={(value) => setBookingData({...bookingData, roomType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room._id} value={room.type}>{room.type} - RWF {room.price?.toLocaleString()}/night</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/hotel/${hotelId}/bookings`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(bookingData)
                    })
                    
                    if (response.ok) {
                      const result = await response.json()
                      alert(`Booking submitted successfully! Booking ID: ${result.booking._id}. We'll contact you soon.`)
                      setShowBookingDialog(false)
                      // Reset form
                      setBookingData({
                        checkIn: "",
                        checkOut: "",
                        guests: 1,
                        rooms: 1,
                        roomType: "",
                        roomId: "",
                        price: 0,
                        name: "",
                        phone: "",
                        email: "",
                        specialRequests: ""
                      })
                    } else {
                      alert("Failed to submit booking. Please try again.")
                    }
                  } catch (error) {
                    console.error("Booking error:", error)
                    alert("Failed to submit booking. Please try again.")
                  }
                }}
                disabled={!bookingData.name || !bookingData.phone || !bookingData.checkIn || !bookingData.checkOut}
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

      {/* Services Dialog */}
      <Dialog open={showServicesDialog} onOpenChange={setShowServicesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hotel Services</DialogTitle>
            <DialogDescription>Available services and amenities at {hotel.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Hotel Amenities */}
            {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🛎️ Hotel Amenities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {hotel.hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Services */}
            {hotel.hotel?.services && hotel.hotel.services.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🏢 Hotel Services</h4>
                <div className="grid grid-cols-2 gap-2">
                  {hotel.hotel.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Services */}
            {hotelServices.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🌟 Additional Services</h4>
                <div className="space-y-2">
                  {hotelServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-medium">{service.name}</h5>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">RWF {service.price}</p>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setOrderData({
                              ...orderData,
                              serviceType: service.type,
                              serviceName: service.name,
                              totalAmount: service.price
                            })
                            setShowServicesDialog(false)
                            setShowOrderDialog(true)
                          }}
                        >
                          Order
                        </Button>
                      </div>
              </div>
            ))}
                </div>
              </div>
            )}

            {(!hotel.hotel?.amenities?.length && !hotel.hotel?.services?.length && !hotelServices.length) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No services available at the moment</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Promotions Dialog */}
      <Dialog open={showPromotionsDialog} onOpenChange={setShowPromotionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Current Promotions</DialogTitle>
            <DialogDescription>Special offers and deals at {hotel.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {promotions.length > 0 ? (
              promotions.map((promo, index) => (
                <Card key={index} className="border-l-4 border-l-yellow-500 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{promo.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>📅 {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}</span>
                          <span>💰 {promo.discount}% OFF</span>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500 text-white">
                        {promo.discount}% OFF
                      </Badge>
          </div>
        </CardContent>
      </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-gray-500">No current promotions available</p>
                <p className="text-sm text-gray-400 mt-2">Check back later for special offers!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Hotel Services</DialogTitle>
            <DialogDescription>
              Place your order for {orderData.serviceName || 'hotel services'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <Input
                value={orderData.serviceType}
                onChange={(e) => setOrderData({...orderData, serviceType: e.target.value})}
                placeholder="Service type"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service Name</label>
              <Input
                value={orderData.serviceName}
                onChange={(e) => setOrderData({...orderData, serviceName: e.target.value})}
                placeholder="Service name"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                value={orderData.quantity}
                onChange={(e) => setOrderData({...orderData, quantity: parseInt(e.target.value) || 1})}
                min="1"
              />
            </div>
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
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={orderData.email}
                onChange={(e) => setOrderData({...orderData, email: e.target.value})}
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Delivery Address</label>
              <Textarea
                value={orderData.deliveryAddress}
                onChange={(e) => setOrderData({...orderData, deliveryAddress: e.target.value})}
                placeholder="Your delivery address or room number"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Special Requests</label>
              <Textarea
                value={orderData.specialRequests}
                onChange={(e) => setOrderData({...orderData, specialRequests: e.target.value})}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => {
                  // Handle order submission
                  alert("Service order placed! We'll contact you soon.")
                  setShowOrderDialog(false)
                }}
                disabled={!orderData.customerName || !orderData.phone}
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