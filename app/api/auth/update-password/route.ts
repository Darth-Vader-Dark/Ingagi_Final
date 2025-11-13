import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, hashPassword } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email and new password are required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)
    
    // Update the user's password
    const result = await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          password: hashedPassword,
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

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Password was not updated" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
