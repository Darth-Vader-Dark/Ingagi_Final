import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const { db } = await connectToDatabase()
    
    // Build filter query
    const filter: any = {}
    
    if (role && role !== "all") {
      filter.role = role
    }
    
    if (status && status !== "all") {
      filter.isActive = status === "active"
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }

    // Get total count for pagination
    const totalUsers = await db.collection("users").countDocuments(filter)
    
    // Fetch users with pagination
    const users = await db.collection("users")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // Convert ObjectIds to strings and format user data
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      isActive: user.isActive || true,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      phone: user.phone || "",
      // Add additional user information if available
      profile: user.profile || {},
      permissions: user.permissions || {},
      loginAttempts: user.loginAttempts || 0,
      isLocked: user.isLocked || false
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, action, data } = await request.json()
    
    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "User ID and action are required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    let updateData: any = { updatedAt: new Date() }
    
    switch (action) {
      case "activate":
        updateData.isActive = true
        updateData.isLocked = false
        updateData.loginAttempts = 0
        break
        
      case "deactivate":
        updateData.isActive = false
        break
        
      case "changeRole":
        if (!data.role) {
          return NextResponse.json(
            { success: false, error: "New role is required" },
            { status: 400 }
          )
        }
        updateData.role = data.role
        break
        
      case "unlock":
        updateData.isLocked = false
        updateData.loginAttempts = 0
        break
        
      case "resetPassword":
        // In a real app, you'd generate a new password and send it via email
        updateData.passwordResetRequired = true
        updateData.passwordResetToken = Math.random().toString(36).substring(2)
        updateData.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        break
        
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${action} successful`,
      updatedFields: Object.keys(updateData)
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if user exists and get their role
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent deletion of super admin users
    if (user.role === "super_admin") {
      return NextResponse.json(
        { success: false, error: "Cannot delete super admin users" },
        { status: 403 }
      )
    }

    // Soft delete - mark as inactive instead of actually deleting
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully"
    })
  } catch (error) {
    console.error("Error deactivating user:", error)
    return NextResponse.json(
      { success: false, error: "Failed to deactivate user" },
      { status: 500 }
    )
  }
}
