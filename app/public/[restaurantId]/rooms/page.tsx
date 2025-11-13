"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PublicRooms() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/hotel/${restaurantId}/rooms`)
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    }
    if (restaurantId) load()
  }, [restaurantId])

  return (
    <div className="min-h-screen p-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.filter(r=>r.status==='available').map((room)=> (
              <div key={room._id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{room.name || room.number}</div>
                  <Badge>Available</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Type: {room.type}</div>
                <div className="text-sm text-muted-foreground">Rate: {room.rate ? `RWF ${room.rate}` : '—'}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

