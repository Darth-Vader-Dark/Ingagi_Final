"use client"

import { useState } from "react"

import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    establishmentType: "restaurant",
    establishmentName: "",
    establishmentAddress: "",
    establishmentPhone: "",
    tinNumber: "",
  })

  const { login, register, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("Login page useEffect - user:", user, "loading:", loading)
    if (user && !loading) {
      // Only redirect if we have a complete user object with role
      if (user.role) {
        console.log("User has role:", user.role, "restaurantId:", user.restaurantId)
        const redirectPath = getRoleRedirectPath(user.role)
        console.log("Redirecting to:", redirectPath)
        // Use replace instead of push to avoid back button issues
        router.replace(redirectPath)
      } else {
        console.log("User object missing role:", user)
      }
    } else if (!user && !loading) {
      console.log("No user found, staying on login page")
    }
  }, [user, loading, router])

  // Debug: Log initial form data
  useEffect(() => {
    console.log("Initial form data:", formData)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submissions
    if (isSubmitting || loading) return
    
    setIsSubmitting(true)
    setLoading(true)
    setError("")
    setSuccess("")

    // Debug: Log form data
    if (!isLogin) {
      console.log("Form data being submitted:", formData)
    }

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        // Check if all required fields are filled
        console.log("Checking form validation:")
        console.log("Email:", formData.email, "Length:", formData.email?.length)
        console.log("Password:", formData.password, "Length:", formData.password?.length)
        console.log("Name:", formData.name, "Length:", formData.name?.length)
        console.log("Establishment Name:", formData.establishmentName, "Length:", formData.establishmentName?.length)
        console.log("Establishment Address:", formData.establishmentAddress, "Length:", formData.establishmentAddress?.length)
        console.log("Establishment Phone:", formData.establishmentPhone, "Length:", formData.establishmentPhone?.length)
        console.log("TIN Number:", formData.tinNumber, "Length:", formData.tinNumber?.length)
        
        if (!formData.email || !formData.password || !formData.name || 
            !formData.establishmentType || !formData.establishmentName || 
            !formData.establishmentAddress || !formData.establishmentPhone || 
            !formData.tinNumber ||
            formData.email.trim() === "" || formData.password.trim() === "" || 
            formData.name.trim() === "" || formData.establishmentType.trim() === "" || 
            formData.establishmentName.trim() === "" || 
            formData.establishmentAddress.trim() === "" || 
            formData.establishmentPhone.trim() === "" || formData.tinNumber.trim() === "") {
          console.log("Validation failed - missing or empty fields detected")
          setError("Please fill in all required fields")
          setLoading(false)
          setIsSubmitting(false)
          return
        }
        
        console.log("All fields validated successfully")

        console.log("About to call register function with:")
        console.log("Email:", formData.email)
        console.log("Password:", formData.password)
        console.log("Name:", formData.name)
        console.log("Establishment Type:", formData.establishmentType)
        console.log("Establishment Name:", formData.establishmentName)
        console.log("Establishment Address:", formData.establishmentAddress)
        console.log("Establishment Phone:", formData.establishmentPhone)
        console.log("TIN Number:", formData.tinNumber)
        
        result = await register(
          formData.email,
          formData.password,
          formData.name,
          formData.establishmentType,
          formData.establishmentName,
          formData.establishmentAddress,
          formData.establishmentPhone,
          formData.tinNumber,
        )
        
        if (result.success) {
          if (result.requiresApproval) {
            // Show success message and reset form
            setSuccess(result.message || "Registration successful! Please wait for admin approval.")
            setFormData({
              email: "",
              password: "",
              name: "",
              establishmentType: "restaurant",
              establishmentName: "",
              establishmentAddress: "",
              establishmentPhone: "",
              tinNumber: "",
            })
            // Switch back to login mode after successful registration
            setTimeout(() => {
              setIsLogin(true)
              setSuccess("")
            }, 3000)
          } else {
            // If somehow no approval is required, redirect to dashboard
            // This should rarely happen since all registrations require approval
            router.push("/dashboard")
          }
        }
      }

      if (!result.success) {
        setError(result.error || "Authentication failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const getRoleRedirectPath = (role: string) => {
    console.log("getRoleRedirectPath called with role:", role, "user:", user)
    // Ensure we have a valid user object with restaurantId
    if (!user || !user.restaurantId) {
      console.log("User or restaurantId not available, redirecting to dashboard")
      return "/dashboard"
    }

    switch (role) {
      case "super_admin":
        return "/admin/dashboard"
      case "restaurant_admin":
        return `/restaurant/${user.restaurantId}/dashboard`
      case "manager":
        // Route managers based on establishmentType if available
        if ((user as any).establishmentType === "cafe") return `/cafe/${user.restaurantId}/dashboard`
        if ((user as any).establishmentType === "bakery") return `/bakery/${user.restaurantId}/dashboard`
        if ((user as any).establishmentType === "hotel") return `/hotel-manager/${user.restaurantId}/dashboard`
        return `/manager/${user.restaurantId}/dashboard`
      case "hotel_manager":
        return `/hotel-manager/${user.restaurantId}/dashboard`
      case "hr":
        return `/hr/${user.restaurantId}/dashboard`
      case "accountant":
        return `/accountant/${user.restaurantId}/dashboard`
      case "waiter":
        return `/waiter/${user.restaurantId}/dashboard`
      case "receptionist":
        return `/receptionist/${user.restaurantId}/dashboard`
      case "kitchen":
        return `/kitchen/${user.restaurantId}/dashboard`
      case "inventory":
        return `/inventory/${user.restaurantId}/dashboard`
      default:
        return "/dashboard"
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">I</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Ingagi</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Register Your Establishment"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to your account" : "Register your establishment (restaurant, cafe, bakery, or hotel). Hotels can add outlets like restaurants, cafes, bakeries, and bars under one management."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Sign In" : "Establishment Registration"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to access your dashboard"
                : `Register your ${formData.establishmentType} and become a manager. Note: All registrations require admin approval before access.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLogin && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Fields marked with * are required. All registrations require admin approval before access.
                </p>
                <button 
                  type="button" 
                  onClick={() => console.log("Current form data:", formData)}
                  className="mt-2 text-xs text-blue-600 underline"
                >
                  Debug: Log Current Form Data
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => {
                        console.log("Name changed to:", e.target.value)
                        setFormData({ ...formData, name: e.target.value })
                      }}
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                <Label htmlFor="establishmentType">Establishment Type *</Label>
                    <Select
                      value={formData.establishmentType}
                      onValueChange={(value) => setFormData({ ...formData, establishmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Cafe</SelectItem>
                      <SelectItem value="bakery">Bakery</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                    </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishmentName">
                      {formData.establishmentType === "restaurant" ? "Restaurant Name" :
                       formData.establishmentType === "cafe" ? "Cafe Name" :
                       formData.establishmentType === "bakery" ? "Bakery Name" : "Hotel Name"} *
                    </Label>
                    <Input
                      id="establishmentName"
                      type="text"
                      placeholder={`Enter ${formData.establishmentType} name`}
                      value={formData.establishmentName}
                      onChange={(e) => {
                        console.log("Establishment name changed to:", e.target.value)
                        setFormData({ ...formData, establishmentName: e.target.value })
                      }}
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishmentAddress">
                      {formData.establishmentType === "restaurant" ? "Restaurant Address" :
                       formData.establishmentType === "cafe" ? "Cafe Address" :
                       formData.establishmentType === "bakery" ? "Bakery Address" : "Hotel Address"} *
                    </Label>
                    <Input
                      id="establishmentAddress"
                      type="text"
                      placeholder={`Enter ${formData.establishmentType} address`}
                      value={formData.establishmentAddress}
                      onChange={(e) => {
                        console.log("Establishment address changed to:", e.target.value)
                        setFormData({ ...formData, establishmentAddress: e.target.value })
                      }}
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishmentPhone">
                      {formData.establishmentType === "restaurant" ? "Restaurant Phone" :
                       formData.establishmentType === "cafe" ? "Cafe Phone" :
                       formData.establishmentType === "bakery" ? "Bakery Phone" : "Hotel Phone"} *
                    </Label>
                    <Input
                      id="establishmentPhone"
                      type="tel"
                      placeholder={`Enter ${formData.establishmentType} phone number`}
                      value={formData.establishmentPhone}
                      onChange={(e) => {
                        console.log("Establishment phone changed to:", e.target.value)
                        setFormData({ ...formData, establishmentPhone: e.target.value })
                      }}
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tinNumber">TIN Number *</Label>
                    <Input
                      id="tinNumber"
                      type="text"
                      placeholder="Enter TIN number"
                      value={formData.tinNumber}
                      onChange={(e) => {
                        console.log("TIN number changed to:", e.target.value)
                        setFormData({ ...formData, tinNumber: e.target.value })
                      }}
                      required={!isLogin}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => {
                    console.log("Email changed to:", e.target.value)
                    setFormData({ ...formData, email: e.target.value })
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => {
                      console.log("Password changed to:", e.target.value)
                      setFormData({ ...formData, password: e.target.value })
                    }}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
                {loading || isSubmitting ? "Please wait..." : isLogin ? "Sign In" : `Register ${formData.establishmentType.charAt(0).toUpperCase() + formData.establishmentType.slice(1)}`}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError("")
                  setSuccess("")
                  if (isLogin) {
                    // Clear form when switching to registration
                    setFormData({
                      email: "",
                      password: "",
                      name: "",
                      establishmentType: "restaurant",
                      establishmentName: "",
                      establishmentAddress: "",
                      establishmentPhone: "",
                      tinNumber: "",
                    })
                  }
                }} 
                className="text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Register your establishment" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
