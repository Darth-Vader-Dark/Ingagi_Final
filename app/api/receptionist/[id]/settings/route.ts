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
    
    if (!decoded || !decoded.userId || !["receptionist", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Get receptionist settings
    const settings = await db.collection("receptionistSettings").findOne({
      restaurantId: id
    })

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        notifications: {
          newBookings: true,
          checkIns: true,
          checkOuts: true,
          roomService: true,
          urgentRequests: true,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        },
        hotel: {
          name: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          timezone: "Africa/Kigali",
          currency: "RWF",
          checkInTime: "15:00",
          checkOutTime: "11:00",
          lateCheckOutFee: 50000,
          cancellationPolicy: "Free cancellation up to 24 hours before check-in",
          wifiPassword: "",
          emergencyContact: "",
          amenities: []
        },
        reception: {
          autoApproveBookings: false,
          requireGuestID: true,
          allowEarlyCheckIn: false,
          allowLateCheckOut: false,
          maxGuestsPerRoom: 4,
          defaultRoomServiceTime: 30,
          housekeepingSchedule: "08:00",
          maintenanceRequests: true,
          guestFeedback: true,
          loyaltyProgram: false
        },
        security: {
          requirePhotoID: true,
          trackGuestAccess: true,
          monitorCommonAreas: true,
          emergencyProcedures: true,
          guestDataRetention: 365,
          twoFactorAuth: false,
          sessionTimeout: 30,
          auditLogs: true
        }
      }
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      settings: settings.settings
    })
  } catch (error) {
    console.error("Error fetching receptionist settings:", error)
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
    
    if (!decoded || !decoded.userId || !["receptionist", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const settings = await request.json()

    // Upsert settings
    const result = await db.collection("receptionistSettings").updateOne(
      { restaurantId: id },
      { 
        $set: { 
          restaurantId: id,
          settings: settings,
          updatedAt: new Date(),
          updatedBy: decoded.userId
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully"
    })
  } catch (error) {
    console.error("Error saving receptionist settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to save settings"
    }, { status: 500 })
  }
}

export async function PATCH(
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
    const { category, updates } = await request.json()

    if (!category || !updates) {
      return NextResponse.json({
        success: false,
        error: "Category and updates are required"
      }, { status: 400 })
    }

    // Get current settings
    const currentSettings = await db.collection("receptionistSettings").findOne({
      hotelId: id
    })

    let newSettings = currentSettings?.settings || {}
    
    // Update specific category
    newSettings = {
      ...newSettings,
      [category]: {
        ...newSettings[category],
        ...updates
      }
    }

    // Save updated settings
    await db.collection("receptionistSettings").updateOne(
      { hotelId: id },
      { 
        $set: { 
          hotelId: id,
          settings: newSettings,
          updatedAt: new Date(),
          updatedBy: decoded.userId
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating receptionist settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update settings"
    }, { status: 500 })
  }
}
