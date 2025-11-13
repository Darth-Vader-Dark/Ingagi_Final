import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // For now, return mock audit logs
    // In a real app, this would query the database for actual audit logs
    const mockAuditLogs = [
      {
        id: "AUDIT-001",
        action: "User Login",
        user: "admin@ingagi.com",
        target: "System",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        details: "Successful login from 192.168.1.100",
        ipAddress: "192.168.1.100"
      },
      {
        id: "AUDIT-002",
        action: "Restaurant Approved",
        user: "admin@ingagi.com",
        target: "Kigali Heights Hotel",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        details: "Restaurant approval status changed to approved",
        ipAddress: "192.168.1.100"
      },
      {
        id: "AUDIT-003",
        action: "User Role Changed",
        user: "admin@ingagi.com",
        target: "john@restaurant.com",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        details: "User role changed from waiter to manager",
        ipAddress: "192.168.1.100"
      },
      {
        id: "AUDIT-004",
        action: "Subscription Updated",
        user: "admin@ingagi.com",
        target: "Café Rwanda",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        details: "Subscription tier upgraded from core to pro",
        ipAddress: "192.168.1.100"
      },
      {
        id: "AUDIT-005",
        action: "User Deactivated",
        user: "admin@ingagi.com",
        target: "former@employee.com",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        details: "User account deactivated due to termination",
        ipAddress: "192.168.1.100"
      }
    ]

    return NextResponse.json({
      success: true,
      logs: mockAuditLogs
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
