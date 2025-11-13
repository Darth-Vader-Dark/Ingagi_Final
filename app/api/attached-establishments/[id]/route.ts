import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    
    // Get the attached establishment
    const establishment = await db.collection("attachedEstablishments").findOne({
      _id: new ObjectId(params.id)
    })
    
    if (!establishment) {
      return NextResponse.json({
        success: false,
        error: "Attached establishment not found"
      }, { status: 404 })
    }
    
    // Get the hotel it's attached to
    const hotel = await db.collection("establishments").findOne({
      _id: new ObjectId(establishment.hotelId)
    })
    
    // Get menu items for this establishment
    const menuItems = await db.collection("attachedEstablishmentMenus").find({
      establishmentId: params.id
    }).toArray()
    
    // Transform the data to match the expected format
    const barData = {
      _id: establishment._id.toString(),
      name: establishment.name,
      type: establishment.type,
      description: establishment.description,
      location: hotel?.location || "Hotel Location",
      phone: hotel?.phone || "",
      email: hotel?.email || "",
      rating: 4.5,
      reviewCount: 0,
      priceRange: "$$",
      hours: "24/7",
      amenities: [],
      menu: menuItems.map(item => ({
        _id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        image: item.image
      })),
      bar: {
        drinkTypes: menuItems.map(item => item.category).filter((value, index, self) => self.indexOf(value) === index),
        happyHour: false
      }
    }
    
    return NextResponse.json({
      success: true,
      bar: barData
    })
  } catch (error) {
    console.error("Error fetching attached establishment:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch attached establishment"
    }, { status: 500 })
  }
}
