import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "./mongodb"
import { ObjectId, type WithId } from "mongodb"

export interface User {
  _id?: string
  customId?: string
  email: string
  password?: string
  role: "super_admin" | "restaurant_admin" | "manager" | "waiter" | "receptionist" | "kitchen" | "inventory" | "hotel_manager" | "hr" | "accountant"
  restaurantId?: string
  name: string
  phone?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  status?: "active" | "inactive" | "deleted" | "suspended"
  lastLogin?: Date
  permissions?: Record<string, boolean>
  establishmentName?: string
  establishmentType?: "restaurant" | "cafe" | "hotel" | "bakery"
}

export interface AuthToken {
  userId: string
  email: string
  role: string
  restaurantId?: string
  iat: number
  exp?: number
}

export interface Establishment {
  _id?: string
  customId?: string
  name: string
  type: "restaurant" | "cafe" | "hotel" | "bakery"
  description: string
  cuisine?: string
  location: string
  phone: string
  email: string
  website?: string
  tinNumber: string
  hours: {
    open: string
    close: string
    daysOpen: string[]
  }
  logo?: string
  banner?: string
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
  }
  socialMedia: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  outlets?: Array<{ type: "restaurant" | "cafe" | "bakery" | "bar"; name: string }>
  // Type-specific fields
  restaurant?: {
    cuisine: string
    specialties: string[]
  }
  cafe?: {
    coffeeTypes: string[]
    foodService: boolean
    wifi: boolean
    outdoorSeating: boolean
  }
  bakery?: {
    specialties: string[]
    hasCustomCakes: boolean
  }
  hotel?: {
    starRating: number
    roomTypes: string[]
    amenities: string[]
    services: string[]
    checkInTime: string
    checkOutTime: string
    rooms?: Array<{ _id?: string; number: string; floor?: string; type?: string; qrCodeId?: string; isActive: boolean }>
  }
  // New tier system
  subscription: {
    tier: "core" | "pro" | "enterprise"
    status: "active" | "expired" | "cancelled" | "trial"
    startDate: Date
    endDate: Date
    autoRenew: boolean
    features: string[]
    limits: {
      employees: number
      menuItems: number
      orders: number
      analytics: boolean
      aiFeatures: boolean
      whiteLabel: boolean
      customDomain: boolean
      prioritySupport: boolean
    }
  }
  isApproved: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

// Keep Restaurant interface for backward compatibility
export interface Restaurant extends Establishment {
  type: "restaurant"
}

export interface MenuItem {
  _id?: string
  restaurantId: string
  name: string
  description: string
  price: number
  category: "food" | "drinks" | "alcohol"
  image?: string
  isAvailable: boolean
  isAlcoholic?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  _id?: string
  restaurantId: string
  customerName: string
  customerPhone: string
  items: {
    menuItemId: string
    name: string
    price: number
    quantity: number
    specialRequests?: string
  }[]
  totalAmount: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  paymentMethod: "mtn_money" | "airtel_money"
  paymentStatus: "pending" | "completed" | "failed"
  tableNumber?: string
  specialRequests?: string
  createdAt: Date
  updatedAt: Date
}

// Database document shapes with ObjectId for _id
type DbUser = Omit<User, '_id'> & { _id?: ObjectId }
type DbEstablishment = Omit<Establishment, '_id'> & { _id?: ObjectId }
type DbRestaurant = Omit<Restaurant, '_id'> & { _id?: ObjectId }
type DbMenuItem = Omit<MenuItem, '_id'> & { _id?: ObjectId }
type DbOrder = Omit<Order, '_id'> & { _id?: ObjectId }

function mapUser(doc: WithId<DbUser>): User {
  const { _id, ...rest } = doc
  return { ...rest, _id: _id.toString() }
}

function mapEstablishment(doc: WithId<DbEstablishment>): Establishment {
  const { _id, ...rest } = doc
  return { ...rest, _id: _id.toString() }
}

function mapRestaurant(doc: WithId<DbRestaurant>): Restaurant {
  const { _id, ...rest } = doc
  return { ...rest, _id: _id.toString(), type: 'restaurant' }
}

function mapMenuItem(doc: WithId<DbMenuItem>): MenuItem {
  const { _id, ...rest } = doc
  return { ...rest, _id: _id.toString() }
}

function mapOrder(doc: WithId<DbOrder>): Order {
  const { _id, ...rest } = doc
  return { ...rest, _id: _id.toString() }
}

// JWT secret handling
function getJwtSecret(): string {
  const secretFromEnv = process.env.JWT_SECRET
  const isProduction = process.env.NODE_ENV === "production"
  if (secretFromEnv && secretFromEnv.trim().length >= 32) return secretFromEnv
  if (isProduction) {
    throw new Error("JWT_SECRET must be set to a strong value in production")
  }
  // Development fallback for local use only
  console.warn("Using weak development JWT secret. Set JWT_SECRET for security.")
  return "dev-insecure-jwt-secret-change-me-32chars-minimum"
}
const JWT_EXPIRES_IN = "7d"

export function generateToken(user: User): string {
  const payload: AuthToken = {
    userId: user._id!,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
    iat: Math.floor(Date.now() / 1000),
  }
  
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthToken
    return decoded
  } catch (error) {
    return null
  }
}

export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole)
}

export function canAccessRestaurant(userRestaurantId: string | undefined, targetRestaurantId: string): boolean {
  // Super admin can access any restaurant
  if (!userRestaurantId) return true
  // User can only access their own restaurant
  return userRestaurantId === targetRestaurantId
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false
  }
  
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    return false
  }
}

// Database operations
export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const { db } = await connectToDatabase()
  
  const userDataForDb: DbUser = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
  
  const result = await db.collection<DbUser>('users').insertOne(userDataForDb)
  
  return {
    ...userDataForDb,
    _id: result.insertedId.toString()
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  
  const user = await db.collection<DbUser>('users').findOne({ email })
  if (!user) return null
  return mapUser(user as WithId<DbUser>)
}

export async function findUserById(id: string): Promise<User | null> {
  const { db } = await connectToDatabase()
  
  const user = await db.collection<DbUser>('users').findOne({ _id: new ObjectId(id) })
  if (!user) return null
  return mapUser(user as WithId<DbUser>)
}

export async function createEstablishment(establishmentData: Omit<Establishment, '_id' | 'createdAt' | 'updatedAt'>): Promise<Establishment> {
  const { db } = await connectToDatabase()
  
  const establishment: DbEstablishment = {
    ...establishmentData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const result = await db.collection<DbEstablishment>('establishments').insertOne(establishment)
  const saved: WithId<DbEstablishment> = { ...(establishment as DbEstablishment), _id: result.insertedId } as WithId<DbEstablishment>
  
  return mapEstablishment(saved)
}

export async function createRestaurant(restaurantData: Omit<Restaurant, '_id' | 'createdAt' | 'updatedAt'>): Promise<Restaurant> {
  const { db } = await connectToDatabase()
  
  const restaurant: DbRestaurant = {
    ...restaurantData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const result = await db.collection<DbRestaurant>('restaurants').insertOne(restaurant)
  const saved: WithId<DbRestaurant> = { ...(restaurant as DbRestaurant), _id: result.insertedId } as WithId<DbRestaurant>
  
  return mapRestaurant(saved)
}

export async function findRestaurantById(id: string): Promise<Restaurant | null> {
  const { db } = await connectToDatabase()
  
  const establishment = await db.collection<DbEstablishment>('establishments').findOne({ _id: new ObjectId(id) })
  if (establishment && establishment.type === 'restaurant') {
    return mapRestaurant(establishment as WithId<DbRestaurant>)
  }
  
  return null
}

export async function findRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
  const { db } = await connectToDatabase()
  
  const restaurants = await db.collection<DbRestaurant>('restaurants').find({ ownerId }).toArray()
  return restaurants.map(r => mapRestaurant(r as WithId<DbRestaurant>))
}

export async function createMenuItem(menuItemData: Omit<MenuItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
  const { db } = await connectToDatabase()
  
  const menuItem: DbMenuItem = {
    ...menuItemData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const result = await db.collection<DbMenuItem>('menuItems').insertOne(menuItem)
  const saved: WithId<DbMenuItem> = { ...(menuItem as DbMenuItem), _id: result.insertedId } as WithId<DbMenuItem>
  
  return mapMenuItem(saved)
}

export async function findMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]> {
  const { db } = await connectToDatabase()
  
  const menuItems = await db.collection<DbMenuItem>('menuItems').find({ restaurantId }).toArray()
  return menuItems.map(i => mapMenuItem(i as WithId<DbMenuItem>))
}

export async function createOrder(orderData: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const { db } = await connectToDatabase()
  
  const order: DbOrder = {
    ...orderData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const result = await db.collection<DbOrder>('orders').insertOne(order)
  const saved: WithId<DbOrder> = { ...(order as DbOrder), _id: result.insertedId } as WithId<DbOrder>
  
  return mapOrder(saved)
}

export async function findOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
  const { db } = await connectToDatabase()
  
  const orders = await db.collection<DbOrder>('orders').find({ restaurantId }).toArray()
  return orders.map(o => mapOrder(o as WithId<DbOrder>))
}

export const ROLE_PERMISSIONS = {
  super_admin: {
    canManageAllRestaurants: true,
    canApproveRestaurants: true,
    canViewAnalytics: true,
    canManageUsers: true,
  },
  restaurant_admin: {
    canManageOwnRestaurant: true,
    canManageEmployees: true,
    canViewRestaurantAnalytics: true,
    canCustomizePage: true,
  },
  manager: {
    canManageEmployees: true,
    canViewReports: true,
    canManageInventory: true,
    canViewFinance: true,
  },
  waiter: {
    canViewOrders: true,
    canUpdateOrderStatus: true,
    canTakeOrders: true,
  },
  receptionist: {
    canManageReservations: true,
    canCheckInCustomers: true,
    canViewCustomerInfo: true,
  },
  kitchen: {
    canViewOrders: true,
    canUpdateOrderStatus: true,
    canManageMenu: true,
  },
  inventory: {
    canManageInventory: true,
    canViewSuppliers: true,
    canTrackStock: true,
  },
  hotel_manager: {
    canManageRooms: true,
    canManageRoomServices: true,
    canManageEmployees: true,
    canViewHotelReports: true,
  },
  hr: {
    canManageEmployees: true,
    canViewEmployeeAnalytics: true,
  },
  accountant: {
    canViewFinance: true,
    canManageInvoices: true,
    canViewReports: true,
  },
}
