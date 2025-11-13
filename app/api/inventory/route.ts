import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Fetch real inventory from the database, filtered by restaurant ID
    const inventory = await db.collection("inventory")
      .find({ restaurantId: restaurantId })
      .sort({ name: 1 })
      .toArray()

    // Format inventory for the frontend
    const formattedInventory = inventory.map(item => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      supplier: item.supplier,
      lastRestocked: item.lastRestocked,
      expiryDate: item.expiryDate,
    }))

    return NextResponse.json({ 
      success: true, 
      inventory: formattedInventory,
      count: formattedInventory.length
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { itemId, quantity, action, restaurantId } = await request.json()

    if (!itemId || !quantity || !action || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Item ID, quantity, action, and restaurant ID are required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(itemId) || !ObjectId.isValid(restaurantId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Verify the item belongs to the specified restaurant
    const item = await db.collection("inventory").findOne({
      _id: new ObjectId(itemId),
      restaurantId: restaurantId
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      )
    }

    // Update inventory based on action
    let updateFields: any = { updatedAt: new Date() }
    
    if (action === "add") {
      updateFields.currentStock = item.currentStock + quantity
    } else if (action === "remove") {
      updateFields.currentStock = Math.max(0, item.currentStock - quantity)
    } else if (action === "set") {
      updateFields.currentStock = quantity
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'add', 'remove', or 'set'" },
        { status: 400 }
      )
    }

    // Update the inventory item
    const result = await db.collection("inventory").updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Inventory item ${item.name} ${action} by ${quantity} units`,
      newStock: updateFields.currentStock
    })
  } catch (error) {
    console.error("Error updating inventory:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update inventory" },
      { status: 500 }
    )
  }
}
