import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["receptionist", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const serviceData = await request.json()

    // Validate required fields
    if (!serviceData.serviceType || !serviceData.description) {
      return NextResponse.json({
        success: false,
        error: "Service type and description are required"
      }, { status: 400 })
    }

    const roomServiceRequest = {
      ...serviceData,
      restaurantId: id,
      requestedBy: decoded.userId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("roomServiceRequests").insertOne(roomServiceRequest)
    const savedRequest = { ...roomServiceRequest, _id: result.insertedId.toString() }

    return NextResponse.json({
      success: true,
      request: savedRequest,
      message: "Room service request created successfully"
    })
  } catch (error) {
    console.error("Error creating room service request:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create room service request"
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["receptionist", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch room service requests for this restaurant
    const requests = await db.collection("roomServiceRequests").find({
      restaurantId: id
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      requests: requests.map(req => ({ ...req, _id: req._id.toString() }))
    })
  } catch (error) {
    console.error("Error fetching room service requests:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch room service requests"
    }, { status: 500 })
  }
}
