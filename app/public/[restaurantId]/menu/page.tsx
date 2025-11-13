"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PublicMenu() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const [menu, setMenu] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/restaurant/${restaurantId}/menu`)
      if (res.ok) {
        const data = await res.json()
        setMenu(data.menu || [])
      }
    }
    if (restaurantId) load()
  }, [restaurantId])

  return (
    <div className="min-h-screen p-6">
      <Card>
        <CardHeader>
          <CardTitle>Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map((item)=> (
              <div key={item._id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{item.name}</div>
                  {item.isAvailable === false && <Badge variant="secondary">Unavailable</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{item.description}</div>
                <div className="text-sm">Price: {item.price ? `RWF ${item.price}` : '—'}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

