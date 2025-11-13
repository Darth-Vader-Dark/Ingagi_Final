import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = await connectToDatabase()
    const reservations = await db.collection('reservations').find({ restaurantId: id }).sort({ date: 1, time: 1 }).toArray()
    return NextResponse.json({ success: true, reservations })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reservations' }, { status: 500 })
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
    const reservation = { ...data, restaurantId: id, createdAt: new Date() }
    const result = await db.collection('reservations').insertOne(reservation)
    return NextResponse.json({ success: true, reservation: { ...reservation, _id: result.insertedId } })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to create reservation' }, { status: 500 })
  }
}


