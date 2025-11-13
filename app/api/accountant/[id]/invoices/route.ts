import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")

    if (!decoded || !decoded.userId || !["accountant", "manager", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const invoices = await db.collection("invoices").find({
      restaurantId: id
    }).toArray()

    return NextResponse.json({
      success: true,
      invoices: invoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        amount: invoice.amount,
        tax: invoice.tax,
        total: invoice.total,
        status: invoice.status,
        dueDate: invoice.dueDate,
        issueDate: invoice.issueDate,
        description: invoice.description,
        items: invoice.items,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch invoices"
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")

    if (!decoded || !decoded.userId || !["accountant", "manager", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const invoiceData = await request.json()

    // Validate required fields
    if (!invoiceData.customerName || !invoiceData.amount) {
      return NextResponse.json({
        success: false,
        error: "Customer name and amount are required"
      }, { status: 400 })
    }

    // Get settings for tax calculation
    const settings = await db.collection("accountingSettings").findOne({ restaurantId: id })
    const taxRate = settings?.taxRate || 0.18
    const tax = invoiceData.amount * taxRate
    const total = invoiceData.amount + tax

    const newInvoice = {
      ...invoiceData,
      tax,
      total,
      restaurantId: id,
      status: invoiceData.status || "draft",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("invoices").insertOne(newInvoice)

    return NextResponse.json({
      success: true,
      invoice: {
        _id: result.insertedId,
        ...newInvoice
      },
      message: "Invoice created successfully"
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create invoice"
    }, { status: 500 })
  }
}
