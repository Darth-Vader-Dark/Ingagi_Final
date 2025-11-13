import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get("approved")
    const type = searchParams.get("type")
    const location = searchParams.get("location")

    const { db } = await connectToDatabase()
    
    // Build filter
    const filter: any = {}
    if (approved !== null) {
      filter.isApproved = approved === "true"
    }
    if (type) {
      filter.type = type
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" }
    }

    const establishments = await db.collection("establishments")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    // Convert ObjectIds to strings
    const establishmentsWithStringIds = establishments.map(establishment => ({
      ...establishment,
      _id: establishment._id.toString()
    }))

    return NextResponse.json({
      success: true,
      establishments: establishmentsWithStringIds,
      count: establishmentsWithStringIds.length
    })
  } catch (error) {
    console.error("Error fetching establishments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch establishments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const establishmentData = await request.json()
    
    // Validate required fields
    const requiredFields = ["name", "description", "type", "location", "phone", "email", "ownerId"]
    for (const field of requiredFields) {
      if (!establishmentData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const { db } = await connectToDatabase()
    
    // Check if establishment with same name already exists
    const existingEstablishment = await db.collection("establishments").findOne({
      name: { $regex: new RegExp(`^${establishmentData.name}$`, "i") }
    })

    if (existingEstablishment) {
      return NextResponse.json(
        { success: false, error: "Establishment with this name already exists" },
        { status: 409 }
      )
    }

    // Create establishment
    const establishment = {
      ...establishmentData,
      isApproved: false, // Requires admin approval
      isPremium: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("establishments").insertOne(establishment)
    establishment._id = result.insertedId.toString()

    return NextResponse.json({
      success: true,
      establishment,
      message: "Establishment created successfully. Pending approval."
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating establishment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create establishment" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Establishment ID is required" },
        { status: 400 }
      )
    }

    const updateData = await request.json()
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid establishment ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Update establishment
    const result = await db.collection("establishments").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Establishment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Establishment updated successfully",
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error("Error updating establishment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update establishment" },
      { status: 500 }
    )
  }
}
