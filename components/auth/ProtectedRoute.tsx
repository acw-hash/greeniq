"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireUserType?: 'golf_course' | 'professional' | 'admin'
}

export function ProtectedRoute({ children, requireUserType }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile, forceAuthSync } = useAuth()
  const router = useRouter()
  const hasRedirectedRef = useRef(false)
  
  console.log('🔥 PROTECTED ROUTE - ENHANCED:', {
    isAuthenticated,
    isLoading,
    hasProfile: !!profile,
    profileType: profile?.user_type,
    hasRedirected: hasRedirectedRef.current,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
    timestamp: new Date().toISOString()
  })

  // Enhanced auth check with fallback session verification
  useEffect(() => {
    // Don't redirect multiple times
    if (hasRedirectedRef.current) return
    
    const checkAuthWithFallback = async () => {
      // Only check auth state when not loading
      if (!isLoading) {
        if (!isAuthenticated) {
          console.log('🔍 ProtectedRoute: Not authenticated in store, checking Supabase session...')
          
          // Fallback: Check Supabase session directly
          const supabase = createClient()
          const { data: { session }, error } = await supabase.auth.getSession()
          
          console.log('📊 Supabase session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            error: error?.message
          })
          
          if (session?.user && !error) {
            console.log('🔄 Found valid session but store not updated - forcing sync...')
            await forceAuthSync()
            
            // Wait a bit for sync to complete
            await new Promise(resolve => setTimeout(resolve, 100))
            return // Don't redirect, auth state should be updated now
          }
          
          console.log('🚨 ProtectedRoute: No valid session found, redirecting to login')
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
    }
    
    checkAuthWithFallback()
  }, [isAuthenticated, isLoading, profile?.user_type, requireUserType, router, forceAuthSync])

  // ENHANCED LOGIC: If loading, show loading. If authenticated, show content.
  
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Still loading auth state')
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <div>
            <p className="text-lg font-medium">Authenticating...</p>
            <p className="text-sm text-gray-500 mt-2">Verifying your session</p>
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded">
            <p>Auth: {String(isAuthenticated)}</p>
            <p>Loading: {String(isLoading)}</p>
            <p>Profile: {String(!!profile)}</p>
            <p>Time: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: User not authenticated, should redirect')
    console.log('🔍 Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
    return null // Will redirect via useEffect
  }

  if (requireUserType && profile?.user_type !== requireUserType) {
    console.log('❌ ProtectedRoute: Wrong user type, should redirect')
    console.log('🔍 Required:', requireUserType, 'Got:', profile?.user_type)
    return null // Will redirect via useEffect
  }

  console.log('✅ ProtectedRoute: All checks passed, rendering children')
  console.log('🎯 Final render state:', {
    isAuthenticated,
    hasProfile: !!profile,
    profileType: profile?.user_type,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  })
  return <>{children}</>
}
