import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId } = await request.json()
    
    if (!restaurantId || !ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Find all paid orders that haven't been counted in sales
    const paidOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        paymentStatus: "paid"
      })
      .toArray()
    
    console.log(`Found ${paidOrders.length} paid orders for restaurant ${restaurantId}`)
    
    let updatedCount = 0
    
    for (const order of paidOrders) {
      // Check if already counted
      const existingSalesRecord = await db.collection("dailySales").findOne({
        restaurantId: order.restaurantId,
        orderId: order._id.toString()
      })
      
      if (!existingSalesRecord) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const salesRecord = {
          restaurantId: order.restaurantId,
          date: today,
          orderId: order._id.toString(),
          amount: order.total,
          paymentMethod: order.paymentMethod || "cash",
          status: "completed",
          createdAt: new Date()
        }
        
        // Insert daily sales record
        await db.collection("dailySales").insertOne(salesRecord)
        
        // Update restaurant's total sales
        await db.collection("establishments").updateOne(
          { _id: new ObjectId(order.restaurantId) },
          { 
            $inc: { 
              "sales.totalRevenue": order.total,
              "sales.totalOrders": 1
            },
            $set: { 
              "sales.lastUpdated": new Date()
            }
          }
        )
        
        updatedCount++
        console.log(`Added sales record for paid order ${order._id}: RWF ${order.total}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated sales for ${updatedCount} paid orders`,
      totalPaidOrders: paidOrders.length,
      updatedCount
    })
  } catch (error) {
    console.error("Error force updating sales:", error)
    return NextResponse.json(
      { success: false, error: "Failed to force update sales" },
      { status: 500 }
    )
  }
}
