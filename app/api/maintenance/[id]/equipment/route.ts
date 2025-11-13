import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch equipment for this hotel/restaurant
    const equipment = await db.collection("equipment").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      equipment: equipment.map(item => ({ 
        ...item, 
        _id: item._id.toString()
      }))
    })
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch equipment"
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const equipmentData = await request.json()

    // Validate required fields
    if (!equipmentData.name || !equipmentData.type || !equipmentData.location) {
      return NextResponse.json({
        success: false,
        error: "Name, type, and location are required"
      }, { status: 400 })
    }

    const newEquipment = {
      ...equipmentData,
      restaurantId: id,
      status: "operational",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("equipment").insertOne(newEquipment)
    const savedEquipment = { 
      ...newEquipment, 
      _id: result.insertedId.toString()
    }

    return NextResponse.json({
      success: true,
      equipment: savedEquipment,
      message: "Equipment added successfully"
    })
  } catch (error) {
    console.error("Error adding equipment:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to add equipment"
    }, { status: 500 })
  }
}
