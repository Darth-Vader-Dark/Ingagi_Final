import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Helper function to generate a random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Fetch real employees from the users collection, filtered by restaurantId
    // Allow access to employees even for unapproved restaurants (manager setup)
    const employees = await db.collection("users")
      .find({ 
        restaurantId: id,
        role: { $ne: "super_admin" } // Exclude super admins
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Format employee data for the frontend
    const formattedEmployees = employees.map(employee => ({
      _id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      phone: employee.phone || "",
      image: employee.image || "",
      status: employee.isActive ? "active" : "inactive",
      isActive: employee.isActive,
      lastLogin: employee.lastLogin,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      permissions: employee.permissions || {}
    }))

    return NextResponse.json({
      success: true,
      employees: formattedEmployees
    })
  } catch (error) {
    console.error("Error fetching restaurant employees:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch restaurant employees" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const { name, email, phone, role, password, image } = await request.json()
    
    if (!restaurantId || !name || !email || !role || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)
    
    // Create employee
    const employee = {
      name,
      email,
      phone: phone || "",
      role,
      restaurantId,
      password: hashedPassword,
      image: image || "",
      isActive: true,
      status: 'active', // Ensure status is also set
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: {
        canManageMenu: role === "manager" || role === "kitchen",
        canManageEmployees: role === "manager",
        canViewAnalytics: role === "manager",
        canManageOrders: role === "manager" || role === "waiter" || role === "kitchen",
        canManageInventory: role === "manager" || role === "inventory"
      }
    }
    
    const result = await db.collection("users").insertOne(employee)
    employee._id = result.insertedId.toString()
    
    // Remove password from response
    const { password: _, ...employeeWithoutPassword } = employee
    
    return NextResponse.json({
      success: true,
      employee: employeeWithoutPassword
    })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const { employeeId, action, ...updateData } = await request.json()
    
    if (!restaurantId || !employeeId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if employee exists and belongs to this restaurant
    const employee = await db.collection("users").findOne({ 
      _id: new ObjectId(employeeId),
      restaurantId: restaurantId
    })
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found or access denied" },
        { status: 404 }
      )
    }

    // Handle password reset action
    if (action === 'resetPassword') {
      // Generate new random password
      const newPassword = generateRandomPassword()
      const hashedPassword = await hashPassword(newPassword)
      
      // Update employee password
      const result = await db.collection("users").updateOne(
        { _id: new ObjectId(employeeId) },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date(),
            passwordResetAt: new Date()
          } 
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Password reset successfully",
        newPassword: newPassword
      })
    }

    // Handle regular updates
    // Ensure isActive and status are synchronized
    let updateFields = { ...updateData, updatedAt: new Date() }
    
    // If isActive is being updated, also update status
    if (updateData.hasOwnProperty('isActive')) {
      updateFields.status = updateData.isActive ? 'active' : 'inactive'
    }
    
    // If status is being updated, also update isActive
    if (updateData.hasOwnProperty('status')) {
      updateFields.isActive = updateData.status === 'active'
    }
    
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(employeeId) },
      { 
        $set: updateFields
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully"
    })
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const { employeeId } = await request.json()
    
    if (!restaurantId || !employeeId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if employee exists and belongs to this restaurant
    const employee = await db.collection("users").findOne({ 
      _id: new ObjectId(employeeId),
      restaurantId: restaurantId
    })
    
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found or access denied" },
        { status: 404 }
      )
    }

    // Soft delete - mark as inactive instead of removing
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(employeeId) },
      { 
        $set: { 
          isActive: false,
          status: 'deleted',
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

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
