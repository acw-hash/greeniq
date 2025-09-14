import { NextRequest, NextResponse } from 'next/server'

// This endpoint validates the basic setup - should be removed in production
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const checks = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    },
    supabase: {
      url_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      anon_key_configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anon_key_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      service_role_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    },
    validation: {
      all_supabase_vars_present: !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    }
  }

  const issues = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 100) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short - check if it\'s complete')
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length < 100) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY seems too short - check if it\'s complete')
  }

  return NextResponse.json({
    ...checks,
    issues,
    ready_for_registration: issues.length === 0,
    next_steps: issues.length > 0 ? [
      'Create a .env.local file in your project root',
      'Add the missing environment variables',
      'Restart your development server',
      'Check /api/health endpoint'
    ] : [
      'Environment looks good!',
      'Test registration flow',
      'Check /api/debug/schema for database setup'
    ]
  })
}
