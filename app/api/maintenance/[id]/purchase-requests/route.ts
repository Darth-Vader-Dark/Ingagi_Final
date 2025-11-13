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

    // Check if user has permission (maintenance, manager, accountant, hr)
    const allowedRoles = ["maintenance", "manager", "accountant", "hr", "super_admin"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()
    const requests = await db.collection("equipmentPurchaseRequests").find({
      restaurantId: id
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      requests
    })
  } catch (error) {
    console.error("Error fetching purchase requests:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Only maintenance staff can create purchase requests
    if (decoded.role !== "maintenance") {
      return NextResponse.json(
        { success: false, error: "Only maintenance staff can create purchase requests" },
        { status: 403 }
      )
    }

    const requestData = await request.json()
    const { 
      equipmentName, 
      description, 
      category, 
      priority, 
      estimatedCost, 
      quantity, 
      vendor, 
      justification 
    } = requestData

    // Validate required fields
    if (!equipmentName || !description || !category || !priority) {
      return NextResponse.json(
        { success: false, error: "Equipment name, description, category, and priority are required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    const purchaseRequest = {
      equipmentName,
      description,
      category,
      priority,
      estimatedCost: estimatedCost || 0,
      quantity: quantity || 1,
      vendor: vendor || "",
      justification: justification || "",
      status: "pending",
      requestedBy: decoded.userId,
      requestedByName: decoded.name,
      restaurantId: id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("equipmentPurchaseRequests").insertOne(purchaseRequest)

    return NextResponse.json({
      success: true,
      request: {
        _id: result.insertedId,
        ...purchaseRequest
      },
      message: "Purchase request created successfully"
    })
  } catch (error) {
    console.error("Error creating purchase request:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
