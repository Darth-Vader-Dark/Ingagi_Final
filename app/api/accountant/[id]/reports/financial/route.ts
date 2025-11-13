import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

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
    
    // Get current month data
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Calculate revenue from invoices
    const invoices = await db.collection("invoices").find({
      restaurantId: id,
      status: "paid",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).toArray()

    const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)

    // Calculate expenses
    const expenses = await db.collection("expenses").find({
      restaurantId: id,
      status: "paid",
      date: {
        $gte: startOfMonth.toISOString().split('T')[0],
        $lte: endOfMonth.toISOString().split('T')[0]
      }
    }).toArray()

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Calculate payroll expenses
    const payrollData = await db.collection("payrollData").find({
      restaurantId: id,
      status: "paid",
      payPeriod: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).toArray()

    const payrollExpenses = payrollData.reduce((sum, payroll) => sum + payroll.netPay, 0)

    const totalAllExpenses = totalExpenses + payrollExpenses
    const profit = revenue - totalAllExpenses

    // Get settings for tax calculation
    const settings = await db.collection("accountingSettings").findOne({ restaurantId: id })
    const taxRate = settings?.taxRate || 0.18
    const taxOwed = profit * taxRate
    const netIncome = profit - taxOwed

    const report = {
      reportType: "Monthly Financial Report",
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      revenue,
      expenses: totalAllExpenses,
      profit,
      taxOwed,
      netIncome,
      generatedAt: new Date().toISOString(),
      generatedBy: decoded.userId,
      restaurantId: id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("financialReports").insertOne(report)

    return NextResponse.json({
      success: true,
      report: {
        _id: result.insertedId,
        ...report
      },
      message: "Financial report generated successfully"
    })
  } catch (error) {
    console.error("Error generating financial report:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to generate financial report"
    }, { status: 500 })
  }
}
