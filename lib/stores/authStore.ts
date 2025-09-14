import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile, GolfCourseProfile, ProfessionalProfile } from '@/types/auth'
import { validateAuthWithMCP, mcpVerifiedSignOut } from '@/lib/utils/mcp-auth-validator'

interface AuthState {
  user: User | null
  profile: Profile | null
  golfCourseProfile: GolfCourseProfile | null
  professionalProfile: ProfessionalProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setGolfCourseProfile: (profile: GolfCourseProfile | null) => void
  setProfessionalProfile: (profile: ProfessionalProfile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
  forceAuthReset: () => Promise<void>
  mcpValidatedSignOut: () => Promise<void>
  mcpValidateSession: () => Promise<boolean>
  forceAuthSync: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  profile: null,
  golfCourseProfile: null,
  professionalProfile: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  
  setProfile: (profile) => set({ profile }),
  
  setGolfCourseProfile: (golfCourseProfile) => set({ golfCourseProfile }),
  
  setProfessionalProfile: (professionalProfile) => set({ professionalProfile }),
  
  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    try {
      console.log('🔓 Starting comprehensive sign out process...')
      
      const supabase = createClient()
      
      // Step 1: Clear all browser storage FIRST (before calling signOut)
      // This prevents the SSR package from immediately restoring sessions
      if (typeof window !== 'undefined') {
        console.log('🧹 Clearing all browser storage before sign out...')
        
        // Clear localStorage completely
        localStorage.clear()
        
        // Clear sessionStorage completely
        sessionStorage.clear()
        
        // Clear any IndexedDB entries (Supabase might use this)
        try {
          const databases = await indexedDB.databases()
          databases.forEach(db => {
            if (db.name && (db.name.includes('supabase') || db.name.includes('auth'))) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        } catch (error) {
          console.warn('⚠️ Failed to clear IndexedDB:', error)
        }
        
        console.log('✅ All browser storage cleared')
      }
      
      // Step 2: Sign out from Supabase with global scope
      console.log('🔓 Calling Supabase signOut...')
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('❌ Supabase sign out error:', error)
        // Continue with cleanup even if signOut fails
      } else {
        console.log('✅ Supabase client sign out successful')
      }
      
      // Step 3: Call server-side sign out to clear cookies
      try {
        console.log('🔓 Calling server-side sign out...')
        const response = await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          console.warn('⚠️ Server-side sign out failed, but continuing...')
        } else {
          console.log('✅ Server-side sign out successful')
        }
      } catch (serverError) {
        console.warn('⚠️ Server-side sign out error:', serverError)
      }
      
      // Step 4: Clear all auth state in Zustand store
      set({ 
        user: null, 
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false 
      })
      
      console.log('✅ Auth store cleared')
      
      // Step 5: Clear other stores
      try {
        const { useJobStore } = await import('@/lib/stores/jobStore')
        const { useUIStore } = await import('@/lib/stores/uiStore')
        
        // Reset job store
        useJobStore.getState().setJobs([])
        useJobStore.getState().clearFilters()
        useJobStore.getState().setSelectedJob(null)
        useJobStore.getState().setSearchTerm('')
        
        // Clear UI store (except theme)
        const currentTheme = useUIStore.getState().theme
        useUIStore.setState({
          toasts: [],
          sidebarOpen: false,
          theme: currentTheme
        })
        
        console.log('✅ Other stores cleared')
      } catch (storeError) {
        console.warn('⚠️ Failed to clear other stores:', storeError)
      }
      
      // Step 6: Clear React Query cache
      try {
        if (typeof window !== 'undefined' && (window as any).__REACT_QUERY_CLIENT__) {
          const queryClient = (window as any).__REACT_QUERY_CLIENT__
          await queryClient.clear()
          console.log('✅ React Query cache cleared')
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to clear React Query cache:', cacheError)
      }
      
      console.log('🎉 Sign out process completed successfully')
      
      // Step 7: Force navigation to login page
      if (typeof window !== 'undefined') {
        console.log('🔄 Redirecting to login page...')
        window.location.href = '/login'
      }
      
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      
      // Emergency cleanup - clear everything we can
      set({ 
        user: null, 
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false 
      })
      
      // Force clear storage and redirect even on error
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
      
      throw error
    }
  },

  refreshSession: async () => {
    console.log('🔄 Starting session refresh...')
    const supabase = createClient()
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('📊 Session refresh result:', {
        hasSession: !!session,
        hasError: !!error,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
        isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
      })
      
      if (error) {
        console.error('❌ Error getting session:', error)
        set({ 
          user: null,
          profile: null,
          golfCourseProfile: null,
          professionalProfile: null,
          isAuthenticated: false,
          isLoading: false 
        })
        return
      }
      
      // Check if session is expired
      if (session?.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.log('⏰ Session is expired, clearing...')
        
        // Clear expired session
        await supabase.auth.signOut({ scope: 'global' })
        
        set({ 
          user: null,
          profile: null,
          golfCourseProfile: null,
          professionalProfile: null,
          isAuthenticated: false,
          isLoading: false 
        })
        return
      }
      
      if (session?.user) {
        console.log('✅ Valid session found, setting user')
        set({ user: session.user, isAuthenticated: true, isLoading: false })
        await get().refreshProfile()
      } else {
        console.log('❌ No valid session found')
        set({ 
          user: null,
          profile: null,
          golfCourseProfile: null,
          professionalProfile: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
      
    } catch (error) {
      console.error('❌ Session refresh failed:', error)
      set({ 
        user: null,
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
    
    set({ isLoading: false })
    console.log('🔄 Session refresh completed')
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) {
      console.log('❌ Cannot refresh profile - no user')
      return
    }

    console.log('🔄 Refreshing profile for user:', user.id)
    const supabase = createClient()
    
    try {
      // Fetch user profile with error handling
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError)
        
        // If profile doesn't exist, this might be a timing issue
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ Profile not found - may be created by trigger shortly')
          
          // Wait a bit and try once more
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: retryProfile, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (retryError) {
            console.error('❌ Profile still not found after retry, attempting to create...')
            
            // Try to create the profile via API
            try {
              const response = await fetch('/api/auth/complete-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              
              if (response.ok) {
                const result = await response.json()
                console.log('✅ Profile created via API:', result.profile)
                set({ profile: result.profile })
                
                // Refresh to get role-specific profiles
                await get().refreshProfile()
                return
              } else {
                console.error('❌ Profile creation API failed:', await response.text())
              }
            } catch (apiError) {
              console.error('❌ Profile creation API error:', apiError)
            }
            
            return
          }
          
          console.log('✅ Profile found on retry')
          set({ profile: retryProfile })
        } else {
          return
        }
      } else if (profile) {
        console.log('✅ Profile loaded:', profile.user_type)
        set({ profile })
      }
      
      const currentProfile = profile || get().profile
      if (!currentProfile) return
      
      // Fetch role-specific profile with error handling
      if (currentProfile.user_type === 'golf_course') {
        console.log('🏌️ Fetching golf course profile...')
        const { data: golfCourseProfile, error: golfError } = await supabase
          .from('golf_course_profiles')
          .select('*')
          .eq('profile_id', user.id)
          .single()
        
        if (golfError) {
          console.warn('⚠️ Golf course profile fetch error:', golfError)
        } else if (golfCourseProfile) {
          console.log('✅ Golf course profile loaded')
          set({ golfCourseProfile })
        }
      } else if (currentProfile.user_type === 'professional') {
        console.log('👷 Fetching professional profile...')
        const { data: professionalProfile, error: profError } = await supabase
          .from('professional_profiles')
          .select('*')
          .eq('profile_id', user.id)
          .single()
        
        if (profError) {
          console.warn('⚠️ Professional profile fetch error:', profError)
        } else if (professionalProfile) {
          console.log('✅ Professional profile loaded')
          set({ professionalProfile })
        }
      }
      
      console.log('🔄 Profile refresh completed')
      
    } catch (error) {
      console.error('💥 Unexpected error during profile refresh:', error)
    }
  },

  forceAuthReset: async () => {
    console.log('💥 FORCE AUTH RESET - Nuclear option activated')
    
    try {
      const supabase = createClient()
      
      // 1. Sign out from Supabase with global scope 
      console.log('1️⃣ Signing out from Supabase...')
      await supabase.auth.signOut({ scope: 'global' })
      
      // 2. Clear ALL browser storage
      if (typeof window !== 'undefined') {
        console.log('2️⃣ Clearing ALL browser storage...')
        
        // Clear localStorage completely
        localStorage.clear()
        
        // Clear sessionStorage completely  
        sessionStorage.clear()
        
        // Clear any IndexedDB entries (Supabase might use this)
        try {
          const databases = await indexedDB.databases()
          databases.forEach(db => {
            if (db.name && (db.name.includes('supabase') || db.name.includes('auth'))) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        } catch (error) {
          console.warn('⚠️ Failed to clear IndexedDB:', error)
        }
      }
      
      // 3. Clear all Zustand stores
      console.log('3️⃣ Resetting all Zustand stores...')
      
      // Reset auth store
      set({
        user: null,
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false
      })
      
      // Reset other stores
      try {
        const { useJobStore } = await import('@/lib/stores/jobStore')
        const { useUIStore } = await import('@/lib/stores/uiStore')
        
        // Completely reset job store
        const jobStore = useJobStore.getState()
        Object.keys(jobStore).forEach(key => {
          if (typeof jobStore[key as keyof typeof jobStore] === 'function') return
          useJobStore.setState({ [key]: undefined })
        })
        
        // Reset UI store but preserve theme
        const currentTheme = useUIStore.getState().theme
        useUIStore.setState({
          toasts: [],
          sidebarOpen: false,
          theme: currentTheme
        })
        
      } catch (error) {
        console.warn('⚠️ Failed to reset stores:', error)
      }
      
      // 4. Clear React Query cache if it exists
      console.log('4️⃣ Clearing React Query cache...')
      try {
        if (typeof window !== 'undefined' && (window as any).__REACT_QUERY_CLIENT__) {
          const queryClient = (window as any).__REACT_QUERY_CLIENT__
          await queryClient.clear()
          await queryClient.invalidateQueries()
        }
      } catch (error) {
        console.warn('⚠️ Failed to clear React Query:', error)
      }
      
      // 5. Call server-side sign out for cookie cleanup
      console.log('5️⃣ Calling server-side cleanup...')
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        console.warn('⚠️ Server-side cleanup failed:', error)
      }
      
      console.log('💥 FORCE AUTH RESET COMPLETED')
      
      // 6. Force navigation to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      
    } catch (error) {
      console.error('❌ Force auth reset failed:', error)
      
      // Last resort - clear what we can and reload
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
      }
    }
  },

  mcpValidatedSignOut: async () => {
    console.log('🔓 Starting MCP-validated sign out...')
    
    try {
      // Use the MCP-verified sign out function
      const result = await mcpVerifiedSignOut()
      
      if (!result.success) {
        console.error('❌ MCP sign out failed:', result.error)
        throw new Error(result.error || 'MCP sign out failed')
      }
      
      // Clear local state
      set({
        user: null,
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false
      })
      
      // Clear other stores
      try {
        const { useJobStore } = await import('@/lib/stores/jobStore')
        const { useUIStore } = await import('@/lib/stores/uiStore')
        
        useJobStore.getState().setJobs([])
        useJobStore.getState().clearFilters()
        useJobStore.getState().setSelectedJob(null)
        useJobStore.getState().setSearchTerm('')
        
        const currentTheme = useUIStore.getState().theme
        useUIStore.setState({
          toasts: [],
          sidebarOpen: false,
          theme: currentTheme
        })
      } catch (error) {
        console.warn('⚠️ Failed to clear other stores:', error)
      }
      
      // Force clear browser storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
      
      console.log('✅ MCP-validated sign out completed')
      
    } catch (error) {
      console.error('❌ MCP sign out failed:', error)
      
      // Fallback to regular force reset
      await get().forceAuthReset()
      throw error
    }
  },

  mcpValidateSession: async () => {
    console.log('🔍 Starting MCP session validation...')
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('❌ No session found')
        set({
          user: null,
          profile: null,
          golfCourseProfile: null,
          professionalProfile: null,
          isAuthenticated: false,
          isLoading: false
        })
        return false
      }
      
      // Validate with MCP
      const validation = await validateAuthWithMCP(session.user.id)
      
      console.log('📊 MCP Validation Result:', validation)
      
      if (!validation.isValid) {
        console.warn('⚠️ MCP validation failed - clearing auth state')
        
        // If validation fails, clear everything
        await get().mcpValidatedSignOut()
        return false
      }
      
      // If validation passes, update state with validated data
      if (validation.userDetails) {
        set({
          user: session.user,
          isAuthenticated: true,
          isLoading: false
        })
        
        // Refresh profile data
        await get().refreshProfile()
      }
      
      console.log('✅ MCP session validation passed')
      return true
      
    } catch (error) {
      console.error('❌ MCP session validation failed:', error)
      
      // On validation error, clear auth state for safety
      set({
        user: null,
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false
      })
      
      return false
    }
  },

  forceAuthSync: async () => {
    console.log('🔄 FORCE AUTH SYNC - manually syncing with Supabase...')
    
    try {
      const supabase = createClient()
      
      // Get the current session directly from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('📊 Force sync session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        error: sessionError?.message
      })
      
      if (sessionError) {
        console.error('❌ Force sync session error:', sessionError)
        set({
          user: null,
          profile: null,
          golfCourseProfile: null,
          professionalProfile: null,
          isAuthenticated: false,
          isLoading: false
        })
        return
      }
      
      if (session?.user) {
        console.log('✅ Force sync found user - updating auth state')
        set({
          user: session.user,
          isAuthenticated: true,
          isLoading: false
        })
        
        // Refresh profile
        await get().refreshProfile()
        console.log('✅ Force auth sync completed successfully')
      } else {
        console.log('❌ Force sync - no user found')
        set({
          user: null,
          profile: null,
          golfCourseProfile: null,
          professionalProfile: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
      
    } catch (error) {
      console.error('❌ Force auth sync failed:', error)
      set({
        user: null,
        profile: null,
        golfCourseProfile: null,
        professionalProfile: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },
}))
