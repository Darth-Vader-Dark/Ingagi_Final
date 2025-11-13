import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Fetch attendance records for this hotel
    const records = await db.collection("attendanceRecords").find({
      restaurantId: id
    }).sort({ date: -1, createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      records: records.map(record => ({
        ...record,
        _id: record._id.toString()
      }))
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch attendance records"
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const decoded = verifyToken(token || "")
    
    if (!decoded || !decoded.userId || !["hr", "hotel_manager", "manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const attendanceData = await request.json()

    // Validate required fields
    if (!attendanceData.employeeId || !attendanceData.date || !attendanceData.status) {
      return NextResponse.json({
        success: false,
        error: "Employee ID, date, and status are required"
      }, { status: 400 })
    }

    // Get employee name
    const employee = await db.collection("users").findOne({
      _id: new ObjectId(attendanceData.employeeId)
    })

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: "Employee not found"
      }, { status: 404 })
    }

    const attendanceRecord = {
      ...attendanceData,
      restaurantId: id,
      employeeName: employee.name,
      createdBy: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("attendanceRecords").insertOne(attendanceRecord)
    const savedRecord = { 
      ...attendanceRecord, 
      _id: result.insertedId.toString()
    }

    return NextResponse.json({
      success: true,
      record: savedRecord,
      message: "Attendance record created successfully"
    })
  } catch (error) {
    console.error("Error creating attendance record:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create attendance record"
    }, { status: 500 })
  }
}
