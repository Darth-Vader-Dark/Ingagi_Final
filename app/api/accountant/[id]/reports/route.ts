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
    const reports = await db.collection("financialReports").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        _id: report._id,
        reportType: report.reportType,
        period: report.period,
        startDate: report.startDate,
        endDate: report.endDate,
        revenue: report.revenue,
        expenses: report.expenses,
        profit: report.profit,
        taxOwed: report.taxOwed,
        netIncome: report.netIncome,
        generatedAt: report.generatedAt,
        generatedBy: report.generatedBy
      }))
    })
  } catch (error) {
    console.error("Error fetching financial reports:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch financial reports"
    }, { status: 500 })
  }
}
