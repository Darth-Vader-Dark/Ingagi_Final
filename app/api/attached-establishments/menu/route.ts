import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Fetch approved attached establishments with their menu items
    const attachedEstablishments = await db.collection("attachedEstablishments").find({
      status: "approved"
    }).toArray()

    // Get hotel details for each attached establishment
    const hotelIds = [...new Set(attachedEstablishments.map(est => est.hotelId))]
    const hotels = await db.collection("establishments").find({
      _id: { $in: hotelIds.map(id => new ObjectId(id)) }
    }).toArray()

    const hotelMap = new Map(hotels.map(hotel => [hotel._id.toString(), hotel]))

    // For each attached establishment, get menu items and use the first item's image as the establishment image
    const establishmentsWithImages = await Promise.all(
      attachedEstablishments.map(async (est) => {
        // Get menu items for this establishment
        const menuItems = await db.collection("attachedEstablishmentMenus").find({
          establishmentId: est._id.toString()
        }).limit(1).toArray()

        const image = menuItems.length > 0 && menuItems[0].image ? menuItems[0].image : null

        const hotel = hotelMap.get(est.hotelId)
        return {
          _id: est._id.toString(),
          name: est.name,
          type: est.type,
          description: est.description,
          location: hotel?.location || "Hotel Location",
          isAttached: true,
          hotelName: hotel?.name || "Unknown Hotel",
          hotelId: est.hotelId,
          hotel: hotel?.hotel || null,
          rating: 4.5,
          isPremium: false,
          priceRange: "$$",
          hours: "24/7",
          logo: image,
          contact: {
            address: hotel?.location || "Hotel Location"
          }
        }
      })
    )

    return NextResponse.json({ 
      success: true, 
      establishments: establishmentsWithImages 
    })
  } catch (error) {
    console.error("Error fetching attached establishments with images:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch attached establishments" 
    }, { status: 500 })
  }
}
