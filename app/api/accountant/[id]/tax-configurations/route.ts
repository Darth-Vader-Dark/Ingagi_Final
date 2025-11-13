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
    const taxConfigurations = await db.collection("taxConfigurations").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      taxConfigurations: taxConfigurations.map(tax => ({
        _id: tax._id,
        taxName: tax.taxName,
        taxType: tax.taxType,
        rate: tax.rate,
        applicableTo: tax.applicableTo,
        isActive: tax.isActive,
        createdAt: tax.createdAt,
        updatedAt: tax.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching tax configurations:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch tax configurations"
    }, { status: 500 })
  }
}

export async function POST(
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
    const taxData = await request.json()

    // Validate required fields
    if (!taxData.taxName || !taxData.rate || !taxData.applicableTo) {
      return NextResponse.json({
        success: false,
        error: "Tax name, rate, and applicable categories are required"
      }, { status: 400 })
    }

    const newTax = {
      ...taxData,
      isActive: true,
      restaurantId: id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("taxConfigurations").insertOne(newTax)

    return NextResponse.json({
      success: true,
      taxConfiguration: {
        _id: result.insertedId,
        ...newTax
      },
      message: "Tax configuration created successfully"
    })
  } catch (error) {
    console.error("Error creating tax configuration:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create tax configuration"
    }, { status: 500 })
  }
}
