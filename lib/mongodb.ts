import { MongoClient, type Db } from "mongodb"

// MongoDB Atlas connection string - should be in environment variables
const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('MONGODB_URI environment variable not found')
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')))
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Connection pooling with proper configuration for Windows SSL compatibility
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      // SSL/TLS configuration for Windows compatibility
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      // Additional options for Windows SSL compatibility
      authSource: 'admin',
      authMechanism: 'SCRAM-SHA-1'
    })
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    w: 'majority',
    // SSL/TLS configuration for production
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    authSource: 'admin',
    authMechanism: 'SCRAM-SHA-1'
  })
  clientPromise = client.connect()
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  try {
    const client = await clientPromise
    const db = client.db("ingagi")
    return { client, db }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    
    // Try a fallback connection with different SSL settings
    try {
      console.log('Attempting fallback connection with relaxed SSL settings...')
      const fallbackClient = new MongoClient(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 30000,
        retryWrites: false,
        w: 1,
        // Relaxed SSL settings for compatibility
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        authSource: 'admin',
        authMechanism: 'SCRAM-SHA-1'
      })
      
      await fallbackClient.connect()
      const db = fallbackClient.db("ingagi")
      console.log('Fallback connection successful')
      return { client: fallbackClient, db }
    } catch (fallbackError) {
      console.error('Fallback connection also failed:', fallbackError)
      
      // In development, reset the global connection if it's in an error state
      if (process.env.NODE_ENV === "development") {
        const globalWithMongo = global as typeof globalThis & {
          _mongoClientPromise?: Promise<MongoClient>
        }
        delete globalWithMongo._mongoClientPromise
      }
      
      throw new Error('Failed to connect to database')
    }
  }
}

export default clientPromise
