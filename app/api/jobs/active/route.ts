import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to determine type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('jobs')
      .select(`
        *,
        applications!inner(*),
        job_updates(*),
        golf_course_profiles(course_name, location),
        professional_profiles(full_name, rating)
      `)
      .in('status', ['confirmed', 'in_progress', 'awaiting_review'])

    if (profile?.user_type === 'golf_course') {
      query = query.eq('course_id', user.id)
    } else {
      query = query
        .eq('applications.professional_id', user.id)
        .eq('applications.status', 'confirmed')
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch active jobs' },
      { status: 500 }
    )
  }
}
