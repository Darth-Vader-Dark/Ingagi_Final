import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const establishments = await db.collection("attachedEstablishments").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({ 
      success: true, 
      establishments: establishments.map(est => ({
        id: est._id.toString(),
        type: est.type,
        name: est.name,
        description: est.description,
        status: est.status,
        createdAt: est.createdAt
      }))
    })
  } catch (error) {
    console.error("Error fetching attached establishments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch establishments" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is hotel manager or restaurant admin for this hotel
    if (user.role !== "hotel_manager" && user.role !== "manager" && user.role !== "restaurant_admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    if (user.restaurantId !== id) {
      return NextResponse.json({ success: false, error: "Unauthorized for this hotel" }, { status: 403 })
    }

    const body = await request.json()
    const { type, name, description } = body

    if (!type || !name) {
      return NextResponse.json({ success: false, error: "Type and name are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const establishment = {
      restaurantId: id,
      type,
      name,
      description: description || "",
      status: "pending",
      createdAt: new Date(),
      requestedBy: user.id
    }

    const result = await db.collection("attachedEstablishments").insertOne(establishment)

    return NextResponse.json({ 
      success: true, 
      establishment: {
        id: result.insertedId.toString(),
        type,
        name,
        description,
        status: "pending"
      }
    })
  } catch (error) {
    console.error("Error creating attached establishment:", error)
    return NextResponse.json({ success: false, error: "Failed to create establishment" }, { status: 500 })
  }
}
