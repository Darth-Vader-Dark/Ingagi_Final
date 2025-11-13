import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { roomNumber, guestName, details, source } = body || {}

    if (!roomNumber || !guestName || !details) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const doc = {
      roomNumber,
      guestName,
      details,
      source: source || 'qr-public',
      status: 'pending',
      restaurantId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection('roomServiceRequests').insertOne(doc)
    return NextResponse.json({ success: true, request: doc })
  } catch (e) {
    console.error('Public room service error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

