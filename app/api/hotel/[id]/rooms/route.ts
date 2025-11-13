import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    const rooms = await db.collection('rooms').find({ restaurantId: id }).project({}).sort({ name: 1 }).toArray()
    return NextResponse.json({ success: true, rooms })
  } catch (e) {
    console.error('Public rooms error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

