import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔓 Server-side sign out initiated...')
    
    const supabase = await createClient()
    
    // Log current session before sign out
    const { data: currentSession } = await supabase.auth.getSession()
    console.log('📊 Server session before sign out:', {
      hasSession: !!currentSession.session,
      userId: currentSession.session?.user?.id
    })
    
    // Sign out from Supabase with global scope
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    
    if (error) {
      console.error('❌ Server sign out error:', error)
      // Don't return error - continue with cookie cleanup
    } else {
      console.log('✅ Server-side Supabase sign out successful')
    }
    
    // Create response that aggressively clears all possible cookies
    const response = NextResponse.json({ success: true })
    
    // Comprehensive list of all possible Supabase cookie variations
    const cookieNames = [
      // Standard Supabase cookies
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-project-ref',
      'sb-api-url',
      
      // Possible variations and legacy cookies
      'supabase_auth_token',
      'supabase-token',
      'supabase_token',
      'auth-token',
      'auth_token',
      'access-token',
      'access_token',
      'refresh-token', 
      'refresh_token',
      
      // Next.js auth cookies
      'next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      
      // Any custom auth cookies that might exist
      'user-session',
      'user_session',
      'session-id',
      'session_id'
    ]
    
    console.log(`🧹 Clearing ${cookieNames.length} possible cookie variations...`)
    
    cookieNames.forEach(name => {
      // Delete cookie
      response.cookies.delete(name)
      
      // Set expired cookies as additional cleanup
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      })
    })
    
    // Also clear any cookies from the request
    const requestCookies = request.cookies.getAll()
    console.log('📊 Request cookies found:', requestCookies.map(c => c.name))
    
    requestCookies.forEach(cookie => {
      if (cookie.name.includes('supabase') || 
          cookie.name.includes('auth') || 
          cookie.name.includes('token') ||
          cookie.name.includes('session')) {
        response.cookies.delete(cookie.name)
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        })
      }
    })
    
    console.log('✅ All server-side cookies cleared')
    
    return response
    
  } catch (error) {
    console.error('❌ Sign out API error:', error)
    
    // Even on error, try to clear cookies
    const response = NextResponse.json(
      { error: 'Internal server error', cleared: true }, 
      { status: 500 }
    )
    
    // Basic cookie cleanup on error
    const basicCookies = ['supabase-auth-token', 'supabase.auth.token', 'sb-access-token', 'sb-refresh-token']
    basicCookies.forEach(name => {
      response.cookies.delete(name)
      response.cookies.set(name, '', { expires: new Date(0), path: '/' })
    })
    
    return response
  }
}
