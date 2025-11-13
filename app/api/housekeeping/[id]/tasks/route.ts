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
    
    if (!decoded || !decoded.userId || !["housekeeping", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch cleaning tasks for this hotel/restaurant
    const tasks = await db.collection("cleaningTasks").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      tasks: tasks.map(task => ({ 
        ...task, 
        _id: task._id.toString()
      }))
    })
  } catch (error) {
    console.error("Error fetching cleaning tasks:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch cleaning tasks"
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
    
    if (!decoded || !decoded.userId || !["housekeeping", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const taskData = await request.json()

    // Validate required fields
    if (!taskData.roomNumber || !taskData.type || !taskData.assignedTo) {
      return NextResponse.json({
        success: false,
        error: "Room number, type, and assigned to are required"
      }, { status: 400 })
    }

    const newTask = {
      ...taskData,
      restaurantId: id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("cleaningTasks").insertOne(newTask)
    const savedTask = { 
      ...newTask, 
      _id: result.insertedId.toString()
    }

    return NextResponse.json({
      success: true,
      task: savedTask,
      message: "Cleaning task created successfully"
    })
  } catch (error) {
    console.error("Error creating cleaning task:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create cleaning task"
    }, { status: 500 })
  }
}
