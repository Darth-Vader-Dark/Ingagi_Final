import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get all establishments for debugging
    const allEstablishments = await db.collection("establishments")
      .find({})
      .toArray()
    
    // Convert ObjectIds to strings and add default values
    const establishmentsWithDefaults = allEstablishments.map(establishment => ({
      _id: establishment._id.toString(),
      name: establishment.name,
      type: establishment.type || "Unknown",
      cuisine: establishment.restaurant?.cuisine || establishment.cuisine || "N/A",
      rating: establishment.rating || "No rating",
      description: establishment.description || "",
      location: establishment.location || "",
      logo: establishment.logo || "",
      isPremium: establishment.isPremium || false,
      isApproved: establishment.isApproved || false,
      createdAt: establishment.createdAt || "Unknown",
      ownerId: establishment.ownerId || "Unknown"
    }))
    
    return NextResponse.json({
      success: true,
      totalCount: establishmentsWithDefaults.length,
      establishments: establishmentsWithDefaults
    })
  } catch (error) {
    console.error("Error fetching all establishments:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
