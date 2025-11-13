import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch HR settings for this hotel
    let settings = await db.collection("hrSettings").findOne({
      restaurantId: id
    })

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        restaurantId: id,
        notifications: {
          newHires: true,
          attendanceAlerts: true,
          scheduleChanges: true,
          payrollReminders: true,
          emailNotifications: true,
          smsNotifications: false
        },
        attendance: {
          autoClockOut: false,
          lateThreshold: 15,
          overtimeThreshold: 8,
          requireNotes: false,
          allowSelfCheckIn: true
        },
        payroll: {
          payPeriod: "monthly",
          overtimeRate: 1.5,
          currency: "RWF",
          taxRate: 0.15,
          benefits: []
        },
        policies: {
          vacationDays: 21,
          sickDays: 7,
          personalDays: 3,
          probationPeriod: 90,
          noticePeriod: 30
        },
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await db.collection("hrSettings").insertOne(defaultSettings)
      settings = { ...defaultSettings, _id: result.insertedId }
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        _id: settings._id.toString()
      }
    })
  } catch (error) {
    console.error("Error fetching HR settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch HR settings"
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
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const settingsData = await request.json()

    // Update or create HR settings
    const result = await db.collection("hrSettings").replaceOne(
      { restaurantId: id },
      {
        restaurantId: id,
        ...settingsData,
        updatedBy: decoded.userId,
        updatedAt: new Date()
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "HR settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating HR settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update HR settings"
    }, { status: 500 })
  }
}
