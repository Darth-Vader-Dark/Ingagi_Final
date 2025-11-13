import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Only accountants and managers can approve/reject purchase requests
    const allowedRoles = ["accountant", "manager", "super_admin"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: "Only accountants and managers can approve purchase requests" },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    const { status, approvedAmount, comments } = updateData

    // Validate status
    const validStatuses = ["approved", "rejected", "pending"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be 'approved', 'rejected', or 'pending'" },
        { status: 400 }
      )
    }

    // If approved, require approvedAmount
    if (status === "approved" && !approvedAmount) {
      return NextResponse.json(
        { success: false, error: "Approved amount is required when approving a request" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    const updateFields: any = {
      status,
      updatedAt: new Date(),
      reviewedBy: decoded.userId,
      reviewedByName: decoded.name,
      reviewedAt: new Date()
    }

    if (status === "approved") {
      updateFields.approvedAmount = approvedAmount
    }

    if (comments) {
      updateFields.comments = comments
    }

    const result = await db.collection("equipmentPurchaseRequests").updateOne(
      { 
        _id: new ObjectId(requestId), 
        restaurantId: id 
      },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Purchase request not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Purchase request ${status} successfully`
    })
  } catch (error) {
    console.error("Error updating purchase request:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id, requestId } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Only maintenance staff can delete their own requests, or managers/accountants can delete any
    const allowedRoles = ["maintenance", "manager", "accountant", "super_admin"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if request exists and user has permission to delete it
    const request = await db.collection("equipmentPurchaseRequests").findOne({
      _id: new ObjectId(requestId),
      restaurantId: id
    })

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Purchase request not found" },
        { status: 404 }
      )
    }

    // If maintenance user, can only delete their own requests
    if (decoded.role === "maintenance" && request.requestedBy !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own purchase requests" },
        { status: 403 }
      )
    }

    const result = await db.collection("equipmentPurchaseRequests").deleteOne({
      _id: new ObjectId(requestId),
      restaurantId: id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Purchase request not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Purchase request deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting purchase request:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
