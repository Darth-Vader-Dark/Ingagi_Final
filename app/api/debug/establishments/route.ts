import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get all establishments to see what's in the database
    const establishments = await db.collection("establishments").find({}).toArray()
    
    const debugData = establishments.map(est => ({
      _id: est._id.toString(),
      name: est.name,
      type: est.type,
      isApproved: est.isApproved,
      description: est.description,
      createdAt: est.createdAt,
      hotel: est.hotel,
      restaurant: est.restaurant
    }))
    
    return NextResponse.json({
      success: true,
      establishments: debugData,
      count: debugData.length
    })
  } catch (error) {
    console.error("Error fetching establishments debug data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch debug data" },
      { status: 500 }
    )
  }
}
