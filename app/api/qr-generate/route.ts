import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const { url, size = 200 } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      )
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      success: true,
      qrCode: qrDataUrl
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate QR code" },
      { status: 500 }
    )
  }
}

