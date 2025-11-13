import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    
    if (!restaurantId || !ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Get all orders for the restaurant
    const orders = await db.collection("orders")
      .find({ restaurantId: restaurantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
    
    // Get sales records
    const salesRecords = await db.collection("dailySales")
      .find({ restaurantId: restaurantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
    
    // Get establishment sales data
    const establishment = await db.collection("establishments")
      .findOne({ _id: new ObjectId(restaurantId) })
    
    return NextResponse.json({
      success: true,
      data: {
        totalOrders: orders.length,
        orders: orders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        })),
        salesRecords: salesRecords.map(record => ({
          orderId: record.orderId,
          amount: record.amount,
          date: record.date,
          createdAt: record.createdAt
        })),
        establishmentSales: establishment?.sales || null
      }
    })
  } catch (error) {
    console.error("Error verifying order updates:", error)
    return NextResponse.json(
      { success: false, error: "Failed to verify order updates" },
      { status: 500 }
    )
  }
}
