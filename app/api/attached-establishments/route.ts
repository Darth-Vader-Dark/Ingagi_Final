import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Fetch approved attached establishments
    const attachedEstablishments = await db.collection("attachedEstablishments").find({
      status: "approved"
    }).toArray()

    // Get hotel details for each attached establishment
    const hotelIds = [...new Set(attachedEstablishments.map(est => est.hotelId))]
    const hotels = await db.collection("establishments").find({
      _id: { $in: hotelIds.map(id => new ObjectId(id)) }
    }).toArray()

    const hotelMap = new Map(hotels.map(hotel => [hotel._id.toString(), hotel]))

    // Transform attached establishments to match restaurant format
    const transformedEstablishments = attachedEstablishments.map(est => ({
      _id: est._id.toString(),
      name: est.name,
      type: est.type,
      description: est.description,
      location: hotelMap.get(est.hotelId)?.location || "Hotel Location",
      isAttached: true,
      hotelName: hotelMap.get(est.hotelId)?.name || "Unknown Hotel",
      rating: 4.5, // Default rating for attached establishments
      isPremium: false,
      priceRange: "$$",
      hours: "24/7",
      logo: est.image || null, // Include image if available
      contact: {
        address: hotelMap.get(est.hotelId)?.location || "Hotel Location"
      }
    }))

    return NextResponse.json({ 
      success: true, 
      establishments: transformedEstablishments 
    })
  } catch (error) {
    console.error("Error fetching attached establishments:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch attached establishments" 
    }, { status: 500 })
  }
}
