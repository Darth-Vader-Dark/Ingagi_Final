import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const updateData = await request.json()
    
    // Validate status if provided
    if (updateData.status && !["pending", "confirmed", "cancelled", "completed"].includes(updateData.status)) {
      return NextResponse.json({
        success: false,
        error: "Invalid status"
      }, { status: 400 })
    }

    // Update booking
    const result = await db.collection("roomBookings").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Booking not found"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully"
    })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update booking"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    
    // Delete booking
    const result = await db.collection("roomBookings").deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Booking not found"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete booking"
    }, { status: 500 })
  }
}
