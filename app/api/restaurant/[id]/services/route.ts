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
    
    // Fetch services for this establishment
    const services = await db.collection("services").find({
      establishmentId: id
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      services: services.map(service => ({
        _id: service._id.toString(),
        name: service.name,
        description: service.description,
        type: service.type,
        price: service.price,
        isAvailable: service.isAvailable,
        createdAt: service.createdAt
      }))
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch services"
    }, { status: 500 })
  }
}
