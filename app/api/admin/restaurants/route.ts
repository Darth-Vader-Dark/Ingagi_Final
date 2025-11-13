import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

// Mock restaurant database for admin
const ADMIN_RESTAURANTS = [
  {
    id: "rest_001",
    name: "Kigali Heights Restaurant",
    type: "restaurant",
    owner: "Jean Baptiste",
    email: "jean@kigaliheights.com",
    phone: "+250 788 123 456",
    location: "KN 4 Ave, Kigali",
    cuisine: "Rwandan Fusion",
    status: "approved",
    isPremium: true,
    createdAt: "2025-01-15",
    revenue: 2500000,
    orders: 156,
    documents: ["business_license.pdf", "health_certificate.pdf"],
  },
  {
    id: "rest_002",
    name: "Ubumuntu Hotel",
    type: "hotel",
    owner: "Marie Claire",
    email: "marie@ubumuntu.com",
    phone: "+250 788 456 789",
    location: "KG 9 Ave, Kigali",
    cuisine: "International",
    status: "approved",
    isPremium: false,
    createdAt: "2025-01-10",
    revenue: 1800000,
    orders: 98,
    documents: ["business_license.pdf"],
  },
  {
    id: "rest_003",
    name: "Nyamirambo Bistro",
    type: "cafe",
    owner: "Paul Kagame",
    email: "paul@nyamirambo.com",
    phone: "+250 788 789 012",
    location: "Nyamirambo, Kigali",
    cuisine: "Local Cuisine",
    status: "pending",
    isPremium: false,
    createdAt: "2025-01-20",
    revenue: 0,
    orders: 0,
    documents: ["business_license.pdf"],
  },
  {
    id: "rest_004",
    name: "Downtown Bakery",
    type: "bakery",
    owner: "Patrick",
    email: "patrick@downtown-bakery.com",
    phone: "+250 789 000 111",
    location: "Downtown, Kigali",
    cuisine: "Bakery",
    status: "approved",
    isPremium: false,
    createdAt: "2025-02-01",
    revenue: 450000,
    orders: 210,
    documents: ["business_license.pdf"]
  },
]

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Authorization required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ message: "Super admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "restaurant" | "cafe" | "hotel" | "bakery" | null
    const list = type ? ADMIN_RESTAURANTS.filter(r => (r as any).type === type) : ADMIN_RESTAURANTS
    return NextResponse.json(list)
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Authorization required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ message: "Super admin access required" }, { status: 403 })
    }

    const { restaurantId, action, reason } = await request.json()

    // In production, update the database
    const restaurant = ADMIN_RESTAURANTS.find((r) => r.id === restaurantId)
    if (!restaurant) {
      return NextResponse.json({ message: "Restaurant not found" }, { status: 404 })
    }

    if (action === "approve") {
      restaurant.status = "approved"
    } else if (action === "reject") {
      restaurant.status = "rejected"
    } else if (action === "toggle_premium") {
      restaurant.isPremium = !restaurant.isPremium
    }

    return NextResponse.json({ message: "Restaurant updated successfully", restaurant })
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
