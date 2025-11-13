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

    // Return detailed user information for debugging
    const userDebug = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      isActive: user.isActive,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Check for any other relevant fields
      hasPassword: !!user.password,
      allFields: Object.keys(user),
      rawData: user
    }

    return NextResponse.json({
      success: true,
      user: userDebug
    })
  } catch (error) {
    console.error("Debug user error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
