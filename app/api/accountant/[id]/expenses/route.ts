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
    const expenses = await db.collection("expenses").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      expenses: expenses.map(expense => ({
        _id: expense._id,
        vendorName: expense.vendorName,
        vendorEmail: expense.vendorEmail,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        status: expense.status,
        receiptNumber: expense.receiptNumber,
        date: expense.date,
        approvedBy: expense.approvedBy,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch expenses"
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
    const expenseData = await request.json()

    // Validate required fields
    if (!expenseData.vendorName || !expenseData.amount || !expenseData.category) {
      return NextResponse.json({
        success: false,
        error: "Vendor name, amount, and category are required"
      }, { status: 400 })
    }

    const newExpense = {
      ...expenseData,
      restaurantId: id,
      status: expenseData.status || "pending",
      approvedBy: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("expenses").insertOne(newExpense)

    return NextResponse.json({
      success: true,
      expense: {
        _id: result.insertedId,
        ...newExpense
      },
      message: "Expense added successfully"
    })
  } catch (error) {
    console.error("Error adding expense:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to add expense"
    }, { status: 500 })
  }
}
