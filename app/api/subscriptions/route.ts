import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get('establishmentId')
    
    if (establishmentId) {
      // Get subscription for specific establishment
      const establishment = await db.collection('establishments').findOne(
        { _id: establishmentId },
        { projection: { subscription: 1, name: 1 } }
      )
      
      if (!establishment) {
        return NextResponse.json(
          { success: false, error: "Establishment not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        subscription: establishment.subscription,
        establishmentName: establishment.name
      })
    }
    
    // Get all subscriptions (for admin)
    const establishments = await db.collection('establishments')
      .find({}, { projection: { subscription: 1, name: 1, type: 1 } })
      .toArray()
    
    return NextResponse.json({
      success: true,
      subscriptions: establishments
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscriptions" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { establishmentId, subscription } = await request.json()
    
    if (!establishmentId || !subscription) {
      return NextResponse.json(
        { success: false, error: "Establishment ID and subscription data are required" },
        { status: 400 }
      )
    }
    
    const result = await db.collection('establishments').updateOne(
      { _id: establishmentId },
      { 
        $set: { 
          subscription,
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
      message: "Subscription updated successfully"
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { success: false, error: "Failed to update subscription" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { establishmentId, newTier, paymentMethod } = await request.json()
    
    if (!establishmentId || !newTier) {
      return NextResponse.json(
        { success: false, error: "Establishment ID and new tier are required" },
        { status: 400 }
      )
    }
    
    // Validate tier
    if (!['core', 'pro', 'enterprise'].includes(newTier)) {
      return NextResponse.json(
        { success: false, error: "Invalid tier specified" },
        { status: 400 }
      )
    }
    
    // Get current establishment
    const establishment = await db.collection('establishments').findOne({ _id: establishmentId })
    if (!establishment) {
      return NextResponse.json(
        { success: false, error: "Establishment not found" },
        { status: 404 }
      )
    }
    
    // Update subscription
    const updatedSubscription = {
      tier: newTier,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoRenew: true
    }
    
    const result = await db.collection('establishments').updateOne(
      { _id: establishmentId },
      { 
        $set: { 
          subscription: updatedSubscription,
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update subscription" },
        { status: 500 }
      )
    }
    
    // Log the subscription change
    await db.collection('subscription_logs').insertOne({
      establishmentId,
      oldTier: establishment.subscription?.tier || 'core',
      newTier,
      paymentMethod,
      timestamp: new Date(),
      action: 'tier_upgrade'
    })
    
    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${newTier} tier`,
      subscription: updatedSubscription
    })
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { success: false, error: "Failed to upgrade subscription" },
      { status: 500 }
    )
  }
}
