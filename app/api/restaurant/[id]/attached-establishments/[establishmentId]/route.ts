import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; establishmentId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    if (!decoded || !decoded.userId || !["hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { name, description, type } = await request.json()

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    const updateDoc = {
      name,
      description: description || "",
      type: type || "restaurant",
      updatedAt: new Date()
    }

    const result = await db.collection("attachedEstablishments").updateOne(
      { _id: new ObjectId(params.establishmentId) },
      { $set: updateDoc }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Attached establishment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Establishment updated successfully" })
  } catch (error) {
    console.error("Error updating attached establishment:", error)
    return NextResponse.json({ success: false, error: "Failed to update establishment" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; establishmentId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    if (!decoded || !decoded.userId || !["hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("attachedEstablishments").deleteOne({
      _id: new ObjectId(params.establishmentId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Attached establishment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Establishment deleted successfully" })
  } catch (error) {
    console.error("Error deleting attached establishment:", error)
    return NextResponse.json({ success: false, error: "Failed to delete establishment" }, { status: 500 })
  }
}
