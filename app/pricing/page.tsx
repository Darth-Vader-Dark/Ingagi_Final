"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown } from "lucide-react"
import Link from "next/link"
import { SUBSCRIPTION_TIERS, formatPrice, getTierColor, getTierIcon } from "@/lib/subscription-tiers"

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Ingagi Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free Core tier and scale up as you grow. 
            Every plan includes essential features to digitize your business.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
              <Badge variant="secondary" className="ml-2">Save 17%</Badge>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative overflow-hidden ${
                tier.id === 'pro' ? 'ring-2 ring-purple-500 scale-105' : ''
              }`}
            >
              {tier.id === 'pro' && (
                <div className="absolute top-0 left-0 right-0 bg-purple-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${tier.color} text-white text-2xl mb-4`}>
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="text-base">{tier.description}</CardDescription>
                
                {/* Price */}
                <div className="mt-6">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(tier.price[billingPeriod], tier.price.currency)}
                  </div>
                  <div className="text-gray-500">
                    {billingPeriod === 'monthly' ? 'per month' : 'per year'}
                  </div>
                  {tier.price[billingPeriod] === 0 && (
                    <div className="text-sm text-green-600 font-medium mt-2">
                      No credit card required
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">What's included:</h4>
                  {tier.features.slice(0, 8).map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                  {tier.features.length > 8 && (
                    <div className="text-sm text-blue-600 font-medium">
                      +{tier.features.length - 8} more features
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900">Limits:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Employees:</span>
                      <span className="font-medium">
                        {tier.limits.employees === -1 ? 'Unlimited' : tier.limits.employees}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Menu Items:</span>
                      <span className="font-medium">
                        {tier.limits.menuItems === -1 ? 'Unlimited' : tier.limits.menuItems}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Orders:</span>
                      <span className="font-medium">
                        {tier.limits.orders === -1 ? 'Unlimited' : tier.limits.orders.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{tier.limits.storage}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended For */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2">Perfect for:</h4>
                  <div className="text-sm text-gray-600">
                    {tier.recommendedFor.slice(0, 3).join(', ')}
                    {tier.recommendedFor.length > 3 && ' and more...'}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6">
                  {tier.id === 'core' ? (
                    <Link href="/login">
                      <Button className="w-full" variant="outline">
                        Get Started Free
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button className={`w-full ${tier.id === 'pro' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}>
                        Start {tier.name.includes('Pro') ? 'Pro' : 'Enterprise'} Trial
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-6 font-semibold">Feature</th>
                  <th className="text-center py-4 px-6">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">Core</span>
                      <span className="text-sm text-gray-500">Free</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">Pro</span>
                      <span className="text-sm text-gray-500">RWF 25K/mo</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">Enterprise</span>
                      <span className="text-sm text-gray-500">RWF 100K/mo</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-4 px-6 font-medium">AI-Powered Features</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Advanced Analytics</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">White-Label Solutions</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Custom Domain</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Priority Support</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Multi-location</td>
                  <td className="text-center py-4 px-6">❌</td>
                  <td className="text-center py-4 px-6">✅</td>
                  <td className="text-center py-4 px-6">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">API Access</td>
                  <td className="text-center py-4 px-6">Limited</td>
                  <td className="text-center py-4 px-6">Standard</td>
                  <td className="text-center py-4 px-6">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Can I upgrade my plan later?</h3>
              <p className="text-gray-600">Yes! You can upgrade from Core to Pro or Enterprise at any time. Your data and settings will be preserved.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Is there a free trial?</h3>
              <p className="text-gray-600">Core is completely free forever. Pro and Enterprise come with a 30-day free trial, no credit card required.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, MTN Money, Airtel Money, and bank transfers for enterprise plans.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Can I cancel anytime?</h3>
              <p className="text-gray-600">Absolutely! You can cancel your subscription at any time. No long-term contracts or hidden fees.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of businesses already using Ingagi to digitize their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
