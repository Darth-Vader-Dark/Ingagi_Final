import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid establishment ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    const establishment = await db.collection("establishments").findOne({
      _id: new ObjectId(id)
    })

    if (!establishment) {
      return NextResponse.json(
        { success: false, error: "Establishment not found" },
        { status: 404 }
      )
    }

    // Convert ObjectId to string
    const establishmentWithStringId = {
      ...establishment,
      _id: establishment._id.toString()
    }

    return NextResponse.json({
      success: true,
      establishment: establishmentWithStringId
    })
  } catch (error) {
    console.error("Error fetching establishment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch establishment" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid establishment ID" },
        { status: 400 }
      )
    }

    const updateData = await request.json()
    
    const { db } = await connectToDatabase()
    
    // Update establishment
    const result = await db.collection("establishments").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Establishment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Establishment updated successfully",
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error("Error updating establishment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update establishment" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid establishment ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Delete establishment
    const result = await db.collection("establishments").deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Establishment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Establishment deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting establishment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete establishment" },
      { status: 500 }
    )
  }
}
