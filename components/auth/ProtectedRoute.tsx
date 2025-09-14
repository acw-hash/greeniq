"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireUserType?: 'golf_course' | 'professional' | 'admin'
}

export function ProtectedRoute({ children, requireUserType }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const router = useRouter()
  const hasRedirectedRef = useRef(false)
  
  console.log('🔥 PROTECTED ROUTE - SIMPLIFIED:', {
    isAuthenticated,
    isLoading,
    hasProfile: !!profile,
    profileType: profile?.user_type,
    hasRedirected: hasRedirectedRef.current,
    timestamp: new Date().toISOString()
  })

  // Handle redirects
  useEffect(() => {
    // Don't redirect multiple times
    if (hasRedirectedRef.current) return
    
    // Only check auth state when not loading
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚨 ProtectedRoute: Not authenticated, redirecting to login')
        hasRedirectedRef.current = true
        router.push('/login')
        return
      }
      
      if (requireUserType && profile?.user_type !== requireUserType) {
        console.log('🚨 ProtectedRoute: Wrong user type, redirecting to dashboard')
        hasRedirectedRef.current = true
        router.push('/dashboard')
        return
      }
    }
  }, [isAuthenticated, isLoading, profile?.user_type, requireUserType, router])

  // SIMPLIFIED LOGIC: If loading, show loading. If authenticated, show content.
  
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Still loading auth state')
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <div>
            <p className="text-lg font-medium">Loading...</p>
            <p className="text-sm text-gray-500 mt-2">Checking authentication status</p>
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded">
            <p>Auth: {String(isAuthenticated)}</p>
            <p>Loading: {String(isLoading)}</p>
            <p>Profile: {String(!!profile)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: User not authenticated, should redirect')
    return null // Will redirect via useEffect
  }

  if (requireUserType && profile?.user_type !== requireUserType) {
    console.log('❌ ProtectedRoute: Wrong user type, should redirect')
    return null // Will redirect via useEffect
  }

  console.log('✅ ProtectedRoute: All checks passed, rendering children')
  return <>{children}</>
}
