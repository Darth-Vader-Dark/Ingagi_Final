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
    
    if (!decoded || !decoded.userId || !["receptionist", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Get user information to populate defaults
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId)
    })

    // Get account settings
    const accountSettings = await db.collection("receptionistAccountSettings").findOne({
      userId: decoded.userId,
      restaurantId: id
    })

    if (!accountSettings) {
      // Return default settings if none exist
      const defaultSettings = {
        personalInfo: {
          firstName: user?.name?.split(' ')[0] || "",
          lastName: user?.name?.split(' ').slice(1).join(' ') || "",
          email: user?.email || decoded.email || "",
          phone: "",
          position: "Receptionist",
          department: "Front Desk",
          employeeId: "",
          hireDate: "",
          emergencyContact: "",
          emergencyPhone: ""
        },
        preferences: {
          language: "en",
          theme: "light",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "12h",
          defaultView: "room-bookings",
          autoLogout: true,
          showNotifications: true,
          soundEnabled: true,
          keyboardShortcuts: true
        },
        security: {
          twoFactorEnabled: false,
          backupCodes: [],
          lastPasswordChange: "",
          loginHistory: [],
          activeSessions: []
        }
      }
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      settings: accountSettings.settings
    })
  } catch (error) {
    console.error("Error fetching account settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch account settings"
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

    // Upsert account settings
    const result = await db.collection("receptionistAccountSettings").updateOne(
      { userId: decoded.userId, restaurantId: id },
      { 
        $set: { 
          userId: decoded.userId,
          restaurantId: id,
          settings: settings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Account settings saved successfully"
    })
  } catch (error) {
    console.error("Error saving account settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to save account settings"
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
    const currentSettings = await db.collection("receptionistAccountSettings").findOne({
      userId: decoded.userId,
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
    await db.collection("receptionistAccountSettings").updateOne(
      { userId: decoded.userId, hotelId: id },
      { 
        $set: { 
          userId: decoded.userId,
          hotelId: id,
          settings: newSettings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: "Account settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating account settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update account settings"
    }, { status: 500 })
  }
}
