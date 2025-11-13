"use client"

import { useMemo } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QRCodeCanvas } from "qrcode.react"

export default function QRRoomPage() {
  const params = useParams()
  const search = useSearchParams()
  const restaurantId = params.restaurantId as string
  const room = search.get("room") || ""

  const base = typeof window !== "undefined" ? window.location.origin : ""
  const roomServiceUrl = useMemo(() => `${base}/guest/${restaurantId}/room-service${room ? `?room=${encodeURIComponent(room)}` : ''}`, [base, restaurantId, room])

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Room Service QR</CardTitle>
          <CardDescription>Scan to open the guest room service request page</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeCanvas value={roomServiceUrl || ""} size={300} includeMargin={true} />
          </div>
          <div className="text-sm text-muted-foreground break-all text-center">{roomServiceUrl}</div>
          <div className="flex gap-2">
            <Button onClick={() => window.print()}>Print</Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(roomServiceUrl)}>Copy URL</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

