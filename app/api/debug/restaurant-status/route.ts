import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("id")
    
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Get the establishment directly from database
    const establishment = await db.collection('establishments').findOne({ 
      _id: new ObjectId(restaurantId)
    })
    
    if (!establishment) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      )
    }
    
    // Return raw database data for debugging
    return NextResponse.json({
      success: true,
      restaurant: {
        _id: establishment._id.toString(),
        name: establishment.name,
        type: establishment.type,
        isApproved: establishment.isApproved,
        approvalStatus: establishment.approvalStatus,
        status: establishment.status,
        rawData: {
          isApproved: establishment.isApproved,
          approvalStatus: establishment.approvalStatus,
          status: establishment.status,
          approved: establishment.approved,
          isActive: establishment.isActive
        }
      }
    })
  } catch (error) {
    console.error("Error debugging restaurant status:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
