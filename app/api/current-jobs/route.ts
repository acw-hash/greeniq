import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_type === 'professional') {
      // Get current jobs for professional (accepted applications, not completed)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          applications!inner (
            id,
            status,
            applied_at
          ),
          golf_course:profiles!jobs_course_id_fkey (
            full_name,
            golf_course_profiles (
              course_name,
              course_type
            )
          ),
          job_updates (
            id,
            created_at
          )
        `)
        .eq('applications.professional_id', user.id)
        .eq('applications.status', 'accepted')
        .in('status', ['in_progress'])
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Process data to add useful fields
      const processedJobs = (data || []).map(job => ({
        ...job,
        updates_count: job.job_updates?.length || 0,
        last_update: job.job_updates?.length > 0 
          ? job.job_updates[job.job_updates.length - 1].created_at 
          : job.updated_at
      }))

      return NextResponse.json(processedJobs)

    } else if (profile.user_type === 'golf_course') {
      // Get current jobs for golf course (jobs with accepted applications, not completed)
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          applications!inner (
            id,
            status,
            professional_id,
            profiles!applications_professional_id_fkey (
              full_name
            )
          ),
          job_updates (
            id,
            created_at
          )
        `)
        .eq('course_id', user.id)
        .eq('applications.status', 'accepted')
        .in('status', ['in_progress'])
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Process data to add useful fields
      const processedJobs = (data || []).map(job => ({
        ...job,
        professional: job.applications[0]?.profiles,
        updates_count: job.job_updates?.length || 0,
        last_update: job.job_updates?.length > 0 
          ? job.job_updates[job.job_updates.length - 1].created_at 
          : job.updated_at
      }))

      return NextResponse.json(processedJobs)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching current jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch current jobs' }, { status: 500 })
  }
}
