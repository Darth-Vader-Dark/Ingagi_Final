"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugRestaurantPage() {
  const [restaurantId, setRestaurantId] = useState("")
  const [restaurantData, setRestaurantData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const checkRestaurantStatus = async () => {
    if (!restaurantId) return
    
    setLoading(true)
    setError("")
    setRestaurantData(null)
    
    try {
      // Check restaurant status
      const statusResponse = await fetch(`/api/debug/restaurant-status?id=${restaurantId}`)
      const statusData = await statusResponse.json()
      
      if (statusResponse.ok) {
        setRestaurantData(statusData.restaurant)
      } else {
        setError(statusData.error || "Failed to fetch restaurant status")
      }
    } catch (error) {
      setError("Error checking restaurant status")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const checkFeaturedRestaurants = async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/restaurants/featured')
      const data = await response.json()
      
      if (response.ok) {
        setRestaurantData({
          featuredRestaurants: data.restaurants,
          count: data.restaurants?.length || 0
        })
      } else {
        setError(data.error || "Failed to fetch featured restaurants")
      }
    } catch (error) {
      setError("Error fetching featured restaurants")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Restaurant Approval Debug</h1>
          <p className="text-muted-foreground">
            Use this page to debug restaurant approval status issues
          </p>
        </div>

        {/* Check Specific Restaurant */}
        <Card>
          <CardHeader>
            <CardTitle>Check Restaurant Status</CardTitle>
            <CardDescription>
              Enter your restaurant ID to check its approval status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter restaurant ID..."
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={checkRestaurantStatus} disabled={loading || !restaurantId}>
                {loading ? "Checking..." : "Check Status"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Check Featured Restaurants */}
        <Card>
          <CardHeader>
            <CardTitle>Check Featured Restaurants</CardTitle>
            <CardDescription>
              See which restaurants are currently featured on the homepage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkFeaturedRestaurants} disabled={loading}>
              {loading ? "Checking..." : "Check Featured Restaurants"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {restaurantData && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(restaurantData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Get Your Restaurant ID</h4>
              <p className="text-sm text-muted-foreground">
                Go to your manager dashboard and copy the restaurant ID from the URL or dashboard
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Step 2: Check Status</h4>
              <p className="text-sm text-muted-foreground">
                Paste the ID above and click "Check Status" to see your restaurant's approval details
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Step 3: Check Featured List</h4>
              <p className="text-sm text-muted-foreground">
                Click "Check Featured Restaurants" to see which restaurants appear on the homepage
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Common Issues</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Field name mismatch: <code>isApproved</code> vs <code>approved</code></li>
                <li>Boolean vs string values: <code>true</code> vs <code>"approved"</code></li>
                <li>Missing approval field in database</li>
                <li>Restaurant not in featured list</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
