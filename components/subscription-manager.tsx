"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Crown, Star, Zap, AlertTriangle, Info } from "lucide-react"
import { SUBSCRIPTION_TIERS, getTierById, formatPrice } from "@/lib/subscription-tiers"

interface SubscriptionManagerProps {
  establishment: {
    subscription: {
      tier: string
      status: string
      startDate: string
      endDate: string
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
  }
  usage: {
    employees: number
    menuItems: number
    orders: number
  }
}

export default function SubscriptionManager({ establishment, usage }: SubscriptionManagerProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const currentTier = getTierById(establishment.subscription.tier)
  const isTrial = establishment.subscription.status === "trial"
  const isExpired = establishment.subscription.status === "expired"

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "trial": return "bg-blue-500"
      case "expired": return "bg-red-500"
      case "cancelled": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active"
      case "trial": return "Trial"
      case "expired": return "Expired"
      case "cancelled": return "Cancelled"
      default: return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span className={`text-2xl ${currentTier?.icon}`}></span>
                <span>{currentTier?.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(establishment.subscription.status)} text-white`}
                >
                  {getStatusText(establishment.subscription.status)}
                </Badge>
              </CardTitle>
              <CardDescription>
                {currentTier?.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(currentTier?.price.monthly || 0, "RWF")}
              </div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Trial/Expiry Warning */}
          {isTrial && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You're currently on a 30-day free trial. Upgrade to Pro or Enterprise to continue using advanced features.
              </AlertDescription>
            </Alert>
          )}
          
          {isExpired && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription has expired. Please upgrade to continue using Ingagi services.
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Limits */}
          <div className="space-y-4">
            <h4 className="font-semibold">Usage Limits</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Employees</span>
                  <span>{usage.employees} / {currentTier?.limits.employees === -1 ? '∞' : currentTier?.limits.employees}</span>
                </div>
                <Progress 
                  value={getUsagePercentage(usage.employees, currentTier?.limits.employees || 0)} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Menu Items</span>
                  <span>{usage.menuItems} / {currentTier?.limits.menuItems === -1 ? '∞' : currentTier?.limits.menuItems}</span>
                </div>
                <Progress 
                  value={getUsagePercentage(usage.menuItems, currentTier?.limits.menuItems || 0)} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Orders</span>
                  <span>{usage.orders.toLocaleString()} / {currentTier?.limits.orders === -1 ? '∞' : currentTier?.limits.orders.toLocaleString()}</span>
                </div>
                <Progress 
                  value={getUsagePercentage(usage.orders, currentTier?.limits.orders || 0)} 
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Current Features */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Current Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {establishment.subscription.features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Button */}
          <div className="mt-6">
            <Button 
              onClick={() => setShowUpgradeDialog(true)}
              className="w-full"
              disabled={isExpired}
            >
              {isExpired ? 'Renew Subscription' : 'Upgrade Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative ${
              tier.id === establishment.subscription.tier 
                ? 'ring-2 ring-primary' 
                : 'hover:shadow-lg transition-shadow'
            }`}
          >
            {tier.id === establishment.subscription.tier && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary">Current Plan</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${tier.color} text-white text-xl mb-3`}>
                {tier.icon}
              </div>
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(tier.price.monthly, tier.price.currency)}
              </div>
              <div className="text-sm text-muted-foreground">per month</div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {tier.features.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
                {tier.features.length > 5 && (
                  <div className="text-sm text-blue-600 font-medium">
                    +{tier.features.length - 5} more features
                  </div>
                )}
              </div>

              {tier.id !== establishment.subscription.tier && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  {tier.id === 'core' ? 'Downgrade' : 'Upgrade to ' + tier.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upgrade Dialog */}
      {showUpgradeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Upgrade Your Plan</h3>
            <p className="text-muted-foreground mb-6">
              Choose a plan that fits your business needs. You can upgrade or downgrade at any time.
            </p>
            
            <div className="space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <div 
                  key={tier.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    tier.id === establishment.subscription.tier 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{tier.icon}</span>
                      <div>
                        <div className="font-medium">{tier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(tier.price.monthly, tier.price.currency)}/month
                        </div>
                      </div>
                    </div>
                    {tier.id === establishment.subscription.tier && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowUpgradeDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
