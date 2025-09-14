import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint checks email configuration - should be removed in production
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    
    // Construct the email redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    const emailRedirectTo = `${baseUrl}/auth/callback`
    
    // Check environment variables
    const emailConfig = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
        VERCEL_URL: process.env.VERCEL_URL || 'Not set',
        computed_base_url: baseUrl,
        computed_redirect_url: emailRedirectTo
      },
      supabase_config: {
        url_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        anon_key_configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      auth_callback_check: {
        callback_route_exists: 'Should exist at /auth/callback',
        expected_redirect_url: emailRedirectTo,
        callback_functionality: 'Exchanges code for session and redirects to /dashboard'
      }
    }
    
    // Test if we can access Supabase Auth
    let authTest = null
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      authTest = {
        connection_working: !error,
        current_user: user?.id || 'No authenticated user',
        error: error?.message || null
      }
    } catch (e: any) {
      authTest = {
        connection_working: false,
        error: e.message
      }
    }

    const issues = []
    
    if (!process.env.NEXT_PUBLIC_SITE_URL && !process.env.VERCEL_URL) {
      issues.push('No NEXT_PUBLIC_SITE_URL or VERCEL_URL configured - using localhost fallback')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL is not configured')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
    }

    return NextResponse.json({
      status: 'Email configuration check',
      timestamp: new Date().toISOString(),
      ...emailConfig,
      auth_test: authTest,
      issues,
      recommendations: issues.length > 0 ? [
        'Ensure all Supabase environment variables are set',
        'Set NEXT_PUBLIC_SITE_URL for production domains',
        'Verify /auth/callback route is accessible',
        'Check Supabase Auth settings in dashboard'
      ] : [
        'Configuration looks good!',
        'Test email sending with registration',
        'Check Supabase Auth logs if emails still not sending'
      ]
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Email config check failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
