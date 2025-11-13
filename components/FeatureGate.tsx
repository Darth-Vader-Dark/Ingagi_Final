"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { hasFeature, type TierId } from "@/lib/subscription-access"

interface FeatureGateProps {
  feature: 'analytics' | 'ai' | 'customBranding' | 'customDomain' | 'prioritySupport' | 'advancedQR'
  fallback?: React.ReactNode
  children: React.ReactNode
}

export default function FeatureGate({ feature, fallback = null, children }: FeatureGateProps) {
  const { user } = useAuth()
  const [tier, setTier] = useState<TierId | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.restaurantId) {
          setLoading(false)
          return
        }
        const res = await fetch(`/api/restaurant/${user.restaurantId}`)
        const data = await res.json()
        const t = data?.restaurant?.subscription?.tier as TierId | undefined
        setTier(t)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.restaurantId])

  if (loading) return null
  if (!tier || !hasFeature(tier, feature)) return <>{fallback}</>
  return <>{children}</>
}


