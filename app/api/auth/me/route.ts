import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: decoded.userId })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if the user's restaurantId exists
    let establishment = null
    if (user.restaurantId) {
      establishment = await db.collection("establishments").findOne({ 
        _id: user.restaurantId 
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        isActive: user.isActive,
        salary: user.salary || null
      },
      establishment: establishment ? {
        _id: establishment._id,
        name: establishment.name,
        type: establishment.type,
        isApproved: establishment.isApproved
      } : null,
      establishmentExists: !!establishment
    })
  } catch (error) {
    console.error("Error in /api/auth/me:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
