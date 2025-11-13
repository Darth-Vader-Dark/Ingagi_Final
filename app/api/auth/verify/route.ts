import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, findUserById } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    
    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Get current user data
    const user = await findUserById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is still active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "User account is deactivated" },
        { status: 401 }
      )
    }

    // Enrich with establishment meta when available
    let establishmentName: string | null = null
    let establishmentType: string | null = null
    try {
      if (user.restaurantId && ObjectId.isValid(user.restaurantId)) {
        const { db } = await connectToDatabase()
        const est = await db.collection('establishments').findOne({ _id: new ObjectId(user.restaurantId) })
        if (est) {
          establishmentName = (est as any).name || null
          establishmentType = (est as any).type || null
        }
      }
    } catch (_) {}

    // Remove password from user object and attach meta
    const { password: _, ...userWithoutPassword } = user
    const enrichedUser = {
      ...userWithoutPassword,
      establishmentName,
      establishmentType,
    }

    return NextResponse.json({
      success: true,
      user: enrichedUser,
      message: "Token is valid",
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
