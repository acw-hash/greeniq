import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  console.log('🔄 Auth callback received:', {
    code: code ? 'present' : 'missing',
    next,
    url: requestUrl.toString()
  })

  if (code) {
    const supabase = await createClient()
    
    try {
      console.log('🔑 Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error)
        return NextResponse.redirect(new URL(`/login?error=auth_callback_failed&details=${encodeURIComponent(error.message)}`, request.url))
      }
      
      console.log('✅ Session exchange successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: !!data.user?.email_confirmed_at
      })
      
      // Give the database trigger a moment to create the profile
      if (data.user?.email_confirmed_at) {
        console.log('📧 Email confirmed - profile creation should be triggered')
      }
      
    } catch (error) {
      console.error('💥 Unexpected error during session exchange:', error)
      return NextResponse.redirect(new URL('/login?error=callback_exception', request.url))
    }
  } else {
    console.log('⚠️ No authorization code provided in callback')
  }

  console.log('🔄 Redirecting to:', next)
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, request.url))
}
