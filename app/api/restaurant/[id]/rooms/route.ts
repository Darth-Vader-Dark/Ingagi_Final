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
      return NextResponse.json({ success: false, error: "Establishment ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const rooms = await db.collection("rooms").find({ 
      $or: [{ restaurantId }, { hotelId: restaurantId }] 
    }).toArray()
    const result = rooms.map(r => ({ ...r, _id: r._id.toString() }))
    return NextResponse.json({ success: true, rooms: result })
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurantId = id
    const roomData = await request.json()

    if (!restaurantId || !roomData.type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const room = {
      restaurantId,
      hotelId: restaurantId, // Also add hotelId for hotel pages
      number: roomData.number || `Room-${Date.now()}`,
      type: roomData.type,
      price: roomData.price || 0,
      description: roomData.description || "",
      maxOccupancy: roomData.maxOccupancy || 2,
      bedType: roomData.bedType || "Double",
      roomSize: roomData.roomSize || "",
      services: roomData.services || [],
      amenities: roomData.amenities || [],
      photos: roomData.photos || [],
      image: roomData.image || (roomData.photos && roomData.photos[0]) || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const insert = await db.collection("rooms").insertOne(room)
    const saved = { ...room, _id: insert.insertedId.toString() }
    return NextResponse.json({ success: true, room: saved })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}


