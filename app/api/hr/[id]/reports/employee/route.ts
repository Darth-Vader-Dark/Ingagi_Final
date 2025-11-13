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

    if (!decoded || !decoded.userId || !["hr", "manager", "hotel_manager", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { startDate, endDate, format = "json" } = Object.fromEntries(new URL(request.url).searchParams)

    // Get employees from users collection
    const employees = await db.collection("users").find({
      restaurantId: id,
      isActive: true,
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr", "manager"] }
    }).toArray()

    // Get attendance records for the date range
    let attendanceQuery: any = { restaurantId: id }
    if (startDate && endDate) {
      attendanceQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const attendanceRecords = await db.collection("attendanceRecords").find(attendanceQuery).toArray()

    // Calculate statistics
    const totalEmployees = employees.length
    const activeEmployees = employees.filter(emp => emp.isActive).length
    const newHires = employees.filter(emp => {
      const hireDate = new Date(emp.hireDate)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return hireDate >= thirtyDaysAgo
    }).length

    // Department breakdown (using role as department for now)
    const departmentStats = employees.reduce((acc: any, emp) => {
      const dept = emp.role || "Unassigned"
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {})

    // Attendance statistics
    const attendanceStats = {
      totalRecords: attendanceRecords.length,
      present: attendanceRecords.filter(record => record.status === "present").length,
      absent: attendanceRecords.filter(record => record.status === "absent").length,
      late: attendanceRecords.filter(record => record.status === "late").length,
      halfDay: attendanceRecords.filter(record => record.status === "half-day").length
    }

    const reportData = {
      reportType: "Employee Report",
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalEmployees,
        activeEmployees,
        newHires,
        departmentStats,
        attendanceStats
      },
      employees: employees.map(emp => ({
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        position: emp.role, // Using role as position for now
        department: emp.role, // Using role as department for now
        phone: emp.phone || "N/A",
        hireDate: emp.createdAt || emp.hireDate || "N/A",
        salary: "N/A", // Salary not available in users collection
        isActive: emp.isActive,
        attendanceRecords: attendanceRecords.filter(record => record.employeeId === emp._id.toString())
      }))
    }

    if (format === "csv") {
      // Generate CSV format
      const csvHeaders = "Name,Email,Role,Position,Department,Phone,Hire Date,Salary,Status,Attendance Records"
      const csvRows = reportData.employees.map(emp => 
        `"${emp.name}","${emp.email}","${emp.role}","${emp.position}","${emp.department}","${emp.phone}","${emp.hireDate}","${emp.salary}","${emp.isActive ? 'Active' : 'Inactive'}","${emp.attendanceRecords.length}"`
      ).join("\n")
      
      const csvContent = csvHeaders + "\n" + csvRows
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="employee-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })
  } catch (error) {
    console.error("Error generating employee report:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to generate employee report"
    }, { status: 500 })
  }
}
