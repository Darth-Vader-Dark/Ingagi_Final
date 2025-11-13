import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Fetch real menu items from the database, filtered by restaurant ID
    // Allow access to menu even for unapproved restaurants (manager setup)
    const menuItems = await db.collection("menuItems")
      .find({ restaurantId: id })
      .sort({ createdAt: -1 })
      .toArray()

    // Format menu items for the frontend
    const formattedMenuItems = menuItems.map(item => ({
      _id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured || false,
      image: item.image || "/placeholder.svg",
      allergens: item.allergens || [],
      nutritionalInfo: item.nutritionalInfo || {},
      tags: item.tags || [],
      preparationTime: item.preparationTime || null,
      isPromotional: item.isPromotional || false,
      promotionalPrice: item.promotionalPrice || null,
      promotionalEndDate: item.promotionalEndDate || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))

    return NextResponse.json({
      success: true,
      menuItems: formattedMenuItems
    })
  } catch (error) {
    console.error("Error fetching restaurant menu:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch restaurant menu" },
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
    const menuItemData = await request.json()
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!menuItemData.name || !menuItemData.price || !menuItemData.category) {
      return NextResponse.json(
        { success: false, error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Create menu item with restaurant ID
    const menuItem = {
      ...menuItemData,
      restaurantId: id,
      isAvailable: menuItemData.isAvailable !== undefined ? menuItemData.isAvailable : true,
      isFeatured: menuItemData.isFeatured || false,
      allergens: menuItemData.allergens || [],
      nutritionalInfo: menuItemData.nutritionalInfo || {},
      tags: menuItemData.tags || [],
      preparationTime: menuItemData.preparationTime || null,
      image: menuItemData.image || "",
      isPromotional: menuItemData.isPromotional || false,
      promotionalPrice: menuItemData.promotionalPrice || null,
      promotionalEndDate: menuItemData.promotionalEndDate || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("menuItems").insertOne(menuItem)
    menuItem._id = result.insertedId.toString()
    
    // Log the creation
    await db.collection("audit_logs").insertOne({
      action: "Menu Item Created",
      user: "manager", // This would come from the authenticated user
      target: `Menu Item: ${menuItem.name}`,
      timestamp: new Date(),
      details: `Menu item created in restaurant ${id}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    })
    
    return NextResponse.json({
      success: true,
      message: "Menu item added successfully",
      menuItem: menuItem
    })
  } catch (error) {
    console.error("Error adding menu item:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add menu item" },
      { status: 500 }
    )
  }
}
