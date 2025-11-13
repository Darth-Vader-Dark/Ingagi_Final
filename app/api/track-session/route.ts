import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { action, timestamp } = await request.json()
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    
    const { db } = await connectToDatabase()
    const sessionTime = new Date(timestamp || Date.now())
    const dateStr = sessionTime.toISOString().split('T')[0]
    
    // Get user details
    const user = await db.collection("users").findOne({ _id: decoded.userId })
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    if (action === "login") {
      // Create or update session record
      await db.collection("userSessions").updateOne(
        { 
          userId: decoded.userId, 
          date: dateStr,
          restaurantId: user.restaurantId 
        },
        {
          $set: {
            userId: decoded.userId,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            restaurantId: user.restaurantId,
            date: dateStr,
            loginTime: sessionTime,
            status: "active",
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
      
      // Update user's last login
      await db.collection("users").updateOne(
        { _id: decoded.userId },
        { $set: { lastLogin: sessionTime, updatedAt: new Date() } }
      )
      
    } else if (action === "logout") {
      // Update session with logout time
      await db.collection("userSessions").updateOne(
        { 
          userId: decoded.userId, 
          date: dateStr,
          restaurantId: user.restaurantId 
        },
        {
          $set: {
            logoutTime: sessionTime,
            status: "completed",
            updatedAt: new Date()
          }
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Session ${action} tracked successfully`,
      userId: decoded.userId,
      date: dateStr,
      timestamp: sessionTime
    })
  } catch (error) {
    console.error("Session tracking error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to track session"
    }, { status: 500 })
  }
}
