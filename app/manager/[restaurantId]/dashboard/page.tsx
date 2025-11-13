"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ManagerDashboardContent from "../../dashboard/page"
import FeatureGate from "@/components/FeatureGate"

export default function ManagerDashboardWithRestaurant() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    // Debug logging
    console.log("ManagerDashboardWithRestaurant - Debug Info:")
    console.log("user:", user)
    console.log("authLoading:", authLoading)
    console.log("restaurantId from params:", restaurantId)
    console.log("user?.restaurantId:", user?.restaurantId)
    
    setDebugInfo(`User: ${user ? 'Loaded' : 'Not loaded'}, RestaurantId: ${restaurantId}, User RestaurantId: ${user?.restaurantId || 'None'}`)

    // Verify that the user is accessing their own restaurant
    if (user && user.restaurantId && user.restaurantId !== restaurantId) {
      console.log("Redirecting user to their actual restaurant dashboard")
      router.push(`/manager/${user.restaurantId}/dashboard`)
    }
    
    // If no user after auth load, redirect to login
    if (!authLoading && !user) {
      console.log("No user found after auth load, redirecting to login")
      router.push("/login")
    }
  }, [user, restaurantId, router, authLoading])

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // If no user, allow effect to handle redirect and render nothing
  if (!user) {
    return null
  }

  // If user doesn't have restaurantId, show error
  if (!user.restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">!</span>
          </div>
          <p className="text-red-600 font-semibold">Access Error</p>
          <p className="text-muted-foreground">Your account is not associated with any restaurant.</p>
          <p className="text-xs text-muted-foreground mt-4">{debugInfo}</p>
        </div>
      </div>
    )
  }

  // If user is accessing wrong restaurant, show loading while redirecting
  if (user.restaurantId !== restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white font-bold text-lg">→</span>
          </div>
          <p className="text-muted-foreground">Redirecting to your restaurant...</p>
          <p className="text-xs text-muted-foreground mt-4">{debugInfo}</p>
        </div>
      </div>
    )
  }

  // User is authenticated and accessing correct restaurant
  console.log("User authenticated and accessing correct restaurant, rendering dashboard")
  // If the establishment is cafe/bakery/hotel, redirect to specialized dashboards
  const estType = (user as any)?.establishmentType
  if (estType === "cafe") {
    router.push(`/cafe/${restaurantId}/dashboard`)
    return null
  }
  if (estType === "bakery") {
    router.push(`/bakery/${restaurantId}/dashboard`)
    return null
  }
  if (estType === "hotel") {
    router.push(`/hotel-manager/${restaurantId}/dashboard`)
    return null
  }
  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <ManagerDashboardContent />
    </ProtectedRoute>
  )
}
