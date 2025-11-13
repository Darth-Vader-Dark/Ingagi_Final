import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, currentTier, requestedTier, reason } = body
    const { db } = await connectToDatabase()
    
    const upgradeRequest = {
      restaurantId,
      currentTier,
      requestedTier,
      reason,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("subscriptionUpgradeRequests").insertOne(upgradeRequest)
    
    // Log the request for admin review
    console.log(`Subscription upgrade request: ${restaurantId} from ${currentTier} to ${requestedTier}`)
    
    return NextResponse.json({
      success: true,
      message: "Upgrade request submitted successfully",
      requestId: result.insertedId
    })
  } catch (error) {
    console.error("Error creating upgrade request:", error)
    return NextResponse.json(
      { success: false, error: "Failed to submit upgrade request" },
      { status: 500 }
    )
  }
}
