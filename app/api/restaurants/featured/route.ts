import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get only approved establishments for homepage display
    const featuredEstablishments = await db.collection("establishments")
      .find({ 
        isApproved: true  // Only show approved establishments
      })
      .sort({ 
        isPremium: -1,   // Premium first
        createdAt: -1    // Newest first
      })
      .limit(6)
      .toArray()
    
    // Convert ObjectIds to strings and add default values for missing fields
    const establishmentsWithDefaults = featuredEstablishments.map(establishment => ({
      _id: establishment._id.toString(),
      name: establishment.name,
      type: establishment.type,
      cuisine: establishment.restaurant?.cuisine || establishment.cuisine || "General",
      rating: establishment.rating || 4.5,
      description: establishment.description || "",
      location: establishment.location || "",
      logo: establishment.logo || "",
      isPremium: establishment.isPremium || false,
      hotel: establishment.hotel || null,
      restaurant: establishment.restaurant || null
    }))
    
    // Debug logging
    console.log('Featured establishments from database:', establishmentsWithDefaults.map(est => ({
      name: est.name,
      type: est.type,
      description: est.description
    })))
    
    return NextResponse.json({
      success: true,
      restaurants: establishmentsWithDefaults
    })
  } catch (error) {
    console.error("Error fetching featured restaurants:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
