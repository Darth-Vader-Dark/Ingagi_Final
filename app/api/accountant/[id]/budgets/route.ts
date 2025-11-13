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
    const budgets = await db.collection("budgets").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      budgets: budgets.map(budget => ({
        _id: budget._id,
        budgetName: budget.budgetName,
        category: budget.category,
        allocatedAmount: budget.allocatedAmount,
        spentAmount: budget.spentAmount,
        remainingAmount: budget.remainingAmount,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        status: budget.status,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch budgets"
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
    const budgetData = await request.json()

    // Validate required fields
    if (!budgetData.budgetName || !budgetData.allocatedAmount || !budgetData.category) {
      return NextResponse.json({
        success: false,
        error: "Budget name, allocated amount, and category are required"
      }, { status: 400 })
    }

    const newBudget = {
      ...budgetData,
      spentAmount: 0,
      remainingAmount: budgetData.allocatedAmount,
      status: "active",
      restaurantId: id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("budgets").insertOne(newBudget)

    return NextResponse.json({
      success: true,
      budget: {
        _id: result.insertedId,
        ...newBudget
      },
      message: "Budget created successfully"
    })
  } catch (error) {
    console.error("Error creating budget:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create budget"
    }, { status: 500 })
  }
}
