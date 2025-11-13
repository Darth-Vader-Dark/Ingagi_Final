"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Smartphone, CreditCard, CheckCircle, AlertCircle } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  restaurantId: string
  onPaymentSuccess: (paymentId: string) => void
}

export function PaymentModal({ isOpen, onClose, cartItems, restaurantId, onPaymentSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">("mtn")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle")
  const [transactionId, setTransactionId] = useState("")

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 2000 // RWF 2,000 delivery fee
  const finalAmount = totalAmount + deliveryFee

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid phone number")
      return
    }

    setIsProcessing(true)
    setPaymentStatus("processing")

    try {
      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod,
          phoneNumber,
          amount: finalAmount,
          restaurantId,
          items: cartItems,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentStatus("success")
        setTransactionId(data.transactionId)
        setTimeout(() => {
          onPaymentSuccess(data.transactionId)
          onClose()
        }, 3000)
      } else {
        setPaymentStatus("failed")
        setTimeout(() => setPaymentStatus("idle"), 3000)
      }
    } catch (error) {
      console.error("Payment error:", error)
      setPaymentStatus("failed")
      setTimeout(() => setPaymentStatus("idle"), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="font-medium">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>RWF {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>RWF {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Total</span>
                <span>RWF {finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {paymentStatus === "idle" && (
            <>
              {/* Payment Method Selection */}
              <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "mtn" | "airtel")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mtn" className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span>MTN Money</span>
                  </TabsTrigger>
                  <TabsTrigger value="airtel" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Airtel Money</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mtn" className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Smartphone className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="font-medium">MTN Mobile Money</h3>
                    <p className="text-sm text-muted-foreground">Pay securely with MTN MoMo</p>
                  </div>
                </TabsContent>

                <TabsContent value="airtel" className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="font-medium">Airtel Money</h3>
                    <p className="text-sm text-muted-foreground">Pay securely with Airtel Money</p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  placeholder={paymentMethod === "mtn" ? "078X XXX XXX" : "073X XXX XXX"}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your {paymentMethod === "mtn" ? "MTN" : "Airtel"} number to receive payment prompt
                </p>
              </div>

              {/* Payment Button */}
              <Button onClick={handlePayment} disabled={isProcessing} className="w-full" size="lg">
                {isProcessing ? "Processing..." : `Pay RWF ${finalAmount.toLocaleString()}`}
              </Button>
            </>
          )}

          {paymentStatus === "processing" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Processing Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Please check your phone for the payment prompt and enter your PIN
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-600">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">Transaction ID: {transactionId}</p>
                <p className="text-sm text-muted-foreground">Your order has been confirmed</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Order Confirmed
              </Badge>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-red-600">Payment Failed</h3>
                <p className="text-sm text-muted-foreground">Please try again or contact support</p>
              </div>
              <Button variant="outline" onClick={() => setPaymentStatus("idle")} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
