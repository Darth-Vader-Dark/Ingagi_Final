import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const PLATFORM_STATS = {
  totalRestaurants: 4,
  pendingApprovals: 2,
  totalRevenue: 4300000,
  totalOrders: 254,
  activeUsers: 1250,
  premiumRestaurants: 1,
  monthlyGrowth: {
    restaurants: 12,
    revenue: 15,
    orders: 8,
    users: 18,
  },
  revenueByMonth: [
    { month: "Jan", revenue: 1200000, orders: 89 },
    { month: "Feb", revenue: 1800000, orders: 134 },
    { month: "Mar", revenue: 2100000, orders: 167 },
    { month: "Apr", revenue: 2800000, orders: 203 },
    { month: "May", revenue: 3200000, orders: 245 },
    { month: "Jun", revenue: 4300000, orders: 254 },
  ],
  cuisineDistribution: [
    { name: "Rwandan Fusion", value: 35 },
    { name: "International", value: 25 },
    { name: "Local Cuisine", value: 20 },
    { name: "Cafe & Bakery", value: 20 },
  ],
}

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

    return NextResponse.json(PLATFORM_STATS)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
