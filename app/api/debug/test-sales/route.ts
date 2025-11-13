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
    
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Get all orders for today
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
    
    // Get served orders for today
    const servedOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        status: "served",
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get paid orders for today
    const paidOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        paymentStatus: "paid",
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get orders that should be included in sales (served OR paid)
    const salesOrders = await db.collection("orders")
      .find({
        restaurantId: restaurantId,
        $or: [
          { status: "served" },
          { paymentStatus: "paid" }
        ],
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get daily sales records
    const dailySales = await db.collection("dailySales")
      .find({
        restaurantId: restaurantId,
        date: today
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Calculate totals
    const todayTotal = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const servedTotal = servedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const paidTotal = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const salesTotal = salesOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const dailySalesTotal = dailySales.reduce((sum, sale) => sum + (sale.amount || 0), 0)
    
    return NextResponse.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        summary: {
          totalTodayOrders: todayOrders.length,
          totalTodayRevenue: todayTotal,
          servedOrders: servedOrders.length,
          servedRevenue: servedTotal,
          paidOrders: paidOrders.length,
          paidRevenue: paidTotal,
          salesOrders: salesOrders.length,
          salesRevenue: salesTotal,
          dailySalesRecords: dailySales.length,
          dailySalesRevenue: dailySalesTotal
        },
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
          createdAt: order.createdAt
        })),
        paidOrders: paidOrders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        })),
        salesOrders: salesOrders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        })),
        dailySales: dailySales.map(sale => ({
          _id: sale._id.toString(),
          orderId: sale.orderId,
          amount: sale.amount,
          paymentMethod: sale.paymentMethod,
          createdAt: sale.createdAt
        }))
      }
    })
  } catch (error) {
    console.error("Error testing sales:", error)
    return NextResponse.json(
      { success: false, error: "Failed to test sales" },
      { status: 500 }
    )
  }
}
