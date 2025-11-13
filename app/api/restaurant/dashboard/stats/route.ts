import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const RESTAURANT_STATS = {
  rest_001: {
    totalOrders: 156,
    totalRevenue: 2500000,
    activeEmployees: 3,
    menuItems: 15,
    avgRating: 4.8,
    isPremium: true,
    weeklyRevenue: [
      { day: "Mon", revenue: 85000, orders: 12 },
      { day: "Tue", revenue: 92000, orders: 15 },
      { day: "Wed", revenue: 78000, orders: 11 },
      { day: "Thu", revenue: 105000, orders: 18 },
      { day: "Fri", revenue: 125000, orders: 22 },
      { day: "Sat", revenue: 145000, orders: 28 },
      { day: "Sun", revenue: 135000, orders: 25 },
    ],
    orderStatusDistribution: [
      { name: "Completed", value: 65 },
      { name: "Preparing", value: 20 },
      { name: "Ready", value: 10 },
      { name: "Cancelled", value: 5 },
    ],
  },
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Authorization required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "restaurant_admin") {
      return NextResponse.json({ message: "Restaurant admin access required" }, { status: 403 })
    }

    const restaurantId = decoded.restaurantId || "rest_001"
    const stats = RESTAURANT_STATS[restaurantId as keyof typeof RESTAURANT_STATS]

    if (!stats) {
      return NextResponse.json({ message: "Restaurant stats not found" }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching restaurant stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
