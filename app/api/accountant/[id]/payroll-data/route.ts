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
    const { startDate, endDate } = Object.fromEntries(new URL(request.url).searchParams)

    // Get employees
    const employees = await db.collection("users").find({
      restaurantId: id,
      isActive: true,
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr", "manager"] }
    }).toArray()

    // Get payroll data from accountant dashboard
    const payrollData = await db.collection("payrollData").find({
      restaurantId: id,
      ...(startDate && endDate ? {
        payPeriod: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } : {})
    }).toArray()

    // If no payroll data exists, create default structure
    if (payrollData.length === 0) {
      const defaultPayrollData = employees.map(emp => ({
        employeeId: emp._id,
        employeeName: emp.name,
        employeeRole: emp.role,
        baseSalary: emp.role === "manager" ? 5000 : emp.role === "hr" ? 4000 : emp.role === "receptionist" ? 3000 : 2500,
        hourlyRate: emp.role === "manager" ? 25 : emp.role === "hr" ? 20 : emp.role === "receptionist" ? 15 : 12.5,
        overtimeRate: 1.5,
        taxRate: 0.15,
        benefits: ["Health Insurance", "Paid Time Off"],
        payPeriod: new Date(),
        restaurantId: id,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      // Insert default payroll data
      if (defaultPayrollData.length > 0) {
        await db.collection("payrollData").insertMany(defaultPayrollData)
        payrollData.push(...defaultPayrollData)
      }
    }

    return NextResponse.json({
      success: true,
      payrollData: payrollData.map(pay => ({
        _id: pay._id,
        employeeId: pay.employeeId,
        employeeName: pay.employeeName,
        employeeRole: pay.employeeRole,
        baseSalary: pay.baseSalary,
        hourlyRate: pay.hourlyRate,
        overtimeRate: pay.overtimeRate,
        taxRate: pay.taxRate,
        benefits: pay.benefits,
        payPeriod: pay.payPeriod
      }))
    })
  } catch (error) {
    console.error("Error fetching payroll data:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch payroll data"
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
    const payrollData = await request.json()

    // Validate required fields
    if (!payrollData.employeeId || !payrollData.baseSalary || !payrollData.hourlyRate) {
      return NextResponse.json({
        success: false,
        error: "Employee ID, base salary, and hourly rate are required"
      }, { status: 400 })
    }

    const newPayrollData = {
      ...payrollData,
      restaurantId: id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("payrollData").insertOne(newPayrollData)

    return NextResponse.json({
      success: true,
      payrollData: {
        _id: result.insertedId,
        ...newPayrollData
      },
      message: "Payroll data created successfully"
    })
  } catch (error) {
    console.error("Error creating payroll data:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create payroll data"
    }, { status: 500 })
  }
}
