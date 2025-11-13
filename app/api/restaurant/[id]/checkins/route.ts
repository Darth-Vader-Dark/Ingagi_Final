import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    const checkins = await db.collection('checkins').find({ restaurantId: id, status: { $in: ['waiting','seated','dining'] } }).sort({ arrivalTime: -1 }).toArray()
    return NextResponse.json({ success: true, checkins })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch check-ins' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const { db } = await connectToDatabase()
    const checkin = { ...data, restaurantId: id, arrivalTime: new Date(), status: 'waiting' }
    const result = await db.collection('checkins').insertOne(checkin)
    return NextResponse.json({ success: true, checkIn: { ...checkin, _id: result.insertedId } })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create check-in' }, { status: 500 })
  }
}


