import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Check if establishments collection exists and has data
    const establishments = await db.collection("establishments").find({}).toArray()
    const users = await db.collection("users").find({}).toArray()
    
    return NextResponse.json({
      success: true,
      data: {
        establishmentsCount: establishments.length,
        usersCount: users.length,
        establishments: establishments.map(e => ({
          _id: e._id,
          customId: e.customId || 'N/A',
          name: e.name,
          type: e.type,
          isApproved: e.isApproved
        })),
        users: users.map(u => ({
          _id: u._id,
          customId: u.customId || 'N/A',
          name: u.name,
          email: u.email,
          role: u.role,
          restaurantId: u.restaurantId
        }))
      }
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
