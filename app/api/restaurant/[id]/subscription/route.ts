import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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
    
    // Fetch real subscription data from the establishments collection
    // Allow unapproved restaurants for manager dashboard access
    const establishment = await db.collection("establishments").findOne({
      _id: new ObjectId(id)
    })
    
    if (!establishment) {
      console.log(`Subscription: Restaurant not found for ID: ${id}`)
      console.log(`Available establishments:`, await db.collection('establishments').find({}).toArray())
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      )
    }
    
    // Get subscription data from establishment or use defaults
    const subscription = establishment.subscription || {
      tier: "core" as const,
      status: "active" as const,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      autoRenew: true
    }
    
    // Define features and limits based on tier
    const tierFeatures = {
      core: {
        features: [
          "Basic menu management",
          "QR code generation",
          "Employee management (up to 5)",
          "Basic analytics"
        ],
        limits: {
          employees: 5,
          menuItems: 50,
          orders: 1000,
          analytics: true,
          aiFeatures: false,
          whiteLabel: false,
          customDomain: false,
          prioritySupport: false
        }
      },
      pro: {
        features: [
          "Advanced menu management",
          "QR code generation",
          "Employee management (up to 15)",
          "Advanced analytics",
          "Inventory management",
          "Customer loyalty program"
        ],
        limits: {
          employees: 15,
          menuItems: 200,
          orders: 10000,
          analytics: true,
          aiFeatures: true,
          whiteLabel: false,
          customDomain: false,
          prioritySupport: true
        }
      },
      enterprise: {
        features: [
          "Full menu management",
          "QR code generation",
          "Unlimited employees",
          "Enterprise analytics",
          "Full inventory management",
          "Customer loyalty program",
          "White-label solution",
          "Custom domain",
          "Priority support"
        ],
        limits: {
          employees: 100,
          menuItems: 1000,
          orders: 100000,
          analytics: true,
          aiFeatures: true,
          whiteLabel: true,
          customDomain: true,
          prioritySupport: true
        }
      }
    }
    
    const currentTier = subscription.tier || "core"
    const tierData = tierFeatures[currentTier]
    
    const fullSubscription = {
      ...subscription,
      ...tierData
    }

    return NextResponse.json({
      success: true,
      subscription: fullSubscription
    })
  } catch (error) {
    console.error("Error fetching restaurant subscription:", error)
    console.error("Subscription error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      restaurantId: id,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch restaurant subscription",
        details: "Check server logs for more information"
      },
      { status: 500 }
    )
  }
}
