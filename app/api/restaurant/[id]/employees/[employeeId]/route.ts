import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id: restaurantId, employeeId } = await params
    
    if (!ObjectId.isValid(restaurantId) || !ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Fetch employee, ensuring they belong to the specified restaurant
    // Allow access to employees even for unapproved restaurants (manager setup)
    const employee = await db.collection("users").findOne({
      _id: new ObjectId(employeeId),
      restaurantId: restaurantId,
      role: { $ne: "super_admin" }
    })
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      )
    }
    
    // Format employee data (exclude password)
    const { password, ...employeeWithoutPassword } = employee
    const formattedEmployee = {
      ...employeeWithoutPassword,
      _id: employeeWithoutPassword._id.toString()
    }
    
    return NextResponse.json({
      success: true,
      employee: formattedEmployee
    })
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id: restaurantId, employeeId } = await params
    const updateData = await request.json()
    
    if (!ObjectId.isValid(restaurantId) || !ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Verify employee exists and belongs to the restaurant
    // Allow access to employees even for unapproved restaurants (manager setup)
    const existingEmployee = await db.collection("users").findOne({
      _id: new ObjectId(employeeId),
      restaurantId: restaurantId,
      role: { $ne: "super_admin" }
    })
    
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateFields: any = {
      updatedAt: new Date()
    }
    
    // Update basic fields
    if (updateData.name) updateFields.name = updateData.name
    if (updateData.phone) updateFields.phone = updateData.phone
    if (updateData.role) updateFields.role = updateData.role
    if (updateData.image) updateFields.image = updateData.image
    
    // Update password if provided
    if (updateData.password) {
      updateFields.password = await hashPassword(updateData.password)
    }
    
    // Update permissions if role changed
    if (updateData.role) {
      updateFields.permissions = {
        canManageMenu: updateData.role === "manager" || updateData.role === "kitchen",
        canManageEmployees: updateData.role === "manager",
        canViewAnalytics: updateData.role === "manager",
        canManageOrders: updateData.role === "manager" || updateData.role === "waiter" || updateData.role === "kitchen",
        canManageInventory: updateData.role === "manager" || updateData.role === "inventory"
      }
    }
    
    // Update employee
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(employeeId) },
      { $set: updateFields }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      )
    }
    
    // Log the update
    await db.collection("audit_logs").insertOne({
      action: "Employee Updated",
      user: "manager", // This would come from the authenticated user
      target: `Employee: ${updateData.name || existingEmployee.name}`,
      timestamp: new Date(),
      details: `Employee updated in restaurant ${restaurantId}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    })
    
    return NextResponse.json({
      success: true,
      message: "Employee updated successfully"
    })
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update employee" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id: restaurantId, employeeId } = await params
    
    if (!ObjectId.isValid(restaurantId) || !ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Verify employee exists and belongs to the restaurant
    // Allow access to employees even for unapproved restaurants (manager setup)
    const existingEmployee = await db.collection("users").findOne({
      _id: new ObjectId(employeeId),
      restaurantId: restaurantId,
      role: { $ne: "super_admin" }
    })
    
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      )
    }
    
    // Prevent deletion of the manager themselves
    if (existingEmployee.role === "manager") {
      return NextResponse.json(
        { success: false, error: "Cannot delete the restaurant manager" },
        { status: 403 }
      )
    }
    
    // Soft delete - mark as inactive instead of actually deleting
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(employeeId) },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      )
    }
    
    // Log the deletion
    await db.collection("audit_logs").insertOne({
      action: "Employee Deactivated",
      user: "manager", // This would come from the authenticated user
      target: `Employee: ${existingEmployee.name}`,
      timestamp: new Date(),
      details: `Employee deactivated in restaurant ${restaurantId}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    })
    
    return NextResponse.json({
      success: true,
      message: "Employee deactivated successfully"
    })
  } catch (error) {
    console.error("Error deactivating employee:", error)
    return NextResponse.json(
      { success: false, error: "Failed to deactivate employee" },
      { status: 500 }
    )
  }
}
