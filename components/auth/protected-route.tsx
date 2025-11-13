"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { hasFeature, isProOrAbove, isEnterprise, type TierId } from "@/lib/subscription-access"
import { Button } from "@/components/ui/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireAuth?: boolean
}

export function ProtectedRoute({ children, allowedRoles = [], requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [subLoading, setSubLoading] = useState(false)
  const [tier, setTier] = useState<TierId | undefined>(undefined)
  const [subStatus, setSubStatus] = useState<"active" | "expired" | "cancelled" | "trial" | undefined>(undefined)

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.replace("/login")
        return
      }

      // Check role permissions
      if (requireAuth && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.replace("/unauthorized")
        return
      }

      // Load subscription for establishment-scoped roles (skip super_admin)
      if (requireAuth && user && user.role !== "super_admin" && user.restaurantId) {
        setSubLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        fetch(`/api/restaurant/${user.restaurantId}`, { signal: controller.signal })
          .then(async (res) => {
            // handle non-OK gracefully
            let data: any = null
            try { data = await res.json() } catch (_) {}
            const est = data?.restaurant
            let t = est?.subscription?.tier as TierId | undefined
            let s = est?.subscription?.status as typeof subStatus
            // Auto-downgrade expired to core (non-blocking)
            if (s === "expired") {
              t = "core" as TierId
              s = "active" as typeof subStatus
            }
            setTier(t)
            setSubStatus(s)
          })
          .catch(() => {})
          .finally(() => {
            clearTimeout(timeoutId)
            setSubLoading(false)
          })
      }
    }
  }, [user, loading, router, allowedRoles, requireAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If no auth required or user is authenticated with proper role
  if (!requireAuth || (user && (allowedRoles.length === 0 || allowedRoles.includes(user.role)))) {
    // Subscription gating for establishment dashboards (skip super_admin)
    if (user && user.role !== "super_admin") {
      // Only block on cancelled; expired auto-downgrades to core (handled above)
      if (subStatus === "cancelled") {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto">!</div>
              <h2 className="text-xl font-semibold">Subscription Required</h2>
              <p className="text-muted-foreground">
                Your establishment's subscription is {subStatus}. Please renew or upgrade to continue using the dashboard.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => router.push("/pricing")}>View Plans</Button>
                <Button variant="outline" onClick={() => router.push("/settings")}>Manage Subscription</Button>
              </div>
            </div>
          </div>
        )
      }
    }

    return <>{children}</>
  }

  // User is not authenticated or doesn't have proper role
  return null
}
