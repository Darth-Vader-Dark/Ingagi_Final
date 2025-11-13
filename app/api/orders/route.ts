import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    // Validate required fields
    if (!orderData.restaurantId || !orderData.customerName || !orderData.phone || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(orderData.restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if restaurant exists
    const restaurant = await db.collection('establishments').findOne({
      _id: new ObjectId(orderData.restaurantId)
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      )
    }

    // Create order
    const order = {
      restaurantId: orderData.restaurantId,
      customerName: orderData.customerName,
      phone: orderData.phone,
      deliveryAddress: orderData.deliveryAddress || "",
      notes: orderData.notes || "",
      items: orderData.items,
      total: orderData.total,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("orders").insertOne(order)
    order._id = result.insertedId.toString()
    
    // Log the order creation
    await db.collection("audit_logs").insertOne({
      action: "Order Created",
      user: "customer",
      target: `Order: ${order.customerName}`,
      timestamp: new Date(),
      details: `Order created for restaurant ${orderData.restaurantId}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    })
    
    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        _id: order._id,
        customerName: order.customerName,
        phone: order.phone,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    )
  }
}

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
    
    // Fetch orders for the restaurant
    const orders = await db.collection("orders")
      .find({ restaurantId: restaurantId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        customerName: order.customerName,
        phone: order.phone,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        items: order.items,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}