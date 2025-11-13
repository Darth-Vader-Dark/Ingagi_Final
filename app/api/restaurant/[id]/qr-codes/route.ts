import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurantId = id
    
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    const qrCodes = await db.collection("qrCodes")
      .find({ restaurantId })
      .toArray()
    
    // Convert ObjectIds to strings
    const qrCodesWithStringIds = qrCodes.map(qr => ({
      ...qr,
      _id: qr._id.toString()
    }))
    
    return NextResponse.json({
      success: true,
      qrCodes: qrCodesWithStringIds
    })
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurantId = id
    const { name, type, url, image } = await request.json()
    
    if (!restaurantId || !name || !type || !url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Create QR code
    const qrCode = {
      name,
      type,
      url,
      image: image || '',
      restaurantId,
      isActive: true,
      createdAt: new Date(),
      scanCount: 0,
      lastScanned: null
    }
    
    const result = await db.collection("qrCodes").insertOne(qrCode)
    const qrCodeWithStringId = {
      ...qrCode,
      _id: result.insertedId.toString()
    }
    
    return NextResponse.json({
      success: true,
      qrCode: qrCodeWithStringId
    })
  } catch (error) {
    console.error("Error creating QR code:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}


