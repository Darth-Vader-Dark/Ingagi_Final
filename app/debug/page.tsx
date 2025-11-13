"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>({})

  useEffect(() => {
    // Get localStorage data
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    setLocalStorageData({
      token: token ? `${token.substring(0, 20)}...` : null,
      user: userData ? JSON.parse(userData) : null
    })
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">useAuth Hook State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
              <p><strong>User:</strong></p>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">LocalStorage Data</h2>
            <div className="space-y-2">
              <p><strong>Token:</strong> {localStorageData.token || "None"}</p>
              <p><strong>User Data:</strong></p>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(localStorageData.user, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <button 
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded"
            >
              Clear LocalStorage & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
