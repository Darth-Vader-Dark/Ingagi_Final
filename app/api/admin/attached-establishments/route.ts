import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const establishments = await db.collection("attached_establishments").find({
      status: "pending"
    }).toArray()

    // Get hotel details for each request
    const hotelIds = [...new Set(establishments.map(est => est.hotelId))]
    const hotels = await db.collection("establishments").find({
      _id: { $in: hotelIds.map(id => new ObjectId(id)) }
    }).toArray()

    const hotelMap = new Map(hotels.map(hotel => [hotel._id.toString(), hotel]))

    return NextResponse.json({ 
      success: true, 
      establishments: establishments.map(est => ({
        id: est._id.toString(),
        type: est.type,
        name: est.name,
        description: est.description,
        status: est.status,
        createdAt: est.createdAt,
        hotelId: est.hotelId,
        hotelName: hotelMap.get(est.hotelId)?.name || "Unknown Hotel",
        requestedBy: est.requestedBy
      }))
    })
  } catch (error) {
    console.error("Error fetching pending establishments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch establishments" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { establishmentId, action } = body

    if (!establishmentId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const status = action === "approve" ? "approved" : "rejected"
    
    const result = await db.collection("attached_establishments").updateOne(
      { _id: new ObjectId(establishmentId) },
      { 
        $set: { 
          status,
          reviewedAt: new Date(),
          reviewedBy: user.id
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Establishment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("Error updating establishment status:", error)
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 })
  }
}
