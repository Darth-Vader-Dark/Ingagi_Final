"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  RefreshCw,
  X,
  Zap
} from "lucide-react"
import { isProOrAbove } from "@/lib/subscription-access"

interface AIHint {
  id: string
  type: "optimization" | "alert" | "insight" | "prediction" | "tip"
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  description: string
  action?: string
  impact?: string
  category: string
  timestamp: string
}

interface AIHintsProps {
  userRole: string
  subscriptionTier?: string
  data?: any
  className?: string
}

const HINT_TEMPLATES = {
  waiter: [
    {
      type: "optimization" as const,
      priority: "medium" as const,
      title: "Order Grouping Opportunity",
      description: "Consider grouping orders by table proximity for efficient service",
      action: "Group Tables 3, 5, 7 for simultaneous service",
      impact: "Save 5-8 minutes per round",
      category: "Service Efficiency"
    },
    {
      type: "alert" as const,
      priority: "high" as const,
      title: "Customer Wait Time Alert",
      description: "Table 5 has been waiting 15 minutes - suggest appetizers while main course prepares",
      action: "Offer complimentary bread or appetizer",
      impact: "Improve customer satisfaction",
      category: "Customer Experience"
    },
    {
      type: "insight" as const,
      priority: "medium" as const,
      title: "Upselling Opportunity",
      description: "Customer ordered pasta - suggest wine pairing (avg +$12 per table)",
      action: "Recommend house wine or specialty drink",
      impact: "Increase average order value",
      category: "Revenue Optimization"
    },
    {
      type: "prediction" as const,
      priority: "medium" as const,
      title: "Peak Hours Approaching",
      description: "Peak hours approaching - prepare for 40% order increase in next hour",
      action: "Prepare additional menus and check table readiness",
      impact: "Better service during rush",
      category: "Capacity Planning"
    },
    {
      type: "tip" as const,
      priority: "low" as const,
      title: "Table Turnover Tip",
      description: "Table 3 finishes in 10 min - prepare for quick turnover",
      action: "Have cleaning supplies ready",
      impact: "Faster table availability",
      category: "Table Management"
    }
  ],
  kitchen: [
    {
      type: "optimization" as const,
      priority: "high" as const,
      title: "Prep Optimization",
      description: "Prep 20% more chicken - trending item, 3x orders vs yesterday",
      action: "Start additional chicken prep now",
      impact: "Prevent delays during rush",
      category: "Prep Management"
    },
    {
      type: "prediction" as const,
      priority: "medium" as const,
      title: "Order Timing Prediction",
      description: "Order #47 estimated ready in 8 minutes (based on current prep speed)",
      action: "Notify waiter of estimated completion",
      impact: "Better customer communication",
      category: "Timing Accuracy"
    },
    {
      type: "alert" as const,
      priority: "urgent" as const,
      title: "Ingredient Alert",
      description: "Low on tomatoes - suggest caprese salad alternatives",
      action: "Switch to alternative salad options",
      impact: "Prevent order cancellations",
      category: "Inventory Management"
    },
    {
      type: "tip" as const,
      priority: "low" as const,
      title: "Efficiency Tip",
      description: "Batch-prep sauces during slow period (2-3pm) to save 15 min during rush",
      action: "Schedule sauce prep for afternoon",
      impact: "Reduce rush hour stress",
      category: "Workflow Optimization"
    },
    {
      type: "alert" as const,
      priority: "medium" as const,
      title: "Quality Control Alert",
      description: "Monitor pasta cook time - 3 orders returned for overcooking this week",
      action: "Set timer reminders for pasta dishes",
      impact: "Reduce food waste and complaints",
      category: "Quality Assurance"
    }
  ],
  inventory: [
    {
      type: "prediction" as const,
      priority: "high" as const,
      title: "Restock Prediction",
      description: "Order 50kg flour by Friday - current usage suggests stockout risk",
      action: "Place order with Supplier A",
      impact: "Prevent production delays",
      category: "Stock Management"
    },
    {
      type: "optimization" as const,
      priority: "medium" as const,
      title: "Cost Optimization",
      description: "Supplier B offers 15% discount on bulk orders - save $200/month",
      action: "Switch to bulk ordering",
      impact: "Reduce monthly costs",
      category: "Cost Management"
    },
    {
      type: "alert" as const,
      priority: "high" as const,
      title: "Waste Reduction Alert",
      description: "Reduce lettuce order by 30% - 25% waste rate detected",
      action: "Adjust lettuce ordering quantity",
      impact: "Save $150/month on waste",
      category: "Waste Management"
    },
    {
      type: "prediction" as const,
      priority: "medium" as const,
      title: "Seasonal Adjustment",
      description: "Increase coffee beans 40% - holiday season demand spike expected",
      action: "Increase coffee inventory",
      impact: "Meet holiday demand",
      category: "Demand Planning"
    },
    {
      type: "alert" as const,
      priority: "urgent" as const,
      title: "Expiry Alert",
      description: "Check dairy section - 3 items expire within 48 hours",
      action: "Use expiring items in today's menu",
      impact: "Prevent food waste",
      category: "Expiry Management"
    }
  ],
  receptionist: [
    {
      type: "prediction" as const,
      priority: "high" as const,
      title: "Capacity Planning",
      description: "Saturday 7pm fully booked - suggest waitlist management",
      action: "Start waitlist for 7:30pm slots",
      impact: "Maximize revenue potential",
      category: "Reservation Management"
    },
    {
      type: "insight" as const,
      priority: "low" as const,
      title: "Customer Preference",
      description: "Mr. Smith prefers window tables - note for future bookings",
      action: "Add preference to customer profile",
      impact: "Improve customer loyalty",
      category: "Customer Service"
    },
    {
      type: "prediction" as const,
      priority: "medium" as const,
      title: "Peak Time Management",
      description: "Friday 6-8pm typically 2x wait times - prepare customers",
      action: "Set accurate wait time expectations",
      impact: "Better customer experience",
      category: "Wait Time Management"
    },
    {
      type: "tip" as const,
      priority: "low" as const,
      title: "Special Occasion Alert",
      description: "Anniversary couple arriving - suggest complimentary dessert",
      action: "Notify kitchen of special occasion",
      impact: "Enhance customer experience",
      category: "Customer Experience"
    },
    {
      type: "optimization" as const,
      priority: "medium" as const,
      title: "Wait Time Optimization",
      description: "Current wait: 25 min - suggest bar seating for immediate service",
      action: "Offer bar seating to waiting customers",
      impact: "Reduce perceived wait time",
      category: "Seating Optimization"
    }
  ],
  manager: [
    {
      type: "insight" as const,
      priority: "high" as const,
      title: "Revenue Optimization",
      description: "Happy hour increased sales 35% - consider extending to 6pm",
      action: "Extend happy hour by 1 hour",
      impact: "Increase daily revenue by $400",
      category: "Revenue Management"
    },
    {
      type: "prediction" as const,
      priority: "medium" as const,
      title: "Staff Scheduling",
      description: "Schedule 2 extra servers Friday 7-9pm - historical data shows need",
      action: "Add servers to Friday evening shift",
      impact: "Improve service quality",
      category: "Staff Management"
    },
    {
      type: "alert" as const,
      priority: "medium" as const,
      title: "Menu Performance Alert",
      description: "Remove slow-selling item - only 2 orders this week, costs $8/day",
      action: "Remove item from menu or promote",
      impact: "Reduce daily waste costs",
      category: "Menu Optimization"
    },
    {
      type: "insight" as const,
      priority: "low" as const,
      title: "Customer Insights",
      description: "Repeat customers prefer outdoor seating - optimize table allocation",
      action: "Prioritize outdoor tables for regulars",
      impact: "Increase customer retention",
      category: "Customer Analytics"
    },
    {
      type: "optimization" as const,
      priority: "high" as const,
      title: "Operational Efficiency",
      description: "Kitchen bottleneck at 8pm - consider prep station reorganization",
      action: "Redesign prep station layout",
      impact: "Reduce order times by 20%",
      category: "Operations Management"
    }
  ]
}

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
}

const TYPE_ICONS = {
  optimization: TrendingUp,
  alert: AlertTriangle,
  insight: Lightbulb,
  prediction: Clock,
  tip: Star
}

export function AIHints({ userRole, subscriptionTier, data, className }: AIHintsProps) {
  const [hints, setHints] = useState<AIHint[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isProPlus = isProOrAbove(subscriptionTier)

  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => {
    if (!data) return null
    return {
      ordersCount: data.orders?.length || 0,
      tablesCount: data.tables?.length || 0,
      pendingOrders: data.orders?.filter((o: any) => o.status === 'pending').length || 0,
      urgentOrders: data.orders?.filter((o: any) => o.priority === 'urgent').length || 0
    }
  }, [data?.orders?.length, data?.tables?.length, data?.orders])

  useEffect(() => {
    if (!isProPlus || isInitialized) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce the hint generation
    timeoutRef.current = setTimeout(() => {
      generateHints()
      setIsInitialized(true)
    }, 500)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isProPlus, memoizedData?.ordersCount, memoizedData?.pendingOrders, memoizedData?.urgentOrders])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const generateHints = async () => {
    if (loading) return // Prevent multiple simultaneous generations
    
    setLoading(true)
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const templates = HINT_TEMPLATES[userRole as keyof typeof HINT_TEMPLATES] || []
      const generatedHints: AIHint[] = templates.slice(0, 3).map((template, index) => ({
        ...template,
        id: `${userRole}-hint-${Date.now()}-${index}`,
        timestamp: new Date().toISOString()
      }))
      
      setHints(generatedHints)
    } catch (error) {
      console.error('Error generating hints:', error)
      setHints([])
    } finally {
      setLoading(false)
    }
  }

  const dismissHint = (hintId: string) => {
    setDismissedHints(prev => new Set([...prev, hintId]))
  }

  const refreshHints = () => {
    setIsInitialized(false)
    generateHints()
  }

  const visibleHints = hints.filter(hint => !dismissedHints.has(hint.id))

  if (!isProPlus) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            AI Insights
          </CardTitle>
          <Badge variant="secondary" className="text-xs">Pro+</Badge>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Upgrade to Pro+ for AI-powered insights, predictions, and optimization tips tailored to your role.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            AI Insights
          </CardTitle>
          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (visibleHints.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            AI Insights
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshHints}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Lightbulb className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No insights available right now</p>
            <p className="text-xs text-gray-400">Check back later for AI-powered tips</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-600" />
          AI Insights
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={refreshHints}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleHints.map((hint) => {
          const IconComponent = TYPE_ICONS[hint.type]
          return (
            <div key={hint.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-purple-600" />
                  <Badge className={PRIORITY_COLORS[hint.priority]} variant="secondary">
                    {hint.priority}
                  </Badge>
                  <span className="text-xs text-gray-500">{hint.category}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissHint(hint.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">{hint.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{hint.description}</p>
              </div>
              
              {hint.action && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <strong>Action:</strong> {hint.action}
                </div>
              )}
              
              {hint.impact && (
                <div className="text-xs text-green-600">
                  <strong>Impact:</strong> {hint.impact}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
