import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch employees for this hotel
    const employees = await db.collection("users").find({
      restaurantId: id,
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr"] }
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      employees: employees.map(emp => ({
        ...emp,
        _id: emp._id.toString(),
        // Remove sensitive information
        password: undefined
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
    
    if (!decoded || !decoded.userId || !["hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
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

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: employeeData.email })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: "User with this email already exists"
      }, { status: 400 })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(employeeData.password, saltRounds)

    const employee = {
      name: employeeData.name,
      email: employeeData.email,
      password: hashedPassword,
      role: employeeData.role,
      restaurantId: id,
      establishmentName: null,
      establishmentType: null,
      phone: employeeData.phone || "",
      position: employeeData.position || "",
      department: employeeData.department || "",
      hireDate: employeeData.hireDate || null,
      salary: employeeData.salary || "",
      address: employeeData.address || "",
      emergencyContact: employeeData.emergencyContact || "",
      emergencyPhone: employeeData.emergencyPhone || "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("users").insertOne(employee)
    const employeeId = result.insertedId.toString()
    
    // Create payroll data entry if salary is provided
    if (employeeData.salary) {
      const salaryAmount = parseFloat(employeeData.salary) || 0
      const payrollData = {
        employeeId: employeeId,
        employeeName: employeeData.name,
        employeeRole: employeeData.role,
        baseSalary: salaryAmount,
        hourlyRate: salaryAmount / 160, // Assuming 160 hours per month
        overtimeRate: 1.5,
        taxRate: 0.15,
        benefits: ["Health Insurance", "Paid Time Off"],
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
      ...employee, 
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
