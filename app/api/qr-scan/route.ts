import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { qrCodeId, restaurantId } = await request.json()
    
    if (!qrCodeId || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "QR Code ID and Restaurant ID are required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(qrCodeId) || !ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Update QR code scan count and last scanned time
    const result = await db.collection("qrCodes").updateOne(
      { 
        _id: new ObjectId(qrCodeId), 
        restaurantId: restaurantId 
      },
      { 
        $inc: { scanCount: 1 },
        $set: { lastScanned: new Date() }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "QR code not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "QR code scan tracked successfully"
    })
  } catch (error) {
    console.error("Error tracking QR code scan:", error)
    return NextResponse.json(
      { success: false, error: "Failed to track QR code scan" },
      { status: 500 }
    )
  }
}

