import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Find user by email
    const user = await db.collection("users").findOne({ email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Fix the user account by ensuring isActive is true and status is active
    const result = await db.collection("users").updateOne(
      { email },
      { 
        $set: { 
          isActive: true,
          status: 'active',
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Get updated user data
    const updatedUser = await db.collection("users").findOne({ email })
    
    return NextResponse.json({
      success: true,
      message: "User account reactivated successfully",
      user: {
        _id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        status: updatedUser.status
      }
    })
  } catch (error) {
    console.error("Fix user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
