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

    if (!decoded || !decoded.userId || !["accountant", "manager", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const accountSettings = await db.collection("accountantAccountSettings").findOne({ 
      restaurantId: id,
      userId: decoded.userId 
    })

    if (!accountSettings) {
      // Create default account settings
      const defaultSettings = {
        firstName: user.name?.split(' ')[0] || "",
        lastName: user.name?.split(' ')[1] || "",
        email: user.email,
        phone: "",
        address: "",
        city: "",
        country: "Rwanda",
        timezone: "Africa/Kigali",
        language: "en",
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90
        },
        restaurantId: id,
        userId: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection("accountantAccountSettings").insertOne(defaultSettings)
      return NextResponse.json({
        success: true,
        accountSettings: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      accountSettings: {
        firstName: accountSettings.firstName,
        lastName: accountSettings.lastName,
        email: accountSettings.email,
        phone: accountSettings.phone,
        address: accountSettings.address,
        city: accountSettings.city,
        country: accountSettings.country,
        timezone: accountSettings.timezone,
        language: accountSettings.language,
        notifications: accountSettings.notifications,
        security: accountSettings.security
      }
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

    if (!decoded || !decoded.userId || !["accountant", "manager", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const accountSettingsData = await request.json()

    const updatedSettings = {
      ...accountSettingsData,
      restaurantId: id,
      userId: decoded.userId,
      updatedAt: new Date()
    }

    await db.collection("accountantAccountSettings").updateOne(
      { restaurantId: id, userId: decoded.userId },
      { $set: updatedSettings },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      accountSettings: updatedSettings,
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
