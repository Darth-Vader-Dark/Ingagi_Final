"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  available: boolean
  isAlcoholic?: boolean
}

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <div className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
      <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">{item.name}</h3>
          {item.isAlcoholic && (
            <Badge variant="outline" className="text-xs">
              21+
            </Badge>
          )}
          {!item.available && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        <p className="font-bold text-primary mt-2">RWF {item.price.toLocaleString()}</p>
      </div>
      <Button onClick={() => onAddToCart(item)} disabled={!item.available} size="sm">
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  )
}
