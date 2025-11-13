import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["housekeeping", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch housekeeping settings
    const settings = await db.collection("housekeepingSettings").findOne({
      restaurantId: id
    })

    return NextResponse.json({
      success: true,
      settings: settings || {
        autoAssignTasks: true,
        cleaningSchedule: {
          standard: 1,
          deep: 3,
          checkout: 2,
          maintenance: 4
        },
        supplies: ["Towels", "Soap", "Toilet Paper", "Trash Bags", "Cleaning Spray"],
        checklist: ["Bathroom", "Bed", "Floor", "Windows", "Furniture"],
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    })
  } catch (error) {
    console.error("Error fetching housekeeping settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch settings"
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["housekeeping", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const settingsData = await request.json()

    const result = await db.collection("housekeepingSettings").updateOne(
      { restaurantId: id },
      { 
        $set: { 
          ...settingsData, 
          restaurantId: id,
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating housekeeping settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update settings"
    }, { status: 500 })
  }
}
