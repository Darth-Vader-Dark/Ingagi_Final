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
    const settings = await db.collection("accountingSettings").findOne({ restaurantId: id })

    if (!settings) {
      // Create default settings
      const defaultSettings = {
        currency: "RWF",
        taxRate: 0.18,
        invoicePrefix: "INV",
        paymentTerms: 30,
        lateFeeRate: 0.05,
        expenseCategories: ["Office Supplies", "Utilities", "Marketing", "Travel", "Equipment"],
        paymentMethods: ["Cash", "Bank Transfer", "Credit Card", "Check"],
        fiscalYearStart: "2025-01-01",
        reportingPeriod: "monthly",
        autoBackup: true,
        emailNotifications: true,
        smsNotifications: false,
        restaurantId: id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection("accountingSettings").insertOne(defaultSettings)
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        currency: settings.currency,
        taxRate: settings.taxRate,
        invoicePrefix: settings.invoicePrefix,
        paymentTerms: settings.paymentTerms,
        lateFeeRate: settings.lateFeeRate,
        expenseCategories: settings.expenseCategories,
        paymentMethods: settings.paymentMethods,
        fiscalYearStart: settings.fiscalYearStart,
        reportingPeriod: settings.reportingPeriod,
        autoBackup: settings.autoBackup,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications
      }
    })
  } catch (error) {
    console.error("Error fetching accounting settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch accounting settings"
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
    const settingsData = await request.json()

    const updatedSettings = {
      ...settingsData,
      restaurantId: id,
      updatedAt: new Date()
    }

    await db.collection("accountingSettings").updateOne(
      { restaurantId: id },
      { $set: updatedSettings },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Accounting settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating accounting settings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update accounting settings"
    }, { status: 500 })
  }
}
