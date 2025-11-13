import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    let startDate: Date
    let endDate: Date = new Date()
    
    // Set date range based on period
    switch (period) {
      case 'today':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
    }
    
    // Fetch completed orders for the period - include orders that are:
    // 1. Marked as served OR delivered
    // 2. Payment status is paid
    // 3. Status is not pending or cancelled
    const orders = await db.collection("orders")
      .find({
        restaurantId: id,
        $or: [
          { status: "served" },
          { status: "delivered" },
          { status: "ready" },
          { status: "preparing" },
          { paymentStatus: "paid" }
        ],
        status: { $ne: "cancelled" }, // Exclude cancelled orders
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    console.log(`Found ${orders.length} completed orders for restaurant ${id} in period ${period}`)
    console.log('Orders details:', orders.map(o => ({
      id: o._id.toString(),
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: o.total
    })))
    
    // Calculate sales metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Group by payment method
    const paymentMethods = orders.reduce((acc, order) => {
      const method = order.paymentMethod || 'cash'
      acc[method] = (acc[method] || 0) + (order.total || 0)
      return acc
    }, {} as Record<string, number>)
    
    // Group by hour for hourly sales
    const hourlySales = orders.reduce((acc, order) => {
      const hour = new Date(order.createdAt).getHours()
      acc[hour] = (acc[hour] || 0) + (order.total || 0)
      return acc
    }, {} as Record<number, number>)
    
    // Get top selling items
    const itemSales = orders.reduce((acc, order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemName = item.name
          if (!acc[itemName]) {
            acc[itemName] = { quantity: 0, revenue: 0 }
          }
          acc[itemName].quantity += item.quantity || 0
          acc[itemName].revenue += (item.price || 0) * (item.quantity || 0)
        })
      }
      return acc
    }, {} as Record<string, { quantity: number, revenue: number }>)
    
    const topSellingItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    return NextResponse.json({
      success: true,
      sales: {
        period,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        paymentMethods,
        hourlySales,
        topSellingItems,
        orders: orders.map(order => ({
          _id: order._id.toString(),
          customerName: order.customerName,
          total: order.total,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt
        }))
      }
    })
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales data" },
      { status: 500 }
    )
  }
}
