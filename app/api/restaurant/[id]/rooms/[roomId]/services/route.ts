import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  try {
    const { id: restaurantId, roomId } = params
    if (!restaurantId || !roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 })
    }
    const { db } = await connectToDatabase()
    const services = await db.collection("roomServices").find({ restaurantId, roomId }).toArray()
    const result = services.map(s => ({ ...s, _id: s._id.toString() }))
    return NextResponse.json({ success: true, services: result })
  } catch (error) {
    console.error("Error fetching room services:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; roomId: string } }
) {
  try {
    const { id: restaurantId, roomId } = params
    const { name, description, price } = await request.json()
    if (!restaurantId || !roomId || !name || price == null || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }
    const { db } = await connectToDatabase()
    const service = {
      restaurantId,
      roomId,
      name,
      description: description || "",
      price: Number(price),
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const insert = await db.collection("roomServices").insertOne(service)
    const saved = { ...service, _id: insert.insertedId.toString() }
    return NextResponse.json({ success: true, service: saved })
  } catch (error) {
    console.error("Error creating room service:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}


