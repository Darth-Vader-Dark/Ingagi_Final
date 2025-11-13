"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FixAccountPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkUser = async () => {
    if (!email) return
    
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/debug/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.user)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to check user account')
    } finally {
      setLoading(false)
    }
  }

  const fixUser = async () => {
    if (!email) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/fix-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.user)
        setError(null)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fix user account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Fix User Account</h1>
          <p className="text-muted-foreground">
            Debug and fix user account status issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check Account Status</CardTitle>
            <CardDescription>
              Enter the email address of the user whose account needs to be checked or fixed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={checkUser} 
                disabled={loading || !email}
                variant="outline"
              >
                Check Account
              </Button>
              <Button 
                onClick={fixUser} 
                disabled={loading || !email}
              >
                Fix Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Processing...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-600">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {result.name}</div>
                <div><strong>Email:</strong> {result.email}</div>
                <div><strong>Role:</strong> {result.role}</div>
                <div><strong>Restaurant ID:</strong> {result.restaurantId || 'None'}</div>
                <div><strong>Is Active:</strong> <span className={result.isActive ? 'text-green-600' : 'text-red-600'}>{result.isActive ? 'Yes' : 'No'}</span></div>
                <div><strong>Status:</strong> {result.status || 'Not set'}</div>
                <div><strong>Created:</strong> {new Date(result.createdAt).toLocaleDateString()}</div>
                <div><strong>Updated:</strong> {new Date(result.updatedAt).toLocaleDateString()}</div>
                {result.hasPassword && <div><strong>Password:</strong> <span className="text-green-600">Set</span></div>}
              </div>
              
              {result.allFields && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <p className="text-xs font-semibold mb-2">All Database Fields:</p>
                  <p className="text-xs text-gray-600">{result.allFields.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
