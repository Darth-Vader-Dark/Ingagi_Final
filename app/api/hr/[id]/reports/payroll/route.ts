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

    // Get payroll data from accountant dashboard
    const accountantPayrollData = await db.collection("payrollData").find({
      restaurantId: id
    }).toArray()

    // Get user sessions for actual working hours
    const userSessions = await db.collection("userSessions").find({
      restaurantId: id,
      ...(startDate && endDate ? {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      } : {})
    }).toArray()

    // Calculate payroll for each employee using accountant data
    const payrollData = employees.map(emp => {
      // Find accountant payroll data for this employee
      const empPayrollData = accountantPayrollData.find(pay => pay.employeeId === emp._id.toString())
      
      if (!empPayrollData) {
        // Use default values if no accountant data
        return {
          employeeId: emp._id,
          name: emp.name,
          department: emp.role,
          position: emp.role,
          baseSalary: 0,
          workingDays: 0,
          fullDays: 0,
          halfDays: 0,
          regularHours: 0,
          overtimeHours: 0,
          hourlyRate: "0.00",
          regularPay: "0.00",
          overtimePay: "0.00",
          totalPay: "0.00",
          taxDeduction: "0.00",
          netPay: "0.00",
          currency: "USD",
          status: "No payroll data from accountant"
        }
      }

      // Get actual working hours from user sessions
      const empSessions = userSessions.filter(session => session.userId === emp._id.toString())
      const totalWorkingHours = empSessions.reduce((total, session) => {
        if (session.loginTime && session.logoutTime) {
          const hours = (new Date(session.logoutTime) - new Date(session.loginTime)) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)

      const regularHours = Math.min(totalWorkingHours, 40) // 40 hours standard
      const overtimeHours = Math.max(0, totalWorkingHours - 40)
      
      // Calculate pay using accountant data
      const hourlyRate = empPayrollData.hourlyRate
      const overtimeRate = empPayrollData.overtimeRate || 1.5
      const taxRate = empPayrollData.taxRate || 0.15
      
      const regularPay = regularHours * hourlyRate
      const overtimePay = overtimeHours * hourlyRate * overtimeRate
      const totalPay = regularPay + overtimePay
      const taxDeduction = totalPay * taxRate
      const netPay = totalPay - taxDeduction

      return {
        employeeId: emp._id,
        name: emp.name,
        department: emp.role,
        position: emp.role,
        baseSalary: empPayrollData.baseSalary,
        workingDays: empSessions.length,
        fullDays: empSessions.filter(s => s.status === "completed").length,
        halfDays: 0, // Not tracked in sessions
        regularHours: regularHours.toFixed(1),
        overtimeHours: overtimeHours.toFixed(1),
        hourlyRate: hourlyRate.toFixed(2),
        regularPay: regularPay.toFixed(2),
        overtimePay: overtimePay.toFixed(2),
        totalPay: totalPay.toFixed(2),
        taxDeduction: taxDeduction.toFixed(2),
        netPay: netPay.toFixed(2),
        currency: "USD",
        benefits: empPayrollData.benefits || [],
        payPeriod: empPayrollData.payPeriod
      }
    })

    // Calculate totals
    const totals = payrollData.reduce((acc, emp) => {
      acc.totalRegularPay += parseFloat(emp.regularPay)
      acc.totalOvertimePay += parseFloat(emp.overtimePay)
      acc.totalPay += parseFloat(emp.totalPay)
      acc.totalTaxDeduction += parseFloat(emp.taxDeduction)
      acc.totalNetPay += parseFloat(emp.netPay)
      return acc
    }, {
      totalRegularPay: 0,
      totalOvertimePay: 0,
      totalPay: 0,
      totalTaxDeduction: 0,
      totalNetPay: 0
    })

    // Department breakdown
    const departmentTotals = payrollData.reduce((acc: any, emp) => {
      const dept = emp.department || "Unassigned"
      if (!acc[dept]) {
        acc[dept] = {
          employeeCount: 0,
          totalRegularPay: 0,
          totalOvertimePay: 0,
          totalPay: 0,
          totalTaxDeduction: 0,
          totalNetPay: 0
        }
      }
      acc[dept].employeeCount++
      acc[dept].totalRegularPay += parseFloat(emp.regularPay)
      acc[dept].totalOvertimePay += parseFloat(emp.overtimePay)
      acc[dept].totalPay += parseFloat(emp.totalPay)
      acc[dept].totalTaxDeduction += parseFloat(emp.taxDeduction)
      acc[dept].totalNetPay += parseFloat(emp.netPay)
      return acc
    }, {})

    const reportData = {
      reportType: "Payroll Report",
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      currency,
      summary: {
        totalEmployees: payrollData.length,
        totalRegularPay: totals.totalRegularPay.toFixed(2),
        totalOvertimePay: totals.totalOvertimePay.toFixed(2),
        totalPay: totals.totalPay.toFixed(2),
        totalTaxDeduction: totals.totalTaxDeduction.toFixed(2),
        totalNetPay: totals.totalNetPay.toFixed(2)
      },
      departmentTotals,
      payrollData
    }

    if (format === "csv") {
      // Generate CSV format
      const csvHeaders = "Employee Name,Department,Position,Base Salary,Working Days,Regular Hours,Overtime Hours,Hourly Rate,Regular Pay,Overtime Pay,Total Pay,Tax Deduction,Net Pay"
      const csvRows = payrollData.map(emp => 
        `"${emp.name}","${emp.department}","${emp.position}","${emp.baseSalary}","${emp.workingDays}","${emp.regularHours}","${emp.overtimeHours}","${emp.hourlyRate}","${emp.regularPay}","${emp.overtimePay}","${emp.totalPay}","${emp.taxDeduction}","${emp.netPay}"`
      ).join("\n")
      
      const csvContent = csvHeaders + "\n" + csvRows
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payroll-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })
  } catch (error) {
    console.error("Error generating payroll report:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to generate payroll report"
    }, { status: 500 })
  }
}
