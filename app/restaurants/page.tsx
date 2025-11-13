"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MapPin, Clock, Search, Filter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Establishment {
  _id: string
  name: string
  type: "restaurant" | "cafe" | "hotel" | "bakery"
  cuisine?: string
  rating?: number
  location: string
  logo?: string
  banner?: string
  description: string
  isPremium: boolean
  isApproved: boolean
  hours: {
    open: string
    close: string
    daysOpen: string[]
  }
  createdAt: string
}

export default function EstablishmentsPage() {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [filteredEstablishments, setFilteredEstablishments] = useState<Establishment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEstablishments()
  }, [])

  useEffect(() => {
    filterEstablishments()
  }, [establishments, searchTerm, selectedType, selectedCuisine])

  const fetchEstablishments = async () => {
    try {
      const response = await fetch("/api/restaurants/featured")
      const data = await response.json()
      setEstablishments(data.restaurants || [])
      setLoading(false)
    } catch (error) {
      console.error("Error fetching establishments:", error)
      setLoading(false)
    }
  }

  const filterEstablishments = () => {
    let filtered = establishments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (establishment) =>
          establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (establishment.cuisine && establishment.cuisine.toLowerCase().includes(searchTerm.toLowerCase())) ||
          establishment.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((establishment) => establishment.type === selectedType)
    }

    // Cuisine filter (only for restaurants)
    if (selectedCuisine !== "all") {
      filtered = filtered.filter((establishment) => 
        establishment.type === "restaurant" && establishment.cuisine === selectedCuisine
      )
    }

    setFilteredEstablishments(filtered)
  }

  const cuisines = [...new Set(establishments.filter(e => e.type === "restaurant" && e.cuisine).map((e) => e.cuisine!))]
  const types = [...new Set(establishments.map((e) => e.type))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-medium">Loading establishments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Establishments</h1>
              <p className="text-gray-600 mt-2">Discover amazing restaurants, cafes & hotels across Rwanda</p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search establishments, cuisine, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Cuisines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  {cuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredEstablishments.length} of {establishments.length} establishments
          </p>
        </div>

        {/* Establishments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEstablishments.map((establishment) => (
            <Card key={establishment._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={establishment.logo || establishment.banner || "/placeholder.svg"}
                  alt={establishment.name}
                  fill
                  className="object-cover"
                />
                {establishment.isPremium && <Badge className="absolute top-3 left-3 bg-emerald-600">Premium</Badge>}
                <Badge className={`absolute top-3 right-3 ${
                  establishment.type === "restaurant" ? "bg-blue-600" : 
                  establishment.type === "cafe" ? "bg-orange-600" : "bg-purple-600"
                }`}>
                  {establishment.type.charAt(0).toUpperCase() + establishment.type.slice(1)}
                </Badge>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{establishment.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{establishment.rating || "New"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {establishment.type === "restaurant" && establishment.cuisine && (
                    <Badge variant="secondary">{establishment.cuisine}</Badge>
                  )}
                  <Badge variant="outline">
                    {establishment.type === "restaurant" ? "🍽️ Restaurant" :
                     establishment.type === "cafe" ? "☕ Cafe" : "🏨 Hotel"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{establishment.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{establishment.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{establishment.hours.open} - {establishment.hours.close}</span>
                  </div>
                </div>
                <Link href={establishment.type === "hotel" ? `/hotel/${establishment._id}` : `/restaurant/${establishment._id}`}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {establishment.type === "restaurant" ? "View Menu & Order" :
                     establishment.type === "cafe" ? "View Menu & Order" :
                     establishment.type === "bakery" ? "View Menu & Order" : "View Rooms"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEstablishments.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No establishments found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
