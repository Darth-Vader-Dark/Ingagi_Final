import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, findUserById, findUserByEmail, hashPassword, createUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Check if user has permission to register employees
    if (decoded.role !== "manager" && decoded.role !== "restaurant_admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { email, password, name, role, restaurantId } = await request.json()

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["waiter", "receptionist", "kitchen", "inventory"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role specified" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create employee user
    const employee = await createUser({
      email,
      password: hashedPassword,
      name,
      role: role as any,
      restaurantId: restaurantId || decoded.restaurantId,
      phone: "",
    })

    // Remove password from user object before sending
    const { password: _, ...employeeWithoutPassword } = employee

    return NextResponse.json({
      success: true,
      employee: employeeWithoutPassword,
      message: "Employee registered successfully",
    })
  } catch (error) {
    console.error("Employee registration error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
