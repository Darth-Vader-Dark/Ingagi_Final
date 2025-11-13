"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"

interface TestResult {
  endpoint: string
  status: 'pending' | 'success' | 'error' | 'timeout'
  response?: any
  error?: string
  duration?: number
}

export default function DebugAPIPage() {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      })
      
      const duration = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        return {
          endpoint,
          status: 'success',
          response: data,
          duration
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        return {
          endpoint,
          status: 'error',
          error: errorData.error || `HTTP ${response.status}`,
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const tests: Array<() => Promise<TestResult>> = [
      // Basic connectivity
      () => testEndpoint('/api/test'),
      
      // Auth endpoints
      () => testEndpoint('/api/auth/verify', 'POST', { token: 'test' }),
      
      // Restaurant endpoints (if user has restaurantId)
      ...(user?.restaurantId ? [
        () => testEndpoint(`/api/restaurant/${user.restaurantId}`),
        () => testEndpoint(`/api/restaurant/${user.restaurantId}/menu`),
        () => testEndpoint(`/api/restaurant/${user.restaurantId}/employees`),
        () => testEndpoint(`/api/restaurant/${user.restaurantId}/subscription`),
        () => testEndpoint(`/api/restaurant/${user.restaurantId}/promotions`),
        () => testEndpoint(`/api/restaurant/${user.restaurantId}/orders`),
      ] : []),
      
      // Admin endpoints
      () => testEndpoint('/api/admin/users'),
      () => testEndpoint('/api/stats/platform'),
    ]

    const results: TestResult[] = []
    
    for (const test of tests) {
      const result = await test()
      results.push(result)
      setTestResults([...results])
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setIsRunning(false)
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>
      case 'success': return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error': return <Badge variant="destructive">Error</Badge>
      case 'timeout': return <Badge variant="destructive">Timeout</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Diagnostic Tool</CardTitle>
            <CardDescription>
              Test all API endpoints to identify connectivity and functionality issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={runAllTests} disabled={isRunning}>
                  {isRunning ? 'Running Tests...' : 'Run All Tests'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setTestResults([])}
                  disabled={isRunning}
                >
                  Clear Results
                </Button>
              </div>

              {user && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-700 mb-2">Current User:</h4>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>ID: {user._id}</div>
                    <div>Email: {user.email}</div>
                    <div>Role: {user.role}</div>
                    <div>Restaurant ID: {user.restaurantId || 'None'}</div>
                  </div>
                </div>
              )}

              {testResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Results</h3>
                  
                  {testResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{result.endpoint}</span>
                            {getStatusBadge(result.status)}
                          </div>
                          {result.duration && (
                            <span className="text-xs text-muted-foreground">
                              {result.duration}ms
                            </span>
                          )}
                        </div>
                        
                        {result.status === 'success' && result.response && (
                          <div className="text-xs bg-green-50 p-2 rounded">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {result.status === 'error' && result.error && (
                          <div className="text-xs bg-red-50 p-2 rounded text-red-700">
                            {result.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {testResults.length === 0 && !isRunning && (
                <div className="text-center text-muted-foreground py-8">
                  Click "Run All Tests" to start testing API endpoints
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
