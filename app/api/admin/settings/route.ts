import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Default settings structure
const defaultSettings = {
  // Platform Configuration
  platformName: "Ingagi ERP",
  platformDescription: "Comprehensive restaurant and hotel management platform",
  supportEmail: "support@ingagi.com",
  supportPhone: "+250 788 123 456",
  
  // Business Settings
  commissionRate: 5,
  premiumPrice: 50000,
  enterprisePrice: 100000,
  autoApproval: "manual",
  freeTrialDays: 14,
  
  // Security Settings
  sessionTimeout: 480,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireTwoFactor: false,
  ipWhitelist: [],
  allowedDomains: [],
  
  // User Management
  allowUserRegistration: true,
  requireEmailVerification: true,
  requirePhoneVerification: false,
  maxUsersPerRestaurant: 20,
  userSessionTimeout: 30,
  
  // Restaurant Settings
  maxMenuItems: {
    core: 50,
    pro: 200,
    enterprise: 1000
  },
  maxEmployees: {
    core: 5,
    pro: 15,
    enterprise: 100
  },
  maxOrders: {
    core: 1000,
    pro: 10000,
    enterprise: 100000
  },
  
  // Notification Settings
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  notificationFrequency: "realtime",
  
  // System Settings
  maintenanceMode: false,
  debugMode: false,
  logLevel: "info",
  backupFrequency: "daily",
  dataRetentionDays: 365,
  
  // Payment Settings
  paymentGateway: "momo",
  currency: "RWF",
  taxRate: 18,
  allowPartialPayments: true,
  
  // Analytics Settings
  analyticsEnabled: true,
  dataCollection: true,
  privacyCompliance: true,
  reportRetention: 90,
  
  // Metadata
  lastUpdated: new Date(),
  updatedBy: "system"
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Get settings from database
    const settingsDoc = await db.collection("platform_settings").findOne({})
    
    if (!settingsDoc) {
      // If no settings exist, create default settings
      const result = await db.collection("platform_settings").insertOne({
        ...defaultSettings,
        createdAt: new Date()
      })
      
      return NextResponse.json({
        success: true,
        settings: { ...defaultSettings, _id: result.insertedId.toString() }
      })
    }
    
    // Return existing settings
    const { _id, ...settings } = settingsDoc
    return NextResponse.json({
      success: true,
      settings: { ...settings, _id: _id.toString() }
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { settings: updatedSettings, updatedBy } = await request.json()
    
    if (!updatedSettings) {
      return NextResponse.json(
        { success: false, error: "Settings data is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Validate critical settings
    const validationErrors = validateSettings(updatedSettings)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationErrors },
        { status: 400 }
      )
    }
    
    // Update settings
    const result = await db.collection("platform_settings").updateOne(
      {},
      { 
        $set: {
          ...updatedSettings,
          lastUpdated: new Date(),
          updatedBy: updatedBy || "admin"
        }
      },
      { upsert: true }
    )
    
    // Log the settings change
    await db.collection("audit_logs").insertOne({
      action: "Settings Updated",
      user: updatedBy || "admin",
      target: "Platform Settings",
      timestamp: new Date(),
      details: `Platform settings updated by ${updatedBy || 'admin'}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    })
    
    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    switch (action) {
      case "reset_to_defaults":
        // Reset all settings to defaults
        await db.collection("platform_settings").updateOne(
          {},
          { 
            $set: {
              ...defaultSettings,
              lastUpdated: new Date(),
              updatedBy: data?.updatedBy || "admin"
            }
          },
          { upsert: true }
        )
        
        return NextResponse.json({
          success: true,
          message: "Settings reset to defaults successfully",
          settings: defaultSettings
        })
        
      case "export_settings":
        // Export current settings
        const settingsDoc = await db.collection("platform_settings").findOne({})
        const settings = settingsDoc || defaultSettings
        
        return NextResponse.json({
          success: true,
          settings: settings,
          exportDate: new Date().toISOString()
        })
        
      case "validate_settings":
        // Validate settings without saving
        const validationErrors = validateSettings(data.settings)
        return NextResponse.json({
          success: true,
          isValid: validationErrors.length === 0,
          errors: validationErrors
        })
        
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error processing settings action:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process settings action" },
      { status: 500 }
    )
  }
}

// Settings validation function
function validateSettings(settings: any): string[] {
  const errors: string[] = []
  
  // Validate numeric values
  if (settings.commissionRate && (settings.commissionRate < 0 || settings.commissionRate > 100)) {
    errors.push("Commission rate must be between 0 and 100")
  }
  
  if (settings.premiumPrice && settings.premiumPrice < 0) {
    errors.push("Premium price cannot be negative")
  }
  
  if (settings.enterprisePrice && settings.enterprisePrice < 0) {
    errors.push("Enterprise price cannot be negative")
  }
  
  if (settings.sessionTimeout && (settings.sessionTimeout < 15 || settings.sessionTimeout > 1440)) {
    errors.push("Session timeout must be between 15 and 1440 minutes")
  }
  
  if (settings.maxLoginAttempts && (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 10)) {
    errors.push("Max login attempts must be between 1 and 10")
  }
  
  if (settings.passwordMinLength && (settings.passwordMinLength < 6 || settings.passwordMinLength > 32)) {
    errors.push("Password minimum length must be between 6 and 32 characters")
  }
  
  if (settings.taxRate && (settings.taxRate < 0 || settings.taxRate > 100)) {
    errors.push("Tax rate must be between 0 and 100")
  }
  
  if (settings.dataRetentionDays && (settings.dataRetentionDays < 30 || settings.dataRetentionDays > 3650)) {
    errors.push("Data retention days must be between 30 and 3650")
  }
  
  // Validate email format
  if (settings.supportEmail && !isValidEmail(settings.supportEmail)) {
    errors.push("Support email format is invalid")
  }
  
  // Validate phone format
  if (settings.supportPhone && !isValidPhone(settings.supportPhone)) {
    errors.push("Support phone format is invalid")
  }
  
  return errors
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone)
}
