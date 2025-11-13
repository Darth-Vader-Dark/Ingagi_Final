import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qrCodeId: string }> }
) {
  try {
    const { id: restaurantId, qrCodeId } = await params
    const updateData = await request.json()
    
    if (!restaurantId || !qrCodeId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(qrCodeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid QR code ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Update QR code
    const result = await db.collection("qrCodes").updateOne(
      { _id: new ObjectId(qrCodeId), restaurantId },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "QR code not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "QR code updated successfully"
    })
  } catch (error) {
    console.error("Error updating QR code:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qrCodeId: string }> }
) {
  try {
    const { id: restaurantId, qrCodeId } = await params
    
    if (!restaurantId || !qrCodeId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(qrCodeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid QR code ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Delete QR code
    const result = await db.collection("qrCodes").deleteOne(
      { _id: new ObjectId(qrCodeId), restaurantId }
    )
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "QR code not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "QR code deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting QR code:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

