"use client"

import { Loader2 } from "lucide-react"

export function GlobalLoading({ label = "Loading dashboard..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}


