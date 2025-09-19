import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('course_id')
      .eq('id', params.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.course_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get applications for this specific job
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles!applications_professional_id_fkey (
          id,
          full_name,
          phone,
          professional_profiles (
            bio,
            experience_level,
            rating,
            hourly_rate,
            specializations
          )
        )
      `)
      .eq('job_id', params.id)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('Job applications error:', error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Job applications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job applications', details: error.message },
      { status: 500 }
    )
  }
}
