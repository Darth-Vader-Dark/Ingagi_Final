"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    name: string,
    establishmentType: string,
    establishmentName: string,
    establishmentAddress: string,
    establishmentPhone: string,
    tinNumber: string
  ) => Promise<{ success: boolean; error?: string; message?: string; requiresApproval?: boolean }>
  registerEmployee: (
    email: string,
    password: string,
    name: string,
    role: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loading: boolean
  resetSessionTimeout: () => void
  clearSessionTimeout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  
  // Use ref instead of state to avoid re-renders
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetSessionTimeout = useCallback(() => {
    // Clear existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
    }
    
    // Set new timeout (2 hours of inactivity)
    const timeout = setTimeout(() => {
      console.log("Session timeout reached, auto-logging out")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
      router.push("/login")
    }, 2 * 60 * 60 * 1000) // 2 hours
    
    sessionTimeoutRef.current = timeout
  }, [router])

  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
  }, [])

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No token found in localStorage")
        setUser(null)
        setLoading(false)
        return
      }

      console.log("Checking auth status with token")
      // Verify token with backend
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        console.log("Auth verification successful, user data:", userData.user)
        setUser(userData.user)
        resetSessionTimeout() // Start session timeout for existing session
        // Only set loading to false after user is set
        setLoading(false)
      } else {
        console.log("Auth verification failed, removing token")
        // Token is invalid, remove it
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setUser(null)
        setLoading(false)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
      setLoading(false)
    }
  }, [resetSessionTimeout])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  useEffect(() => {
    // Only auto-logout on actual inactivity, not on page visibility changes
    const handleFocus = () => {
      // Check if user is still valid when they return to the page
      if (user) {
        const token = localStorage.getItem("token")
        if (!token) {
          console.log("No token found on focus, auto-logging out")
          setUser(null)
        }
      }
    }

    // Add event listeners
    window.addEventListener("focus", handleFocus)

    // Monitor user activity to reset session timeout
    const handleUserActivity = () => {
      if (user) {
        resetSessionTimeout()
      }
    }

    // Add activity event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Cleanup event listeners
    return () => {
      window.removeEventListener("focus", handleFocus)
      
      // Cleanup activity event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
      
      // Clear session timeout
      clearSessionTimeout()
    }
  }, [user, resetSessionTimeout, clearSessionTimeout])

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt for email:", email)
      setLoading(true)
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (data.success) {
        const { token, user } = data
        console.log("Login successful, user:", user)
        
        // Store auth data
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
        
        // Update state
        setUser(user)
        resetSessionTimeout() // Start session timeout
        
        setLoading(false)
        return { success: true }
      } else {
        console.log("Login failed:", data.error)
        setLoading(false)
        return { success: false, error: data.error || "Login failed" }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setLoading(false)
      return { success: false, error: error.message || "Network error" }
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    establishmentType: string,
    establishmentName: string,
    establishmentAddress: string,
    establishmentPhone: string,
    tinNumber: string
  ) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          establishmentType,
          establishmentName,
          establishmentAddress,
          establishmentPhone,
          tinNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Don't automatically log in the user after registration
        // Just return success with the message
        return { 
          success: true, 
          message: data.message || "Registration successful. Please wait for approval.",
          requiresApproval: true
        }
      } else {
        return { success: false, error: data.error || "Registration failed" }
      }
    } catch (error: any) {
      return { success: false, error: error.message || "Network error" }
    }
  }

  const registerEmployee = async (email: string, password: string, name: string, role: string) => {
    if (!user || !user.restaurantId) {
      return { success: false, error: "Not authorized to register employees" }
    }
    // Allow restaurant managers, hotel managers, and restaurant admins
    const canRegister = ["manager", "hotel_manager", "restaurant_admin"].includes(user.role)
    if (!canRegister) {
      return { success: false, error: "Only managers or admins can register employees" }
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/auth/register-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          restaurantId: user.restaurantId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error || "Failed to register employee" }
      }
    } catch (error: any) {
      return { success: false, error: error.message || "Network error" }
    }
  }

  const logout = async () => {
    // Prevent multiple simultaneous logout calls
    if (loading || isLoggingOut) return
    
    setIsLoggingOut(true)
    setLoading(true)
    clearSessionTimeout()
    
    // Clear all auth data immediately
    try {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    } catch (_) {}
    
    // Clear user state immediately
    setUser(null)
    
    // Navigate to login immediately without delay
    router.replace("/login")
    setLoading(false)
    setIsLoggingOut(false)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      registerEmployee, 
      logout, 
      loading,
      resetSessionTimeout,
      clearSessionTimeout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useAuthCompat() {
  const { user, loading } = useAuth()
  return {
    user,
    isLoading: loading,
    isAuthenticated: !!user,
  }
}
