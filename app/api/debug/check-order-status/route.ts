import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Get the order from database
    const order = await db.collection("orders").findOne({ 
      _id: new ObjectId(orderId) 
    })
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: "Order not found"
      })
    }
    
    // Check if there's a sales record for this order
    const salesRecord = await db.collection("dailySales").findOne({
      orderId: order._id.toString()
    })
    
    // Get restaurant sales data
    const restaurant = await db.collection("establishments").findOne({
      _id: new ObjectId(order.restaurantId)
    })
    
    return NextResponse.json({
      success: true,
      data: {
        order: {
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        },
        salesRecord: salesRecord ? {
          orderId: salesRecord.orderId,
          amount: salesRecord.amount,
          paymentMethod: salesRecord.paymentMethod,
          date: salesRecord.date,
          createdAt: salesRecord.createdAt
        } : null,
        restaurantSales: restaurant?.sales || null
      }
    })
  } catch (error) {
    console.error("Error checking order status:", error)
    return NextResponse.json(
      { success: false, error: "Failed to check order status" },
      { status: 500 }
    )
  }
}
