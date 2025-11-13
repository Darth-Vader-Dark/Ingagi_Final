"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/auth/protected-route"
import InventoryDashboardContent from "../../dashboard/page"

export default function InventoryDashboardWithRestaurant() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string

  useEffect(() => {
    // Verify that the user is accessing their own restaurant
    if (user && user.restaurantId && user.restaurantId !== restaurantId) {
      // Redirect to their actual restaurant dashboard
      router.push(`/inventory/${user.restaurantId}/dashboard`)
    }
  }, [user, restaurantId, router])

  // If user doesn't have access to this restaurant, show loading
  if (!user || user.restaurantId !== restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["inventory"]}>
      <InventoryDashboardContent />
    </ProtectedRoute>
  )
}
