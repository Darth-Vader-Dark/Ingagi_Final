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
    const allOrders = await db.collection("orders")
      .find({ restaurantId: restaurantId })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get today's orders
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get served orders
    const servedOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        status: "served"
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get paid orders
    const paidOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        paymentStatus: "paid"
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get daily sales records
    const dailySales = await db.collection("dailySales")
      .find({ restaurantId: restaurantId })
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      data: {
        totalOrders: allOrders.length,
        todayOrders: todayOrders.length,
        servedOrders: servedOrders.length,
        paidOrders: paidOrders.length,
        dailySalesRecords: dailySales.length,
        allOrders: allOrders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt
        })),
        todayOrders: todayOrders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt
        })),
        servedOrders: servedOrders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt
        })),
        paidOrders: paidOrders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt
        })),
        dailySales: dailySales.map(sale => ({
          _id: sale._id.toString(),
          orderId: sale.orderId,
          amount: sale.amount,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          createdAt: sale.createdAt
        }))
      }
    })
  } catch (error) {
    console.error("Error checking orders:", error)
    return NextResponse.json(
      { success: false, error: "Failed to check orders" },
      { status: 500 }
    )
  }
}
