import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch shifts for this hotel
    const shifts = await db.collection("shifts").find({
      restaurantId: id
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      shifts: shifts.map(shift => ({
        ...shift,
        _id: shift._id.toString()
      }))
    })
  } catch (error) {
    console.error("Error fetching shifts:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch shifts"
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
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const shiftData = await request.json()

    // Validate required fields
    if (!shiftData.name || !shiftData.role || !shiftData.startTime || !shiftData.endTime) {
      return NextResponse.json({
        success: false,
        error: "Name, role, start time, and end time are required"
      }, { status: 400 })
    }

    const shift = {
      ...shiftData,
      restaurantId: id,
      assignedEmployees: [],
      isActive: true,
      createdBy: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("shifts").insertOne(shift)
    const savedShift = { 
      ...shift, 
      _id: result.insertedId.toString()
    }

    return NextResponse.json({
      success: true,
      shift: savedShift,
      message: "Shift created successfully"
    })
  } catch (error) {
    console.error("Error creating shift:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create shift"
    }, { status: 500 })
  }
}
