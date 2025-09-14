/**
 * MCP-Enhanced Authentication Validator
 * Uses direct database queries to verify auth state
 */

import { createClient } from '@/lib/supabase/client'

export interface MCPAuthValidationResult {
  isValid: boolean
  hasAuthUser: boolean
  hasProfile: boolean
  hasActiveSessions: boolean
  userDetails?: {
    id: string
    email: string
    lastSignInAt: string
    profile?: {
      fullName: string
      userType: string
      isVerified: boolean
    }
  }
  error?: string
}

/**
 * Validates authentication state using MCP queries
 */
export async function validateAuthWithMCP(userId?: string): Promise<MCPAuthValidationResult> {
  try {
    console.log('🔍 MCP Auth Validation - Starting...')
    
    const supabase = createClient()
    
    // First get the current session from Supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ MCP Validation - Session error:', sessionError)
      return {
        isValid: false,
        hasAuthUser: false,
        hasProfile: false,
        hasActiveSessions: false,
        error: sessionError.message
      }
    }

    const userIdToCheck = userId || session?.user?.id
    
    if (!userIdToCheck) {
      console.log('❌ MCP Validation - No user ID to check')
      return {
        isValid: false,
        hasAuthUser: false,
        hasProfile: false,
        hasActiveSessions: false,
        error: 'No user ID provided'
      }
    }

    console.log(`🔍 MCP Validation - Checking user: ${userIdToCheck}`)

    // Query 1: Check if auth user exists
    const authUserResponse = await fetch('/api/auth/mcp-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'check_auth_user',
        userId: userIdToCheck 
      })
    })

    const authUserData = await authUserResponse.json()
    
    // Query 2: Check if profile exists
    const profileResponse = await fetch('/api/auth/mcp-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'check_profile',
        userId: userIdToCheck 
      })
    })

    const profileData = await profileResponse.json()

    // Query 3: Check active sessions
    const sessionsResponse = await fetch('/api/auth/mcp-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'check_sessions',
        userId: userIdToCheck 
      })
    })

    const sessionsData = await sessionsResponse.json()

    const result: MCPAuthValidationResult = {
      isValid: authUserData.exists && profileData.exists,
      hasAuthUser: authUserData.exists,
      hasProfile: profileData.exists,
      hasActiveSessions: sessionsData.hasActiveSessions,
      userDetails: authUserData.exists ? {
        id: userIdToCheck,
        email: authUserData.user?.email,
        lastSignInAt: authUserData.user?.last_sign_in_at,
        profile: profileData.exists ? {
          fullName: profileData.profile?.full_name,
          userType: profileData.profile?.user_type,
          isVerified: profileData.profile?.is_verified
        } : undefined
      } : undefined
    }

    console.log('✅ MCP Validation Result:', result)
    return result

  } catch (error) {
    console.error('❌ MCP Validation failed:', error)
    return {
      isValid: false,
      hasAuthUser: false,
      hasProfile: false,
      hasActiveSessions: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clears all authentication state using MCP verification
 */
export async function mcpVerifiedSignOut(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔓 MCP Verified Sign Out - Starting...')
    
    const supabase = createClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    
    if (!userId) {
      console.log('ℹ️ No user to sign out')
      return { success: true }
    }

    // Step 1: Clear sessions via MCP
    const clearSessionsResponse = await fetch('/api/auth/mcp-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'clear_sessions',
        userId 
      })
    })

    const clearSessionsResult = await clearSessionsResponse.json()
    
    if (!clearSessionsResult.success) {
      console.error('❌ Failed to clear sessions via MCP')
    }

    // Step 2: Sign out from Supabase client
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    
    if (error) {
      console.error('❌ Supabase sign out error:', error)
    }

    // Step 3: Verify sessions are cleared
    const verificationResponse = await fetch('/api/auth/mcp-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'check_sessions',
        userId 
      })
    })

    const verificationResult = await verificationResponse.json()
    
    if (verificationResult.hasActiveSessions) {
      console.warn('⚠️ Sessions still active after sign out!')
      return { 
        success: false, 
        error: 'Sessions not properly cleared' 
      }
    }

    console.log('✅ MCP Verified Sign Out completed successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ MCP Verified Sign Out failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
