import { connectToDatabase } from "./mongodb"

export interface IDConfig {
  prefix: string
  padding: number
  startNumber: number
}

const ID_CONFIGS: Record<string, IDConfig> = {
  establishments: { prefix: "EST", padding: 4, startNumber: 1 },
  users: { prefix: "USR", padding: 4, startNumber: 1 },
  orders: { prefix: "ORD", padding: 6, startNumber: 1 },
  menuItems: { prefix: "MENU", padding: 4, startNumber: 1 },
  tables: { prefix: "TBL", padding: 3, startNumber: 1 },
  inventory: { prefix: "INV", padding: 4, startNumber: 1 },
  reservations: { prefix: "RES", padding: 6, startNumber: 1 },
  payments: { prefix: "PAY", padding: 6, startNumber: 1 }
}

export async function generateUniqueID(collection: string): Promise<string> {
  try {
    const { db } = await connectToDatabase()
    const config = ID_CONFIGS[collection]
    
    if (!config) {
      throw new Error(`No ID configuration found for collection: ${collection}`)
    }

    // Find the highest existing ID for this collection
    const pipeline = [
      {
        $match: {
          customId: { $regex: `^${config.prefix}-` }
        }
      },
      {
        $addFields: {
          numberPart: {
            $toInt: {
              $substr: ["$customId", config.prefix.length + 1, -1]
            }
          }
        }
      },
      {
        $sort: { numberPart: -1 }
      },
      {
        $limit: 1
      }
    ]

    const result = await db.collection(collection).aggregate(pipeline).toArray()
    
    let nextNumber = config.startNumber
    if (result.length > 0 && result[0].numberPart) {
      nextNumber = result[0].numberPart + 1
    }

    // Generate the new ID with proper padding
    const paddedNumber = nextNumber.toString().padStart(config.padding, '0')
    const newID = `${config.prefix}-${paddedNumber}`

    return newID
  } catch (error) {
    console.error(`Error generating ID for ${collection}:`, error)
    // Fallback to timestamp-based ID if database connection fails
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${ID_CONFIGS[collection]?.prefix || 'ID'}-${timestamp}-${random}`
  }
}

export async function generateEstablishmentID(): Promise<string> {
  return generateUniqueID('establishments')
}

export async function generateUserID(): Promise<string> {
  return generateUniqueID('users')
}

export async function generateOrderID(): Promise<string> {
  return generateUniqueID('orders')
}

export async function generateMenuItemID(): Promise<string> {
  return generateUniqueID('menuItems')
}

export async function generateTableID(): Promise<string> {
  return generateUniqueID('tables')
}

export async function generateInventoryID(): Promise<string> {
  return generateUniqueID('inventory')
}

export async function generateReservationID(): Promise<string> {
  return generateUniqueID('reservations')
}

export async function generatePaymentID(): Promise<string> {
  return generateUniqueID('payments')
}

// Helper function to validate custom IDs
export function isValidCustomID(id: string, expectedPrefix: string): boolean {
  const config = ID_CONFIGS[expectedPrefix.toLowerCase()]
  if (!config) return false
  
  const regex = new RegExp(`^${config.prefix}-\\d{${config.padding}}$`)
  return regex.test(id)
}

// Function to get the next ID without creating it (for display purposes)
export async function getNextID(collection: string): Promise<string> {
  try {
    const { db } = await connectToDatabase()
    const config = ID_CONFIGS[collection]
    
    if (!config) {
      throw new Error(`No ID configuration found for collection: ${collection}`)
    }

    const result = await db.collection(collection)
      .find({ customId: { $regex: `^${config.prefix}-` } })
      .sort({ customId: -1 })
      .limit(1)
      .toArray()

    let nextNumber = config.startNumber
    if (result.length > 0 && result[0].customId) {
      const numberPart = result[0].customId.substring(config.prefix.length + 1)
      const currentNumber = parseInt(numberPart, 10)
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1
      }
    }

    const paddedNumber = nextNumber.toString().padStart(config.padding, '0')
    return `${config.prefix}-${paddedNumber}`
  } catch (error) {
    console.error(`Error getting next ID for ${collection}:`, error)
    return `${ID_CONFIGS[collection]?.prefix || 'ID'}-???`
  }
}
