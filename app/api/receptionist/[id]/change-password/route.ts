import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["receptionist", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: "Current password and new password are required"
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: "New password must be at least 8 characters long"
      }, { status: 400 })
    }

    // Find user and verify current password
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId)
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        error: "Current password is incorrect"
      }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      }
    )

    // Update account settings to reflect password change
    await db.collection("receptionistAccountSettings").updateOne(
      { userId: decoded.userId, hotelId: id },
      { 
        $set: { 
          "settings.security.lastPasswordChange": new Date().toISOString(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Password changed successfully"
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to change password"
    }, { status: 500 })
  }
}
