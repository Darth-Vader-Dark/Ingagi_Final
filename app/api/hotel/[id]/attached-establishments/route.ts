import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    
    // Fetch attached establishments for this specific hotel
    const attachedEstablishments = await db.collection("attachedEstablishments").find({
      restaurantId: id,
      status: "approved"
    }).toArray()

    // Get hotel details
    const hotel = await db.collection("establishments").findOne({
      _id: new ObjectId(id)
    })

    // Transform attached establishments
    const transformedEstablishments = attachedEstablishments.map(est => ({
      _id: est._id.toString(),
      name: est.name,
      type: est.type,
      description: est.description,
      location: hotel?.location || "Hotel Location",
      isAttached: true,
      hotelName: hotel?.name || "Unknown Hotel",
      hotelId: est.hotelId,
      rating: 4.5,
      isPremium: false,
      priceRange: "$$",
      hours: "24/7",
      contact: {
        address: hotel?.location || "Hotel Location"
      }
    }))

    return NextResponse.json({ 
      success: true, 
      establishments: transformedEstablishments 
    })
  } catch (error) {
    console.error("Error fetching hotel attached establishments:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch attached establishments" 
    }, { status: 500 })
  }
}
