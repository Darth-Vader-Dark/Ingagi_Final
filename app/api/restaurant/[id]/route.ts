import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurantId = id
    
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
    
    // Fetch from establishments collection
    // For manager dashboard, allow unapproved restaurants
    // For public access, only show approved restaurants
    const isPublicRequest = request.headers.get('x-public-access') === 'true'
    
    const establishment = await db.collection('establishments').findOne({ 
      _id: new ObjectId(restaurantId),
      ...(isPublicRequest ? { isApproved: true } : {})
    })
    
    // Fetch menu items from the menuItems collection
    const menuItems = await db.collection('menuItems')
      .find({ restaurantId: restaurantId })
      .sort({ createdAt: -1 })
      .toArray()
    
    if (!establishment) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      )
    }
    
        // For public requests, ensure restaurant is approved
    if (isPublicRequest && !establishment.isApproved) {
      return NextResponse.json(
        { success: false, error: "Restaurant not yet approved" },
        { status: 403 }
      )
    }
    
    // Convert ObjectId to string and prepare response with default values
    // This will work for both approved and unapproved restaurants (manager access)
    const restaurant = {
      _id: establishment._id.toString(),
      name: establishment.name,
      type: establishment.type,
      description: establishment.description,
      location: establishment.location,
      phone: establishment.phone,
      email: establishment.email,
      logo: establishment.logo || "/placeholder.svg",
      banner: establishment.banner || "/placeholder.svg",
      cuisine: establishment.restaurant?.cuisine || establishment.cuisine || "General",
      rating: establishment.rating || 4.5,
      reviewCount: establishment.reviewCount || 0,
      priceRange: establishment.priceRange || "RWF 5,000 - 15,000",
      hours: establishment.hours?.open && establishment.hours?.close 
        ? `${establishment.hours.open} - ${establishment.hours.close}`
        : "Mon-Sun: 7:00 AM - 11:00 PM",
      amenities: establishment.amenities || [],
      menu: menuItems.map(item => ({
        _id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || "/placeholder.svg",
        isAvailable: item.isAvailable,
        allergens: item.allergens || [],
        nutritionalInfo: item.nutritionalInfo || {},
        tags: item.tags || [],
        preparationTime: item.preparationTime || null,
        isPromotional: item.isPromotional || false,
        promotionalPrice: item.promotionalPrice || null,
        promotionalEndDate: item.promotionalEndDate || null
      })),
      promotions: establishment.promotions || [],
      events: establishment.events || [],
      isApproved: establishment.isApproved || false,
      // Include type-specific data
      hotel: establishment.hotel || null,
      restaurant: establishment.restaurant || null,
      cafe: establishment.cafe || null,
      bakery: establishment.bakery || null,
      bar: establishment.bar || null,
      contact: {
        phone: establishment.phone,
        address: establishment.location,
        email: establishment.email
      }
    }
    
    console.log('API - Establishment from DB:', establishment)
    console.log('API - Amenities from DB:', establishment.amenities)
    console.log('API - Restaurant response:', restaurant)
    console.log('API - Amenities in response:', restaurant.amenities)

    return NextResponse.json({
      success: true,
      restaurant
    })
  } catch (error) {
    console.error("Error fetching restaurant:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      restaurantId: id,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error",
        details: "Check server logs for more information"
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updateData = await request.json()
    
    console.log('API - Received update data:', updateData)
    console.log('API - Amenities in update data:', updateData.amenities)
    console.log('API - Amenities type:', typeof updateData.amenities)
    console.log('API - Amenities is array:', Array.isArray(updateData.amenities))
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID is required" },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID format" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Check if restaurant exists
    // Allow updates even for unapproved restaurants (manager setup)
    const establishment = await db.collection('establishments').findOne({ 
      _id: new ObjectId(id)
    })
    
    if (!establishment) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found or access denied" },
        { status: 400 }
      )
    }

    // Update the restaurant
    // Handle MongoDB operators like $set
    if (updateData.$set) {
      await db.collection('establishments').updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData.$set, updatedAt: new Date() } }
      )
    } else {
      await db.collection('establishments').updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      )
    }
    
    // Verify the update by fetching the updated document
    const updatedEstablishment = await db.collection('establishments').findOne({ 
      _id: new ObjectId(id) 
    })
    console.log('API - After update, amenities in DB:', updatedEstablishment?.amenities)

    return NextResponse.json({
      success: true,
      message: "Restaurant updated successfully"
    })
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update restaurant" },
      { status: 500 }
    )
  }
}
