import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id, employeeId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const updateData = await request.json()

    // Validate required fields
    if (!updateData.name || !updateData.email || !updateData.role) {
      return NextResponse.json({
        success: false,
        error: "Name, email, and role are required"
      }, { status: 400 })
    }

    // Check if email is being changed and if it already exists
    if (updateData.email) {
      const existingUser = await db.collection("users").findOne({ 
        email: updateData.email,
        _id: { $ne: new ObjectId(employeeId) }
      })
      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: "User with this email already exists"
        }, { status: 400 })
      }
    }

    const updatedEmployee = {
      ...updateData,
      updatedAt: new Date()
    }

    // Remove password from update if it's empty or not provided
    if (!updateData.password) {
      delete updatedEmployee.password
    }

    // Ensure _id is not updated
    delete updatedEmployee._id

    const result = await db.collection("users").updateOne(
      { 
        _id: new ObjectId(employeeId),
        restaurantId: id,
        role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr"] }
      },
      { $set: updatedEmployee }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Employee not found or unauthorized" }, { status: 404 })
    }

    // Update payroll data if salary information is provided
    if (updateData.salary) {
      const salaryAmount = parseFloat(updateData.salary) || 0
      const payrollUpdate = {
        baseSalary: salaryAmount,
        hourlyRate: salaryAmount / 160, // Assuming 160 hours per month
        updatedAt: new Date()
      }
      
      await db.collection("payrollData").updateOne(
        { employeeId: employeeId, restaurantId: id },
        { $set: payrollUpdate }
      )
    }

    const employee = await db.collection("users").findOne({ _id: new ObjectId(employeeId) })

    return NextResponse.json({ 
      success: true, 
      employee: { 
        ...employee, 
        _id: employee?._id.toString(),
        password: undefined // Remove password from response
      },
      message: "Employee updated successfully"
    })
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json({ success: false, error: "Failed to update employee" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id, employeeId } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(employeeId),
      restaurantId: id,
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr"] }
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Employee not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 })
  }
}
