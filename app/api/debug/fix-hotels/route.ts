import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get all establishments
    const establishments = await db.collection("establishments").find({}).toArray()
    
    const results = []
    
    for (const establishment of establishments) {
      const name = establishment.name?.toLowerCase() || ""
      const description = establishment.description?.toLowerCase() || ""
      let detectedType = establishment.type
      let reason = "No change needed"
      
      // Detect hotel
      if (name.includes("hotel") || description.includes("hotel") || 
          (establishment.hotel && Object.keys(establishment.hotel).length > 0)) {
        detectedType = "hotel"
        reason = "Detected as hotel"
      }
      
      // Detect cafe
      else if (name.includes("cafe") || name.includes("coffee") || 
               description.includes("cafe") || description.includes("coffee")) {
        detectedType = "cafe"
        reason = "Detected as cafe"
      }
      
      // Detect bakery
      else if (name.includes("bakery") || name.includes("bake") || 
               description.includes("bakery") || description.includes("bake")) {
        detectedType = "bakery"
        reason = "Detected as bakery"
      }
      
      // Detect bar
      else if (name.includes("bar") || name.includes("pub") || 
               description.includes("bar") || description.includes("pub")) {
        detectedType = "bar"
        reason = "Detected as bar"
      }
      
      // Detect restaurant (if it has restaurant data or is clearly a restaurant)
      else if ((establishment.restaurant && Object.keys(establishment.restaurant).length > 0) ||
               name.includes("restaurant") || description.includes("restaurant")) {
        detectedType = "restaurant"
        reason = "Detected as restaurant"
      }
      
      // Update if type changed
      if (detectedType !== establishment.type) {
        await db.collection("establishments").updateOne(
          { _id: establishment._id },
          { 
            $set: { 
              type: detectedType,
              updatedAt: new Date()
            } 
          }
        )
        
        results.push({
          id: establishment._id.toString(),
          name: establishment.name,
          oldType: establishment.type,
          newType: detectedType,
          reason: reason
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${results.length} establishments`,
      results: results
    })
  } catch (error) {
    console.error("Error fixing establishment types:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fix establishment types" },
      { status: 500 }
    )
  }
}
