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
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const updatedData = await request.json()

    // Prevent changing password directly via this endpoint
    delete updatedData.password
    delete updatedData.email // Email should not be changed via PUT to avoid conflicts

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(employeeId), restaurantId: id },
      { $set: { ...updatedData, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Employee not found or unauthorized" }, { status: 404 })
    }

    // Update payroll data if salary information is provided
    if (updatedData.salary || updatedData.baseSalary) {
      const salaryAmount = parseFloat(updatedData.salary || updatedData.baseSalary) || 0
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
    if (employee) {
      delete employee.password // Remove password before sending response
    }

    return NextResponse.json({ 
      success: true, 
      employee: { ...employee, _id: employee?._id.toString() },
      message: "Employee updated successfully"
    })
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update employee"
    }, { status: 500 })
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
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("users").deleteOne(
      { _id: new ObjectId(employeeId), restaurantId: id }
    )

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Employee not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Employee deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to delete employee"
    }, { status: 500 })
  }
}
