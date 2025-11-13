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
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch employees for this hotel/restaurant
    const employees = await db.collection("users").find({
      restaurantId: id,
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr"] }
    }).toArray()

    return NextResponse.json({
      success: true,
      employees: employees.map(emp => ({ 
        ...emp, 
        _id: emp._id.toString(),
        password: undefined // Remove password from response
      }))
    })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch employees"
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
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const employeeData = await request.json()

    // Validate required fields
    if (!employeeData.name || !employeeData.email || !employeeData.password || !employeeData.role) {
      return NextResponse.json({
        success: false,
        error: "Name, email, password, and role are required"
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email: employeeData.email })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: "Email already registered"
      }, { status: 409 })
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(employeeData.password, saltRounds)

    const newEmployee = {
      ...employeeData,
      password: hashedPassword,
      restaurantId: id,
      establishmentName: decoded.establishmentName,
      establishmentType: "hotel",
      isActive: true,
      createdBy: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("users").insertOne(newEmployee)
    const employeeId = result.insertedId.toString()
    
    // Create payroll data entry if salary is provided
    if (employeeData.salary || employeeData.baseSalary) {
      const payrollData = {
        employeeId: employeeId,
        employeeName: employeeData.name,
        employeeRole: employeeData.role,
        baseSalary: employeeData.salary || employeeData.baseSalary || 0,
        hourlyRate: employeeData.hourlyRate || (employeeData.salary || 0) / 160, // Assuming 160 hours per month
        overtimeRate: employeeData.overtimeRate || 1.5,
        taxRate: employeeData.taxRate || 0.15,
        benefits: employeeData.benefits || ["Health Insurance", "Paid Time Off"],
        payPeriod: new Date().toISOString().split('T')[0],
        regularHours: 0,
        overtimeHours: 0,
        grossPay: 0,
        deductions: 0,
        netPay: 0,
        status: "pending",
        restaurantId: id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection("payrollData").insertOne(payrollData)
    }
    
    const savedEmployee = { 
      ...newEmployee, 
      _id: employeeId,
      password: undefined // Remove password from response
    }

    return NextResponse.json({
      success: true,
      employee: savedEmployee,
      message: "Employee created successfully"
    })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create employee"
    }, { status: 500 })
  }
}
