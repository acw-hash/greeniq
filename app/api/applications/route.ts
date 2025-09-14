import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApplicationSchema } from '@/lib/validations/jobs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user profile to determine user type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()
    
    let query = supabase.from('applications').select(`
      *,
      jobs!inner(
        *,
        golf_course_profiles!inner(course_name)
      ),
      professional_profiles!inner(
        *,
        profiles!inner(full_name, email)
      )
    `)
    
    // Filter based on user type
    if (profile?.user_type === 'professional') {
      query = query.eq('professional_id', user.id)
    } else if (profile?.user_type === 'golf_course') {
      query = query.eq('jobs.course_id', user.id)
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 403 })
    }
    
    // Add additional filters
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('applied_at', { ascending: false })
    
    if (error) {
      console.error('Applications query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications from database' },
        { status: 500 }
      )
    }
    
    // Handle empty results gracefully
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
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
      .select('user_type')
      .eq('id', user.id)
      .single()
    
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
      .single()
    
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
        jobs!inner(
          title,
          golf_course_profiles!inner(course_name)
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
