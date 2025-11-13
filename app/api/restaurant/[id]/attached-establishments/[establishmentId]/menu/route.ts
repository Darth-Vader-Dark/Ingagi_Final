import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; establishmentId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    
    // Get menu items for this attached establishment
    const menuItems = await db.collection("attachedEstablishmentMenus").find({
      establishmentId: params.establishmentId
    }).toArray()

    return NextResponse.json({
      success: true,
      menuItems: menuItems.map(item => ({
        _id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        image: item.image,
        establishmentId: item.establishmentId
      }))
    })
  } catch (error) {
    console.error("Error fetching attached establishment menu:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch menu" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; establishmentId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    if (!decoded || !decoded.userId || !["hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const menuItemData = await request.json()

    const menuItem = {
      ...menuItemData,
      establishmentId: params.establishmentId,
      restaurantId: params.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("attachedEstablishmentMenus").insertOne(menuItem)

    return NextResponse.json({
      success: true,
      menuItem: {
        _id: result.insertedId.toString(),
        ...menuItem
      }
    })
  } catch (error) {
    console.error("Error creating menu item:", error)
    return NextResponse.json({ success: false, error: "Failed to create menu item" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; establishmentId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    if (!decoded || !decoded.userId || !["hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { menuItemId, ...updateData } = await request.json()

    if (!menuItemId) {
      return NextResponse.json({ success: false, error: "Menu item ID is required" }, { status: 400 })
    }

    const result = await db.collection("attachedEstablishmentMenus").updateOne(
      { 
        _id: new ObjectId(menuItemId),
        establishmentId: params.establishmentId 
      },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Menu item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Menu item updated successfully" })
  } catch (error) {
    console.error("Error updating menu item:", error)
    return NextResponse.json({ success: false, error: "Failed to update menu item" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; establishmentId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    if (!decoded || !decoded.userId || !["hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { menuItemId } = await request.json()

    if (!menuItemId) {
      return NextResponse.json({ success: false, error: "Menu item ID is required" }, { status: 400 })
    }

    const result = await db.collection("attachedEstablishmentMenus").deleteOne({
      _id: new ObjectId(menuItemId),
      establishmentId: params.establishmentId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Menu item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Menu item deleted successfully" })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json({ success: false, error: "Failed to delete menu item" }, { status: 500 })
  }
}
