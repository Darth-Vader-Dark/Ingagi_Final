import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, hashPassword, createUser, createEstablishment, generateToken } from "@/lib/auth"
import { generateEstablishmentID, generateUserID } from "@/lib/id-generator"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("API received body:", body)
    
    const { email, password, name, establishmentType, establishmentName, establishmentAddress, establishmentPhone, tinNumber } = body

    console.log("Extracted fields:")
    console.log("Email:", email, "Type:", typeof email, "Length:", email?.length)
    console.log("Password:", password, "Type:", typeof password, "Length:", password?.length)
    console.log("Name:", name, "Type:", typeof name, "Length:", name?.length)
    console.log("Establishment Type:", establishmentType, "Type:", typeof establishmentType)
    console.log("Establishment Name:", establishmentName, "Type:", typeof establishmentName, "Length:", establishmentName?.length)
    console.log("Establishment Address:", establishmentAddress, "Type:", typeof establishmentAddress, "Length:", establishmentAddress?.length)
    console.log("Establishment Phone:", establishmentPhone, "Type:", typeof establishmentPhone, "Length:", establishmentPhone?.length)
    console.log("TIN Number:", tinNumber, "Type:", typeof tinNumber, "Length:", tinNumber?.length)

    // Validate input
    if (!email || !password || !name || !establishmentType || !establishmentName || !establishmentAddress || !establishmentPhone || !tinNumber) {
      console.log("Validation failed - missing fields:")
      console.log("Email missing:", !email)
      console.log("Password missing:", !password)
      console.log("Name missing:", !name)
      console.log("Establishment Type missing:", !establishmentType)
      console.log("Establishment Name missing:", !establishmentName)
      console.log("Establishment Address missing:", !establishmentAddress)
      console.log("Establishment Phone missing:", !establishmentPhone)
      console.log("TIN Number missing:", !tinNumber)
      
      const missingFields = []
      if (!email) missingFields.push("email")
      if (!password) missingFields.push("password")
      if (!name) missingFields.push("name")
      if (!establishmentType) missingFields.push("establishmentType")
      if (!establishmentName) missingFields.push("establishmentName")
      if (!establishmentAddress) missingFields.push("establishmentAddress")
      if (!establishmentPhone) missingFields.push("establishmentPhone")
      if (!tinNumber) missingFields.push("tinNumber")
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields 
        },
        { status: 400 }
      )
    }

    // Validate establishment type
    if (!["restaurant", "cafe", "hotel", "bakery"].includes(establishmentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid establishment type" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate custom IDs
    const establishmentCustomId = await generateEstablishmentID()
    const userCustomId = await generateUserID()
    
    console.log("Generated IDs:", { establishmentCustomId, userCustomId })
    
    // Create establishment first
    const establishment = await createEstablishment({
      customId: establishmentCustomId,
      name: establishmentName,
      type: establishmentType,
      description: `${establishmentName} - A new ${establishmentType} on Ingagi`,
      location: establishmentAddress,
      phone: establishmentPhone,
      email: email,
      website: "",
      tinNumber: tinNumber,
      hours: {
        open: "08:00",
        close: "22:00",
        daysOpen: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      },
      logo: "",
      banner: "",
      amenities: [],
      theme: {
        primaryColor: "#059669",
        secondaryColor: "#10b981",
        fontFamily: "Inter"
      },
      socialMedia: {
        facebook: "",
        instagram: "",
        twitter: ""
      },
      // Type-specific fields
      restaurant: establishmentType === "restaurant" ? {
        cuisine: "General",
        specialties: []
      } : undefined,
      cafe: establishmentType === "cafe" ? {
        coffeeTypes: ["Espresso", "Cappuccino", "Latte"],
        foodService: true,
        wifi: true,
        outdoorSeating: false
      } : undefined,
      hotel: establishmentType === "hotel" ? {
        starRating: 3,
        roomTypes: [],
        amenities: [],
        services: [],
        checkInTime: "14:00",
        checkOutTime: "11:00",
        rooms: []
      } : undefined,
      bakery: establishmentType === "bakery" ? {
        specialties: [],
        hasCustomCakes: true
      } : undefined,
      // New subscription system - starts with Core tier
      subscription: {
        tier: "core",
        status: "trial",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        autoRenew: false,
        features: [
          "Basic Menu Management",
          "Order Processing",
          "Employee Management (up to 5)",
          "Basic Analytics Dashboard",
          "QR Code Generation",
          "Customer Feedback System",
          "Basic Inventory Tracking",
          "Email Support",
          "Mobile App Access",
          "Basic Reporting"
        ],
        limits: {
          employees: 5,
          menuItems: 50,
          orders: 1000,
          analytics: false,
          aiFeatures: false,
          whiteLabel: false,
          customDomain: false,
          prioritySupport: false,
          apiCalls: 1000,
          storage: "1GB",
          integrations: 2
        }
      },
      isApproved: false, // Requires admin approval
      ownerId: "", // Will be set after user creation
    })

    // Create user
    const defaultRole = establishmentType === "hotel" ? "hotel_manager" : "manager"
    const user = await createUser({
      customId: userCustomId,
      email,
      password: hashedPassword,
      name,
      role: defaultRole as any,
      restaurantId: establishment._id!,
      phone: establishmentPhone,
    })

    // Update establishment with owner ID (use ObjectId for _id filter)
    // Note: In a real app, you'd want to use a transaction for this
    const { db } = await connectToDatabase()
    await db.collection('establishments').updateOne(
      { _id: new ObjectId(establishment._id!) },
      { $set: { ownerId: user._id } }
    )

    // Generate JWT token
    const token = generateToken(user)

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        establishmentName: establishment.name,
        establishmentType: establishment.type
      },
      establishment,
      message: `Registration successful! Your ${establishmentType} "${establishmentName}" has been submitted for approval. You will receive an email notification once approved. You can then sign in to access your manager dashboard.`,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
