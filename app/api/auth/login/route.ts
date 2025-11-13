import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, comparePassword, generateToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      // Check if there's a status mismatch
      const statusInfo = user.status ? ` (Status: ${user.status})` : ''
      return NextResponse.json(
        { 
          success: false, 
          error: `Account is deactivated${statusInfo}. Please contact your manager or administrator.` 
        },
        { status: 401 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "User account configuration error" },
        { status: 500 }
      )
    }

    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const token = generateToken(user)

    // Optionally load establishment meta for dashboards
    let establishmentName: string | null = null
    let establishmentType: string | null = null
    if (user.restaurantId && ObjectId.isValid(user.restaurantId)) {
      try {
        const { db } = await connectToDatabase()
        const est = await db.collection('establishments').findOne({ _id: new ObjectId(user.restaurantId) })
        if (est) {
          establishmentName = est.name || null
          establishmentType = est.type || null
        }
      } catch (e) {
        // non-fatal
        console.error('Failed to load establishment meta for user session:', e)
      }
    }

    // Ensure all required fields are present
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId || null,
      establishmentName,
      establishmentType,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    console.log("Login successful, returning user:", userResponse)

    return NextResponse.json({
      success: true,
      token,
      user: userResponse,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
