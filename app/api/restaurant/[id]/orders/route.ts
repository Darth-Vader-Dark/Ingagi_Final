import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    
    const orders = await db.collection("orders")
      .find({ restaurantId: id })
      .sort({ orderDate: -1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      orders
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { db } = await connectToDatabase()
    
    const order = {
      ...body,
      restaurantId: id,
      orderDate: new Date(),
      status: "pending",
      paymentStatus: "pending"
    }
    
    const result = await db.collection("orders").insertOne(order)
    
    return NextResponse.json({
      success: true,
      order: { ...order, _id: result.insertedId }
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    )
  }
}
