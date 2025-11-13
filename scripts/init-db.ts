import dotenv from "dotenv"
import { connectToDatabase } from "../lib/mongodb"
import { hashPassword, createUser } from "../lib/auth"

// Load environment variables from .env.local for the script
dotenv.config({ path: '.env.local' })

async function initializeDatabase() {
  try {
    console.log("Connecting to MongoDB...")
    const { db } = await connectToDatabase()
    
    console.log("Creating database collections...")
    
    // Create collections with proper indexes
    await db.createCollection("users")
    await db.createCollection("restaurants")
    await db.createCollection("menuItems")
    await db.createCollection("orders")
    
    // Create indexes for better performance
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ restaurantId: 1 })
    await db.collection("users").createIndex({ role: 1 })
    
    await db.collection("restaurants").createIndex({ name: 1 })
    await db.collection("restaurants").createIndex({ ownerId: 1 })
    await db.collection("restaurants").createIndex({ isApproved: 1 })
    
    await db.collection("menuItems").createIndex({ restaurantId: 1 })
    await db.collection("menuItems").createIndex({ category: 1 })
    await db.collection("menuItems").createIndex({ isAvailable: 1 })
    
    await db.collection("orders").createIndex({ restaurantId: 1 })
    await db.collection("orders").createIndex({ status: 1 })
    await db.collection("orders").createIndex({ createdAt: 1 })
    
    console.log("Collections and indexes created successfully")
    
    // Check if super admin already exists
    const existingSuperAdmin = await db.collection("users").findOne({ role: "super_admin" })
    
    if (!existingSuperAdmin) {
      console.log("Creating super admin user...")
      
      const hashedPassword = await hashPassword("admin123")
      
      const superAdmin = await createUser({
        email: "superingagi@ingagi.com",
        password: hashedPassword,
        name: "Super Admin",
        role: "super_admin",
        phone: "+250 788 000 000"
      })
      
      console.log("Super admin created successfully:", superAdmin.email)
      console.log("Default password: admin123")
      console.log("⚠️  Please change this password after first login!")
    } else {
      console.log("Super admin already exists")
    }
    
    console.log("Database initialization completed successfully!")
    
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  }
}

// Run the initialization
initializeDatabase()
