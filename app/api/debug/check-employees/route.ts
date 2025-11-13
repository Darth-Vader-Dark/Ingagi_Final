import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get all users to see what's in the database
    const allUsers = await db.collection("users").find({}).toArray()
    
    // Get users with hotel staff roles
    const hotelStaff = await db.collection("users").find({
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr"] }
    }).toArray()
    
    // Get users for the specific hotel (68e10acfc5f1c3b6bcbf17f7)
    const hotelUsers = await db.collection("users").find({
      restaurantId: "68e10acfc5f1c3b6bcbf17f7"
    }).toArray()
    
    return NextResponse.json({
      success: true,
      data: {
        allUsers: allUsers.map(user => ({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          isActive: user.isActive
        })),
        hotelStaff: hotelStaff.map(user => ({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          isActive: user.isActive
        })),
        hotelUsers: hotelUsers.map(user => ({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          isActive: user.isActive
        }))
      }
    })
  } catch (error) {
    console.error("Error checking employees:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to check employees"
    }, { status: 500 })
  }
}
