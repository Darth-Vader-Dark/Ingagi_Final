import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid restaurant ID" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Try to fetch real table data from the database
    let tables = []
    
    try {
      // Check if tables collection exists and has data for this restaurant
      const tableCount = await db.collection("tables").countDocuments({ restaurantId: id })
      
      if (tableCount > 0) {
        // Fetch real tables from the database
        tables = await db.collection("tables")
          .find({ restaurantId: id })
          .sort({ number: 1 })
          .toArray()
        
        // Format table data
        tables = tables.map(table => ({
          number: table.number,
          status: table.status,
          customers: table.customers || 0,
          waiter: table.waiter || "",
          orderValue: table.orderValue || 0
        }))
      } else {
        // Create default tables for this restaurant if none exist
        const defaultTables = [
          { number: "1", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "2", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "3", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "4", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "5", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "6", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "7", status: "available", customers: 0, waiter: "", orderValue: 0 },
          { number: "8", status: "available", customers: 0, waiter: "", orderValue: 0 },
        ]
        
        // Insert default tables for this restaurant
        const tableDocuments = defaultTables.map(table => ({
          ...table,
          restaurantId: id,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
        
        await db.collection("tables").insertMany(tableDocuments)
        tables = defaultTables
      }
    } catch (tableError) {
      console.error("Error with tables collection, using defaults:", tableError)
      // Fallback to default tables if there's an error
      tables = [
        { number: "1", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "2", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "3", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "4", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "5", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "6", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "7", status: "available", customers: 0, waiter: "", orderValue: 0 },
        { number: "8", status: "available", customers: 0, waiter: "", orderValue: 0 },
      ]
    }

    return NextResponse.json({
      success: true,
      tables: tables
    })
  } catch (error) {
    console.error("Error fetching restaurant tables:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch restaurant tables" },
      { status: 500 }
    )
  }
}
