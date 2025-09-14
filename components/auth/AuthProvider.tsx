"use client"

import { createContext, useContext, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import { useJobStore } from '@/lib/stores/jobStore'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

const AuthContext = createContext({})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, refreshSession } = useAuthStore()
  const initializeRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization in development mode
    if (initializeRef.current) return
    initializeRef.current = true

    console.log('🚀 AuthProvider initializing with @supabase/ssr...')
    
    // Create the Supabase client
    const supabase = createClient()
    
    // DO NOT CLEAR AUTH DATA - this was destroying successful logins!
    console.log('⚠️ NOT clearing auth data to preserve successful logins')
    
    // Set up auth state change listener with enhanced debugging
    console.log('🎧 Setting up auth state change listener...')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('🔥🔥🔥 AUTH STATE CHANGE EVENT 🔥🔥🔥', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionAccessToken: session?.access_token ? 'Present' : 'Missing',
        timestamp: new Date().toISOString()
      })
      
      // Handle all auth events
      if (event === 'SIGNED_IN') {
        console.log('🎉 SIGNED_IN event detected!')
        if (session?.user) {
          console.log('✅ Setting user in auth store:', {
            id: session.user.id,
            email: session.user.email
          })
          
          // IMMEDIATELY set the user and authenticated state
          setUser(session.user)
          setLoading(false) // Critical: Set loading to false immediately
          
          // Then refresh profile data
          try {
            console.log('🔄 Refreshing user profile...')
            await refreshSession()
            console.log('✅ Profile refresh completed')
          } catch (error) {
            console.error('❌ Profile refresh failed:', error)
            // Don't set loading back to true on profile error
          }
        } else {
          console.error('❌ SIGNED_IN event but no user in session!')
          setLoading(false)
        }
        
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 TOKEN_REFRESHED event detected!')
        if (session?.user) {
          console.log('✅ Updating user after token refresh')
          setUser(session.user)
          setLoading(false)
        }
        
      } else if (event === 'SIGNED_OUT') {
        console.log('🔓 SIGNED_OUT event detected - clearing all state')
        
        // Clear auth store
        setUser(null)
        setLoading(false)
        const { setProfile, setGolfCourseProfile, setProfessionalProfile } = useAuthStore.getState()
        setProfile(null)
        setGolfCourseProfile(null)
        setProfessionalProfile(null)
        
        // Clear job store
        try {
          const jobStore = useJobStore.getState()
          jobStore.setJobs([])
          jobStore.clearFilters()
          jobStore.setSelectedJob(null)
          jobStore.setSearchTerm('')
          console.log('✅ Job store cleared')
        } catch (error) {
          console.warn('⚠️ Failed to clear job store:', error)
        }
        
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 PASSWORD_RECOVERY event detected')
        setLoading(false)
        
      } else if (event === 'USER_UPDATED') {
        console.log('👤 USER_UPDATED event detected')
        if (session?.user) {
          setUser(session.user)
        }
        setLoading(false)
        
      } else {
        console.log(`ℹ️ Other auth event: ${event}`)
        setLoading(false)
      }
      
      console.log('🔚 Auth state change handler completed')
    })
    
    console.log('✅ Auth state change listener set up successfully')

    // Initial session check - handle existing sessions immediately
    console.log('🔍 Checking for existing session...')
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting initial session:', error)
        setUser(null)
        setLoading(false)
        return
      }
      
      console.log('📊 Initial session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })
      
      if (session?.user) {
        console.log('🎯 FOUND EXISTING SESSION - setting user immediately!')
        setUser(session.user)
        setLoading(false)
        
        // Also refresh the profile
        refreshSession().catch(error => {
          console.error('❌ Initial profile refresh failed:', error)
        })
      } else {
        console.log('❌ No existing session found')
        setUser(null)
        setLoading(false)
      }
    })

    console.log('✅ AuthProvider initialized')
    
    // Cleanup function
    return () => {
      console.log('🧹 AuthProvider cleanup')
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, refreshSession])

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const authStore = useAuthStore()
  return authStore
}
