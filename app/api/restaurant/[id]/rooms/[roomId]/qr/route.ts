import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  try {
    const { id: restaurantId, roomId } = params
    if (!restaurantId || !roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 })
    }
    const roomServiceUrl = `${request.nextUrl.origin}/room/${restaurantId}/${roomId}`
    const { db } = await connectToDatabase()
    const qrDoc = {
      name: `Room ${roomId} Services`,
      type: "room_service",
      url: roomServiceUrl,
      image: "",
      restaurantId,
      isActive: true,
      createdAt: new Date(),
      scanCount: 0,
      lastScanned: null,
    }
    const ins = await db.collection("qrCodes").insertOne(qrDoc)
    return NextResponse.json({ success: true, qrCodeId: ins.insertedId.toString(), url: roomServiceUrl })
  } catch (error) {
    console.error("Error generating room QR:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}


