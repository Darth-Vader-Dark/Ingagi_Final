import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'restaurantId is required' }, { status: 400 })
    }
    const { db } = await connectToDatabase()
    const users = await db.collection('users').find({ restaurantId }).toArray()
    const employees = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      status: u.isActive ? 'active' : 'inactive',
      hireDate: u.createdAt,
      performance: u.performance || null,
      hoursThisWeek: u.hoursThisWeek || 0,
      salary: u.salary || null
    }))
    return NextResponse.json({ success: true, employees })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const employeeData = await request.json()

  // Mock create employee
  const newEmployee = {
    id: `EMP-${Date.now()}`,
    ...employeeData,
    status: "active",
    hireDate: new Date().toISOString().split("T")[0],
    performance: 0,
    hoursThisWeek: 0,
  }

  return NextResponse.json({ success: true, employee: newEmployee })
}

export async function PUT(request: NextRequest) {
  // Set salary for an employee (mock implementation)
  const { employeeId, baseSalary, currency } = await request.json()
  if (!employeeId || typeof baseSalary !== 'number') {
    return NextResponse.json({ success: false, error: 'employeeId and numeric baseSalary required' }, { status: 400 })
  }
  return NextResponse.json({ success: true, salary: { base: baseSalary, currency: currency || 'RWF' } })
}
