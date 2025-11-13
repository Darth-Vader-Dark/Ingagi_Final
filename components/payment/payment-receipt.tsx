"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, Share } from "lucide-react"

interface PaymentReceiptProps {
  orderId: string
  transactionId: string
  restaurantName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalAmount: number
  paymentMethod: "mtn" | "airtel"
  phoneNumber: string
  timestamp: string
}

export function PaymentReceipt({
  orderId,
  transactionId,
  restaurantName,
  items,
  totalAmount,
  paymentMethod,
  phoneNumber,
  timestamp,
}: PaymentReceiptProps) {
  const handleDownload = () => {
    // Generate PDF receipt (implement with jsPDF or similar)
    console.log("Downloading receipt...")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Order Receipt",
        text: `Order #${orderId} - RWF ${totalAmount.toLocaleString()}`,
        url: window.location.href,
      })
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-green-600">Payment Successful!</CardTitle>
        <p className="text-sm text-muted-foreground">Your order has been confirmed</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID:</span>
            <span className="font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction ID:</span>
            <span className="font-mono">{transactionId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Restaurant:</span>
            <span>{restaurantName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date & Time:</span>
            <span>{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-medium">Order Items</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>RWF {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Method:</span>
            <Badge variant="outline">{paymentMethod === "mtn" ? "MTN Money" : "Airtel Money"}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone Number:</span>
            <span>{phoneNumber}</span>
          </div>
          <div className="flex justify-between font-medium text-lg">
            <span>Total Paid:</span>
            <span>RWF {totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownload} className="flex-1 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleShare} className="flex-1 bg-transparent">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-3">
          <p>Thank you for choosing {restaurantName}!</p>
          <p>Powered by Ingagi ERP System</p>
        </div>
      </CardContent>
    </Card>
  )
}
