"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function DebugAuthPage() {
  const { user, loading, logout } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>({})

  useEffect(() => {
    // Get localStorage data
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    setLocalStorageData({
      token: token ? `${token.substring(0, 20)}...` : 'None',
      user: userData ? JSON.parse(userData) : 'None'
    })
  }, [])

  const clearAuth = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    logout()
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Information</CardTitle>
            <CardDescription>
              Check the current authentication status and user data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Current Auth State */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Authentication State</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Loading:</span> {loading ? 'True' : 'False'}
                </div>
                <div>
                  <span className="font-medium">User:</span> {user ? 'Loaded' : 'Not loaded'}
                </div>
                <div>
                  <span className="font-medium">User Role:</span> {user?.role || 'None'}
                </div>
                <div>
                  <span className="font-medium">Restaurant ID:</span> {user?.restaurantId || 'None'}
                </div>
              </div>
            </div>

            {/* User Object Details */}
            {user && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">User Object Details</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* LocalStorage Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">LocalStorage Data</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(localStorageData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="flex gap-4">
                <Button onClick={clearAuth} variant="destructive">
                  Clear Authentication
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Navigation</h3>
              <div className="flex gap-4">
                <Button onClick={() => window.location.href = '/login'}>
                  Go to Login
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
                {user?.restaurantId && (
                  <Button onClick={() => window.location.href = `/manager/${user.restaurantId}/dashboard`}>
                    Go to Manager Dashboard
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
