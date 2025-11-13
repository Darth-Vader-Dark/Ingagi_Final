"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RoomServicesPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const roomId = params.roomId as string
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/restaurant/${restaurantId}/rooms/${roomId}/services`)
      const data = await res.json()
      if (data.success) setServices(data.services)
    }
    if (restaurantId && roomId) load()
  }, [restaurantId, roomId])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Room Services</h1>
      {services.map((s) => (
        <Card key={s._id}>
          <CardHeader>
            <CardTitle>{s.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{s.description}</div>
            <div className="font-semibold mt-2">{Number(s.price).toFixed(2)} RWF</div>
          </CardContent>
        </Card>
      ))}
      {services.length === 0 && <div className="text-muted-foreground">No services available right now.</div>}
    </div>
  )
}


