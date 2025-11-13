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
    
    // Fetch promotions for this establishment
    const promotions = await db.collection("promotions").find({
      establishmentId: id
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      promotions: promotions.map(promo => ({
        _id: promo._id.toString(),
        title: promo.title,
        description: promo.description,
        discount: promo.discount,
        startDate: promo.startDate,
        endDate: promo.endDate,
        isActive: promo.isActive,
        createdAt: promo.createdAt
      }))
    })
  } catch (error) {
    console.error("Error fetching promotions:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch promotions"
    }, { status: 500 })
  }
}