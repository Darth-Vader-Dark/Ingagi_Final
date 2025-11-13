import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, paymentStatus, paymentMethod } = await request.json()
    
    console.log(`Order status update request:`, { id, status, paymentStatus, paymentMethod })
    
    const { db } = await connectToDatabase()
    
    // Always use ObjectId for database operations
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId: ${id}`)
      return NextResponse.json(
        { success: false, error: "Invalid order ID format" },
        { status: 400 }
      )
    }
    
    const orderId = new ObjectId(id)
    console.log(`Using ObjectId: ${orderId}`)
    
    // Update the order
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (status) {
      updateData.status = status
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
    }
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }
    
    // Update the order
    console.log(`Attempting to update order with ID: ${orderId}`)
    console.log(`Update data:`, updateData)
    
    const result = await db.collection("orders").updateOne(
      { _id: orderId },
      { $set: updateData }
    )
    
    console.log(`Update result:`, { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount })
    
    // Verify the update
    const verifyOrder = await db.collection("orders").findOne({ _id: orderId })
    console.log(`Verified order after update:`, {
      _id: verifyOrder?._id.toString(),
      status: verifyOrder?.status,
      paymentStatus: verifyOrder?.paymentStatus,
      paymentMethod: verifyOrder?.paymentMethod
    })
    
    if (result.matchedCount === 0) {
      console.log(`Order not found with ID: ${orderId}`)
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }
    
    console.log(`Order updated successfully:`, { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount })
    
    // Get the order for sales tracking
    const order = await db.collection("orders").findOne({ _id: orderId })
    
    if (!order) {
      console.log(`Order not found for sales update: ${orderId}`)
      return NextResponse.json({
        success: true,
        message: "Order status updated successfully"
      })
    }
    
    // Update sales data when:
    // 1. Order status changes from pending to any other status (except cancelled)
    // 2. Payment is marked as paid
    const shouldUpdateSales = 
      (status && status !== "pending" && status !== "cancelled") || 
      (paymentStatus === "paid")
    
    if (shouldUpdateSales) {
      console.log(`Processing sales update for order ${order._id}`, {
        status: status || order.status,
        paymentStatus: paymentStatus || order.paymentStatus,
        paymentMethod: paymentMethod || order.paymentMethod
      })
      
      // Check if this order has already been counted in sales
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const existingSalesRecord = await db.collection("dailySales").findOne({
        restaurantId: order.restaurantId,
        orderId: order._id.toString()
      })
      
      // Only add to sales if not already counted
      if (!existingSalesRecord) {
        console.log(`Adding new sales record for order ${order._id}`)
        
        const salesRecord = {
          restaurantId: order.restaurantId,
          date: today,
          orderId: order._id.toString(),
          amount: order.total,
          paymentMethod: paymentMethod || order.paymentMethod || "cash",
          status: "completed",
          createdAt: new Date()
        }
        
        // Insert daily sales record
        await db.collection("dailySales").insertOne(salesRecord)
        console.log(`Daily sales record created`)
        
        // Update restaurant's total sales
        const salesUpdateResult = await db.collection("establishments").updateOne(
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
        
          console.log(`Sales updated for order ${order._id}: RWF ${order.total}`, {
            matchedCount: salesUpdateResult.matchedCount,
            modifiedCount: salesUpdateResult.modifiedCount,
            totalRevenue: order.total
          })
          
          // Verify the establishment sales were updated
          const verifyEstablishment = await db.collection("establishments").findOne({ 
            _id: new ObjectId(order.restaurantId) 
          })
          console.log(`Verified establishment sales after update:`, {
            restaurantId: order.restaurantId,
            totalRevenue: verifyEstablishment?.sales?.totalRevenue,
            totalOrders: verifyEstablishment?.sales?.totalOrders,
            lastUpdated: verifyEstablishment?.sales?.lastUpdated
          })
      } else {
        console.log(`Order ${order._id} already counted in sales`)
      }
    } else {
      console.log(`Sales update skipped for order ${order._id}`, {
        status: status || order.status,
        paymentStatus: paymentStatus || order.paymentStatus
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Order status updated successfully"
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    )
  }
}
