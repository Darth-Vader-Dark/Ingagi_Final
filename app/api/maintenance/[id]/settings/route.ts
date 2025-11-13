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
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch maintenance settings
    const settings = await db.collection("maintenanceSettings").findOne({
      restaurantId: id
    })

    return NextResponse.json({
      success: true,
      settings: settings || {
        autoAssignRequests: true,
        maintenanceSchedule: {
          daily: ["Check HVAC", "Inspect plumbing", "Test emergency systems"],
          weekly: ["Clean filters", "Check electrical panels", "Inspect fire safety"],
          monthly: ["Service equipment", "Deep clean systems", "Safety inspections"],
          quarterly: ["Major equipment service", "System upgrades", "Compliance checks"]
        },
        equipment: ["HVAC", "Plumbing", "Electrical", "Fire Safety", "Security"],
        suppliers: ["ABC Maintenance", "XYZ Services", "Local Electrician"],
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    })
  } catch (error) {
    console.error("Error fetching maintenance settings:", error)
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
    
    if (!decoded || !decoded.userId || !["maintenance", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const settingsData = await request.json()

    const result = await db.collection("maintenanceSettings").updateOne(
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
    console.error("Error updating maintenance settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update settings"
    }, { status: 500 })
  }
}
