import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["housekeeping", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const updateData = await request.json()

    const result = await db.collection("cleaningTasks").updateOne(
      { _id: new ObjectId(taskId), restaurantId: id },
      { $set: { ...updateData, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Task not found or unauthorized" }, { status: 404 })
    }

    const task = await db.collection("cleaningTasks").findOne({ _id: new ObjectId(taskId) })

    return NextResponse.json({ 
      success: true, 
      task: { ...task, _id: task?._id.toString() },
      message: "Task updated successfully"
    })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update task"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["housekeeping", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("cleaningTasks").deleteOne(
      { _id: new ObjectId(taskId), restaurantId: id }
    )

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Task not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Task deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete task"
    }, { status: 500 })
  }
}
