"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DemoIDsPage() {
  const [nextIDs, setNextIDs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const fetchNextIDs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug')
      if (response.ok) {
        const data = await response.json()
        console.log("Debug data:", data)
        
        // Show what would be the next IDs
        const establishments = data.data.establishments || []
        const users = data.data.users || []
        
        const nextEstablishment = establishments.length + 1
        const nextUser = users.length + 1
        
        setNextIDs({
          'Establishments': `EST-${nextEstablishment.toString().padStart(4, '0')}`,
          'Users': `USR-${nextUser.toString().padStart(4, '0')}`,
          'Orders': `ORD-${(Math.floor(Math.random() * 1000) + 1).toString().padStart(6, '0')}`,
          'Menu Items': `MENU-${(Math.floor(Math.random() * 100) + 1).toString().padStart(4, '0')}`,
          'Tables': `TBL-${(Math.floor(Math.random() * 100) + 1).toString().padStart(3, '0')}`,
          'Inventory': `INV-${(Math.floor(Math.random() * 100) + 1).toString().padStart(4, '0')}`,
        })
      }
    } catch (error) {
      console.error("Error fetching debug data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Human-Readable ID System</h1>
          <p className="text-xl text-muted-foreground">
            Instead of random MongoDB ObjectIds, we now use meaningful, sequential IDs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Before</Badge>
                Random ObjectIds
              </CardTitle>
              <CardDescription>
                Hard to read and debug
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm bg-muted p-2 rounded">
                68aaec984b8f8a9157ad8b77
              </div>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                68ab31aa4b8f8a9157ad8b79
              </div>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                68ab31ad4b8f8a9157ad8b7a
              </div>
              <p className="text-xs text-muted-foreground">
                These are impossible to remember or identify at a glance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="default">After</Badge>
                Human-Readable IDs
              </CardTitle>
              <CardDescription>
                Easy to read and understand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm bg-primary/10 p-2 rounded border border-primary/20">
                EST-0001
              </div>
              <div className="font-mono text-sm bg-primary/10 p-2 rounded border border-primary/20">
                USR-0001
              </div>
              <div className="font-mono text-sm bg-primary/10 p-2 rounded border border-primary/20">
                ORD-000001
              </div>
              <p className="text-xs text-muted-foreground">
                Clear, sequential, and easy to identify
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ID Format Examples</CardTitle>
            <CardDescription>
              Each entity type has its own prefix and numbering system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">EST-0001</div>
                <p className="text-sm text-muted-foreground">Establishment</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">USR-0001</div>
                <p className="text-sm text-muted-foreground">User</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">ORD-000001</div>
                <p className="text-sm text-muted-foreground">Order</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">MENU-0001</div>
                <p className="text-sm text-muted-foreground">Menu Item</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">TBL-001</div>
                <p className="text-sm text-muted-foreground">Table</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">INV-0001</div>
                <p className="text-sm text-muted-foreground">Inventory</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">RES-000001</div>
                <p className="text-sm text-muted-foreground">Reservation</p>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-primary">PAY-000001</div>
                <p className="text-sm text-muted-foreground">Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Database Status</CardTitle>
            <CardDescription>
              See what IDs would be generated next
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <Button onClick={fetchNextIDs} disabled={loading}>
                {loading ? "Loading..." : "Check Next IDs"}
              </Button>
            </div>
            
            {Object.keys(nextIDs).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(nextIDs).map(([entity, id]) => (
                  <div key={entity} className="text-center p-4 bg-muted rounded-lg">
                    <div className="font-mono text-lg font-bold text-primary">{id}</div>
                    <p className="text-sm text-muted-foreground">{entity}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="font-semibold">Easy Debugging</h3>
              <p className="text-muted-foreground">Quickly identify entities in logs and databases</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📱</div>
              <h3 className="font-semibold">User Friendly</h3>
              <p className="text-muted-foreground">Customers can easily reference their orders</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="font-semibold">Sequential</h3>
              <p className="text-muted-foreground">Predictable numbering for business operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
