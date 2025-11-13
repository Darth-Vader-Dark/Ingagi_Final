import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get platform statistics
    const [
      totalEstablishments,
      totalUsers,
      coreEstablishments,
      proEstablishments,
      enterpriseEstablishments,
      totalOrders
    ] = await Promise.all([
      db.collection("establishments").countDocuments({ isApproved: true }),
      db.collection("users").countDocuments({ role: { $ne: "super_admin" } }),
      db.collection("establishments").countDocuments({ 
        isApproved: true, 
        "subscription.tier": "core" 
      }),
      db.collection("establishments").countDocuments({ 
        isApproved: true, 
        "subscription.tier": "pro" 
      }),
      db.collection("establishments").countDocuments({ 
        isApproved: true, 
        "subscription.tier": "enterprise" 
      }),
      db.collection("orders").countDocuments()
    ])
    
    return NextResponse.json({
      success: true,
      stats: {
        totalEstablishments,
        totalUsers,
        coreEstablishments,
        proEstablishments,
        enterpriseEstablishments,
        totalOrders
      }
    })
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
