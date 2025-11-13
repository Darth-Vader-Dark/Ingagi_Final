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

    // Get user sessions (actual login/logout data)
    let sessionQuery: any = { restaurantId: id }
    if (startDate && endDate) {
      sessionQuery.date = {
        $gte: startDate,
        $lte: endDate
      }
    }

    const userSessions = await db.collection("userSessions").find(sessionQuery).toArray()
    
    // Convert sessions to attendance records format
    const attendanceRecords = userSessions.map(session => ({
      _id: session._id,
      employeeId: session.userId,
      employeeName: session.userName,
      date: session.date,
      checkIn: session.loginTime ? new Date(session.loginTime).toTimeString().split(' ')[0] : null,
      checkOut: session.logoutTime ? new Date(session.logoutTime).toTimeString().split(' ')[0] : null,
      status: session.status === "completed" ? "present" : session.status === "active" ? "present" : "absent",
      notes: session.logoutTime ? `Worked ${Math.round((new Date(session.logoutTime) - new Date(session.loginTime)) / (1000 * 60 * 60) * 10) / 10} hours` : "Still active",
      createdAt: session.updatedAt
    }))

    // Get employees for reference from users collection
    const employees = await db.collection("users").find({
      restaurantId: id,
      role: { $in: ["receptionist", "waiter", "kitchen", "housekeeping", "maintenance", "accountant", "hr", "manager"] }
    }).toArray()

    // Calculate statistics
    const totalRecords = attendanceRecords.length
    const presentCount = attendanceRecords.filter(record => record.status === "present").length
    const absentCount = attendanceRecords.filter(record => record.status === "absent").length
    const lateCount = attendanceRecords.filter(record => record.status === "late").length
    const halfDayCount = attendanceRecords.filter(record => record.status === "half-day").length

    // Daily breakdown
    const dailyStats = attendanceRecords.reduce((acc: any, record) => {
      const date = new Date(record.date).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 }
      }
      acc[date][record.status]++
      acc[date].total++
      return acc
    }, {})

    // Employee attendance summary
    const employeeAttendance = employees.map(emp => {
      const empRecords = attendanceRecords.filter(record => record.employeeId === emp._id.toString())
      return {
        employeeId: emp._id,
        name: emp.name,
        department: emp.department,
        totalDays: empRecords.length,
        present: empRecords.filter(r => r.status === "present").length,
        absent: empRecords.filter(r => r.status === "absent").length,
        late: empRecords.filter(r => r.status === "late").length,
        halfDay: empRecords.filter(r => r.status === "half-day").length,
        attendanceRate: empRecords.length > 0 ? 
          ((empRecords.filter(r => r.status === "present").length / empRecords.length) * 100).toFixed(2) : "0"
      }
    })

    // Department breakdown
    const departmentStats = employeeAttendance.reduce((acc: any, emp) => {
      const dept = emp.department || "Unassigned"
      if (!acc[dept]) {
        acc[dept] = { totalEmployees: 0, totalDays: 0, present: 0, absent: 0, late: 0, halfDay: 0 }
      }
      acc[dept].totalEmployees++
      acc[dept].totalDays += emp.totalDays
      acc[dept].present += emp.present
      acc[dept].absent += emp.absent
      acc[dept].late += emp.late
      acc[dept].halfDay += emp.halfDay
      return acc
    }, {})

    // Calculate department attendance rates
    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept]
      stats.attendanceRate = stats.totalDays > 0 ? 
        ((stats.present / stats.totalDays) * 100).toFixed(2) : "0"
    })

    const reportData = {
      reportType: "Attendance Report",
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        halfDay: halfDayCount,
        overallAttendanceRate: totalRecords > 0 ? 
          ((presentCount / totalRecords) * 100).toFixed(2) : "0"
      },
      dailyStats,
      departmentStats,
      employeeAttendance,
      attendanceRecords: attendanceRecords.map(record => ({
        _id: record._id,
        employeeName: record.employeeName,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        notes: record.notes
      }))
    }

    if (format === "csv") {
      // Generate CSV format
      const csvHeaders = "Employee Name,Date,Check In,Check Out,Status,Notes"
      const csvRows = reportData.attendanceRecords.map(record => 
        `"${record.employeeName}","${record.date}","${record.checkIn}","${record.checkOut}","${record.status}","${record.notes}"`
      ).join("\n")
      
      const csvContent = csvHeaders + "\n" + csvRows
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })
  } catch (error) {
    console.error("Error generating attendance report:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to generate attendance report"
    }, { status: 500 })
  }
}
