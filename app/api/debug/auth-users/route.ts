import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint is for debugging purposes only - should be removed in production
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (userId) {
      // Check specific user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      return NextResponse.json({
        user_id: userId,
        current_auth_user: user?.id || null,
        profile_exists: !!profile,
        profile_data: profile,
        auth_error: authError?.message,
        profile_error: profileError?.message
      })
    }

    // General info about current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_type, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      current_user: user?.id || null,
      total_profiles: profileCount || 0,
      recent_profiles: profiles || [],
      auth_error: authError?.message,
      profiles_error: profilesError?.message,
      environment: process.env.NODE_ENV
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
