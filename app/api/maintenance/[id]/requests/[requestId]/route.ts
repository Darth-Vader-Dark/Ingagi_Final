import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const updateData = await request.json()

    const result = await db.collection("maintenanceRequests").updateOne(
      { _id: new ObjectId(requestId), restaurantId: id },
      { $set: { ...updateData, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Request not found or unauthorized" }, { status: 404 })
    }

    const maintenanceRequest = await db.collection("maintenanceRequests").findOne({ _id: new ObjectId(requestId) })

    return NextResponse.json({ 
      success: true, 
      request: { ...maintenanceRequest, _id: maintenanceRequest?._id.toString() },
      message: "Request updated successfully"
    })
  } catch (error) {
    console.error("Error updating maintenance request:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update request"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("maintenanceRequests").deleteOne(
      { _id: new ObjectId(requestId), restaurantId: id }
    )

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Request not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Request deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting maintenance request:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete request"
    }, { status: 500 })
  }
}
