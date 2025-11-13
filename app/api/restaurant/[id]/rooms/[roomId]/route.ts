import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const { id, roomId } = await params
    const restaurantId = id
    const roomData = await request.json()

    if (!restaurantId || !roomId || !roomData.type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    
    // Check if room exists
    const existingRoom = await db.collection("rooms").findOne({
      _id: new ObjectId(roomId),
      $or: [{ restaurantId }, { hotelId: restaurantId }]
    })

    if (!existingRoom) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    const updatedRoom = {
      ...existingRoom,
      number: roomData.number || existingRoom.number,
      type: roomData.type,
      price: roomData.price || existingRoom.price,
      description: roomData.description || existingRoom.description,
      maxOccupancy: roomData.maxOccupancy || existingRoom.maxOccupancy,
      bedType: roomData.bedType || existingRoom.bedType,
      roomSize: roomData.roomSize || existingRoom.roomSize,
      services: roomData.services || existingRoom.services,
      amenities: roomData.amenities || existingRoom.amenities,
      photos: roomData.photos || existingRoom.photos,
      image: roomData.image || (roomData.photos && roomData.photos[0]) || existingRoom.image,
      updatedAt: new Date(),
    }

    const result = await db.collection("rooms").updateOne(
      { _id: new ObjectId(roomId) },
      { $set: updatedRoom }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to update room" }, { status: 500 })
    }

    const savedRoom = { ...updatedRoom, _id: roomId }
    return NextResponse.json({ success: true, room: savedRoom })
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const { id, roomId } = await params
    const restaurantId = id

    if (!restaurantId || !roomId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    
    // Check if room exists
    const existingRoom = await db.collection("rooms").findOne({
      _id: new ObjectId(roomId),
      $or: [{ restaurantId }, { hotelId: restaurantId }]
    })

    if (!existingRoom) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    const result = await db.collection("rooms").deleteOne({
      _id: new ObjectId(roomId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to delete room" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Room deleted successfully" })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}