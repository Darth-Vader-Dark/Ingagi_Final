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
    
    // Fetch all bookings for this hotel
    const bookings = await db.collection("roomBookings").find({
      restaurantId: id
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      bookings: bookings.map(booking => ({
        _id: booking._id.toString(),
        hotelId: booking.hotelId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        rooms: booking.rooms,
        roomType: booking.roomType,
        specialRequests: booking.specialRequests,
        status: booking.status,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }))
    })
  } catch (error) {
    console.error("Error fetching hotel bookings:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch bookings"
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    const bookingData = await request.json()
    
    console.log("Received booking data:", bookingData)
    
    // Validate required fields
    if (!bookingData.name || !bookingData.phone || !bookingData.checkIn || !bookingData.checkOut) {
      console.log("Missing required fields:", {
        name: bookingData.name,
        phone: bookingData.phone,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut
      })
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    // Calculate total amount based on actual room price
    let basePrice = 50000 // Default price if room not found
    
    // Use specific room price if roomId is provided, otherwise find by room type
    if (bookingData.roomId) {
      const room = await db.collection("rooms").findOne({
        _id: new ObjectId(bookingData.roomId)
      })
      if (room && room.price) {
        basePrice = room.price
      }
    } else if (bookingData.roomType) {
      const room = await db.collection("rooms").findOne({
        type: bookingData.roomType,
        restaurantId: id
      })
      if (room && room.price) {
        basePrice = room.price
      }
    }
    
    const nights = Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = basePrice * nights * bookingData.rooms

    // Create booking
    const booking = {
      restaurantId: id,
      customerName: bookingData.name,
      customerPhone: bookingData.phone,
      customerEmail: bookingData.email || "",
      checkIn: new Date(bookingData.checkIn),
      checkOut: new Date(bookingData.checkOut),
      guests: bookingData.guests || 1,
      rooms: bookingData.rooms || 1,
      roomType: bookingData.roomType || "Standard",
      roomId: bookingData.roomId || "",
      roomPrice: basePrice,
      specialRequests: bookingData.specialRequests || "",
      status: "pending", // pending, confirmed, cancelled, completed
      totalAmount: totalAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("roomBookings").insertOne(booking)

    return NextResponse.json({
      success: true,
      booking: {
        _id: result.insertedId.toString(),
        ...booking
      }
    })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create booking"
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { bookingId, status } = await request.json()
    
    if (!bookingId || !status || !["pending", "approved", "rejected", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({
        success: false,
        error: "Invalid booking ID or status"
      }, { status: 400 })
    }

    const result = await db.collection("roomBookings").updateOne(
      { _id: new ObjectId(bookingId), restaurantId: id },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        } 
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Booking not found"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Booking status updated successfully"
    })
  } catch (error) {
    console.error("Error updating booking status:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update booking status"
    }, { status: 500 })
  }
}
