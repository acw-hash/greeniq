import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApplicationSchema } from '@/lib/validations/jobs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  try {
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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_type === 'professional') {
      // CORRECTED: Get applications for professional with proper relationship path
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            description,
            job_type,
            hourly_rate,
            start_date,
            status,
            course_id,
            profiles!jobs_course_id_fkey (
              id,
              full_name,
              golf_course_profiles (
                course_name,
                course_type,
                address
              )
            )
          )
        `)
        .eq('professional_id', user.id)
        .order('applied_at', { ascending: false })

      if (error) {
        console.error('Professional applications error:', error)
        throw error
      }
      return NextResponse.json(data || [])

    } else if (profile.user_type === 'golf_course') {
      // CORRECTED: Get applications for golf course jobs with proper relationship path
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            job_type,
            hourly_rate,
            start_date,
            course_id
          ),
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
        .eq('jobs.course_id', user.id)
        .order('applied_at', { ascending: false })

      if (error) {
        console.error('Golf course applications error:', error)
        throw error
      }
      return NextResponse.json(data || [])
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify user is a professional
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', user.id)
      .single() as { data: { id: string; user_type: string } | null }
    
    if (profile?.user_type !== 'professional') {
      return NextResponse.json({ error: 'Only professionals can apply to jobs' }, { status: 403 })
    }
    
    // Validate request body
    const body = await request.json()
    const validation = createApplicationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const validatedData = validation.data
    
    // Check if job exists and is open
    const { data: job } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', validatedData.job_id)
      .single() as { data: { status: string } | null }
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Job is no longer accepting applications' }, { status: 400 })
    }
    
    // Create application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: validatedData.job_id,
        professional_id: user.id,
        message: validatedData.message,
        proposed_rate: validatedData.proposed_rate
      })
      .select(`
        *,
        jobs!applications_job_id_fkey (
          title,
          job_type,
          hourly_rate,
          profiles!jobs_course_id_fkey (
            full_name,
            golf_course_profiles (
              course_name,
              course_type
            )
          )
        )
      `)
      .single()
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 })
      }
      throw error
    }
    
    // TODO: Send notification to golf course
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Application creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
