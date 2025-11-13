import { type NextRequest, NextResponse } from "next/server"

interface PaymentRequest {
  paymentMethod: "mtn" | "airtel"
  phoneNumber: string
  amount: number
  restaurantId: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

// Mock payment processing - In production, integrate with actual MTN/Airtel APIs
export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()
    const { paymentMethod, phoneNumber, amount, restaurantId, items } = body

    // Validate request
    if (!paymentMethod || !phoneNumber || !amount || !restaurantId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = paymentMethod === "mtn" ? /^078\d{7}$/ : /^073\d{7}$/
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      return NextResponse.json({ success: false, error: "Invalid phone number format" }, { status: 400 })
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock payment gateway integration
    const paymentResult = await processPayment({
      method: paymentMethod,
      phone: phoneNumber,
      amount,
      reference: `ORDER_${Date.now()}`,
    })

    if (paymentResult.success) {
      // Save order to database (mock)
      const order = {
        id: `order_${Date.now()}`,
        restaurantId,
        items,
        amount,
        paymentMethod,
        phoneNumber,
        transactionId: paymentResult.transactionId,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      }

      // In production, save to MongoDB
      console.log("Order saved:", order)

      // Optionally record tip
      const tipAmount = (body as any).tipAmount
      const providerUserId = (body as any).providerUserId
      const providerRole = (body as any).providerRole
      if (typeof tipAmount === 'number' && tipAmount > 0) {
        console.log("Tip recorded:", { amount: tipAmount, providerUserId, providerRole })
        // In production, insert into tips collection
      }

      return NextResponse.json({
        success: true,
        transactionId: paymentResult.transactionId,
        orderId: order.id,
        message: "Payment processed successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || "Payment processing failed",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Mock payment gateway function
async function processPayment(params: {
  method: "mtn" | "airtel"
  phone: string
  amount: number
  reference: string
}) {
  // Simulate API call to MTN/Airtel payment gateway
  const { method, phone, amount, reference } = params

  // Mock success/failure (90% success rate)
  const isSuccess = Math.random() > 0.1

  if (isSuccess) {
    return {
      success: true,
      transactionId: `${method.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reference,
      amount,
      phone,
    }
  } else {
    return {
      success: false,
      error: "Payment declined. Please check your balance and try again.",
    }
  }
}

// Get payment status endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get("transactionId")

  if (!transactionId) {
    return NextResponse.json({ success: false, error: "Transaction ID required" }, { status: 400 })
  }

  // Mock payment status check
  return NextResponse.json({
    success: true,
    status: "completed",
    transactionId,
    amount: 15000,
    timestamp: new Date().toISOString(),
  })
}
