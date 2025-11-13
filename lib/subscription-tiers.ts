export interface SubscriptionTier {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
    currency: string
  }
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
    apiCalls: number
    storage: string
    integrations: number
  }
  recommendedFor: string[]
  color: string
  icon: string
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "core",
    name: "Ingagi ERP Core",
    description: "Essential digital operations for small businesses. Start your digital transformation journey.",
    price: {
      monthly: 0,
      yearly: 0,
      currency: "RWF"
    },
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
    },
    recommendedFor: [
      "Small restaurants",
      "Bakeries",
      "Startups",
      "Entry-level businesses",
      "Food trucks",
      "Local cafes"
    ],
    color: "bg-blue-500",
    icon: "🏪"
  },
  {
    id: "pro",
    name: "Ingagi Pro",
    description: "Advanced features for growing businesses. Scale your operations with smart tools.",
    price: {
      monthly: 25000,
      yearly: 250000,
      currency: "RWF"
    },
    features: [
      "Everything in Core",
      "Advanced Menu Management",
      "Unlimited Orders",
      "Employee Management (up to 20)",
      "Advanced Analytics & Insights",
      "AI-Powered Menu Recommendations",
      "Customer Loyalty Programs",
      "Advanced Inventory Management",
      "Multi-location Support",
      "Advanced Reporting & Export",
      "Priority Email Support",
      "Custom Branding",
      "Advanced QR Features",
      "Integration with Payment Gateways",
      "Customer Relationship Management",
      "Performance Metrics",
      "Staff Performance Tracking",
      "Revenue Analytics",
      "Menu Performance Insights"
    ],
    limits: {
      employees: 20,
      menuItems: 200,
      orders: -1, // Unlimited
      analytics: true,
      aiFeatures: true,
      whiteLabel: false,
      customDomain: true,
      prioritySupport: true,
      apiCalls: 10000,
      storage: "10GB",
      integrations: 10
    },
    recommendedFor: [
      "Growing hotels",
      "Smart restaurants",
      "Boutique lounges",
      "Medium-sized businesses",
      "Chains with 2-3 locations",
      "Premium dining establishments"
    ],
    color: "bg-purple-500",
    icon: "⭐"
  },
  {
    id: "enterprise",
    name: "Ingagi Enterprise (NeuralSuite)",
    description: "Full enterprise solution with AI/ML capabilities. Transform your business with cutting-edge technology.",
    price: {
      monthly: 100000,
      yearly: 1000000,
      currency: "RWF"
    },
    features: [
      "Everything in Pro",
      "Unlimited Everything",
      "AI-Powered Business Intelligence",
      "Predictive Analytics",
      "Machine Learning Insights",
      "White-Label Solutions",
      "Custom Domain & Branding",
      "Multi-branch Management",
      "Advanced Security Features",
      "API Access & Webhooks",
      "Custom Integrations",
      "Dedicated Account Manager",
      "24/7 Priority Support",
      "Custom Training & Onboarding",
      "Advanced Workflow Automation",
      "Real-time Business Intelligence",
      "Predictive Demand Forecasting",
      "Customer Behavior Analysis",
      "Revenue Optimization",
      "Staff Scheduling AI",
      "Inventory Optimization",
      "Menu Engineering AI",
      "Customer Segmentation",
      "Advanced Marketing Tools",
      "Multi-language Support",
      "Advanced Security & Compliance",
      "Backup & Disaster Recovery",
      "Custom Development Services"
    ],
    limits: {
      employees: -1, // Unlimited
      menuItems: -1, // Unlimited
      orders: -1, // Unlimited
      analytics: true,
      aiFeatures: true,
      whiteLabel: true,
      customDomain: true,
      prioritySupport: true,
      apiCalls: -1, // Unlimited
      storage: "100GB",
      integrations: -1 // Unlimited
    },
    recommendedFor: [
      "Multi-branch hotel chains",
      "Large bakeries",
      "Bar chains with tech-driven customer flow",
      "Enterprise businesses",
      "International chains",
      "High-end establishments",
      "Franchise operations"
    ],
    color: "bg-gradient-to-r from-purple-600 to-pink-600",
    icon: "🚀"
  }
]

export function getTierById(tierId: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === tierId)
}

export function getTierFeatures(tierId: string): string[] {
  const tier = getTierById(tierId)
  return tier ? tier.features : []
}

export function getTierLimits(tierId: string): any {
  const tier = getTierById(tierId)
  return tier ? tier.limits : {}
}

export function getTierPrice(tierId: string, period: 'monthly' | 'yearly'): number {
  const tier = getTierById(tierId)
  return tier ? tier.price[period] : 0
}

export function formatPrice(price: number, currency: string = "RWF"): string {
  if (price === 0) return "Free"
  return `${currency} ${price.toLocaleString()}`
}

export function getTierColor(tierId: string): string {
  const tier = getTierById(tierId)
  return tier ? tier.color : "bg-gray-500"
}

export function getTierIcon(tierId: string): string {
  const tier = getTierById(tierId)
  return tier ? tier.icon : "🏪"
}
