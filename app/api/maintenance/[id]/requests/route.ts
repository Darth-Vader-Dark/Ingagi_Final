import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch maintenance requests for this hotel/restaurant
    const requests = await db.collection("maintenanceRequests").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      requests: requests.map(request => ({ 
        ...request, 
        _id: request._id.toString()
      }))
    })
  } catch (error) {
    console.error("Error fetching maintenance requests:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch maintenance requests"
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const requestData = await request.json()

    // Validate required fields
    if (!requestData.title || !requestData.description || !requestData.category) {
      return NextResponse.json({
        success: false,
        error: "Title, description, and category are required"
      }, { status: 400 })
    }

    const newRequest = {
      ...requestData,
      restaurantId: id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("maintenanceRequests").insertOne(newRequest)
    const savedRequest = { 
      ...newRequest, 
      _id: result.insertedId.toString()
    }

    return NextResponse.json({
      success: true,
      request: savedRequest,
      message: "Maintenance request created successfully"
    })
  } catch (error) {
    console.error("Error creating maintenance request:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create maintenance request"
    }, { status: 500 })
  }
}
