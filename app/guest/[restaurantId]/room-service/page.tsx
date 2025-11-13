"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function GuestRoomService() {
  const params = useParams()
  const search = useSearchParams()
  const restaurantId = params.restaurantId as string
  const [form, setForm] = useState({ roomNumber: "", name: "", request: "" })
  const [lockedRoom, setLockedRoom] = useState(false)
  const [status, setStatus] = useState("")

  useEffect(() => {
    const room = search.get('room')
    if (room) {
      setForm(prev => ({ ...prev, roomNumber: room }))
      setLockedRoom(true)
    }
  }, [search])

  const submit = async () => {
    try {
      setStatus("Submitting...")
      const res = await fetch(`/api/public/${restaurantId}/room-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: form.roomNumber,
          guestName: form.name,
          details: form.request,
          source: 'qr'
        })
      })
      if (res.ok) {
        setStatus("Request sent. Thank you!")
        setForm({ roomNumber: lockedRoom ? form.roomNumber : "", name: "", request: "" })
      } else {
        const e = await res.json()
        setStatus(e.error || "Failed to submit request")
      }
    } catch (e) {
      setStatus("Failed to submit request")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Room Service Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Room Number</Label>
            <Input value={form.roomNumber} onChange={e=>setForm({...form, roomNumber: e.target.value})} disabled={lockedRoom} />
          </div>
          <div>
            <Label>Your Name</Label>
            <Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <Label>Request Details</Label>
            <Textarea rows={4} value={form.request} onChange={e=>setForm({...form, request: e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={submit}>Submit</Button>
            <span className="text-sm text-muted-foreground">{status}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

