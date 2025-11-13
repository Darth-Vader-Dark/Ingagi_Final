"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role and establishment
      const redirectPath = getRoleRedirectPath(user.role, user.restaurantId, (user as any)?.establishmentType)
      console.log("Dashboard redirecting to:", redirectPath)
      router.push(redirectPath)
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      console.log("No user found, redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  const getRoleRedirectPath = (role: string, restaurantId?: string, establishmentType?: string) => {
    // For non-super-admin roles, require restaurantId
    if (role !== "super_admin" && !restaurantId) {
      console.log("No restaurantId available for role:", role)
      return "/login" // Redirect back to login if no restaurantId
    }

    switch (role) {
      case "super_admin":
        return "/admin/dashboard"
      case "restaurant_admin":
        return `/restaurant/dashboard`
      case "manager":
        if (establishmentType === "cafe") return `/cafe/${restaurantId}/dashboard`
        if (establishmentType === "bakery") return `/bakery/${restaurantId}/dashboard`
        if (establishmentType === "hotel") return `/hotel-manager/${restaurantId}/dashboard`
        return `/manager/${restaurantId}/dashboard`
      case "waiter":
        return `/waiter/${restaurantId}/dashboard`
      case "receptionist":
        return `/receptionist/${restaurantId}/dashboard`
      case "kitchen":
        return `/kitchen/${restaurantId}/dashboard`
      case "inventory":
        return `/inventory/${restaurantId}/dashboard`
      case "maintenance":
        return `/maintenance/${restaurantId}/dashboard`
      case "housekeeping":
        return `/housekeeping/${restaurantId}/dashboard`
      case "hr":
        return `/hr/${restaurantId}/dashboard`
      case "accountant":
        return `/accountant/${restaurantId}/dashboard`
      default:
        return "/login"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle>Loading Dashboard</CardTitle>
            <CardDescription>Redirecting you to the appropriate dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Redirecting...</CardTitle>
          <CardDescription>Please wait while we redirect you to your dashboard.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
