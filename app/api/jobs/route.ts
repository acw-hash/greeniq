import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJobSchema, jobFiltersSchema } from '@/lib/validations/jobs'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Simple query without complex joins for now
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }
    
    return NextResponse.json(jobs || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify user is a golf course
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.user_type !== 'golf_course') {
      return NextResponse.json({ error: 'Only golf courses can post jobs' }, { status: 403 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createJobSchema.parse(body)
    
    // Prepare job data for database
    const jobData = {
      course_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      job_type: validatedData.job_type,
      location: `POINT(${validatedData.location.lng} ${validatedData.location.lat})`,
      start_date: new Date(validatedData.start_date).toISOString(),
      end_date: validatedData.end_date && validatedData.end_date !== '' 
        ? new Date(validatedData.end_date).toISOString() 
        : null,
      hourly_rate: validatedData.hourly_rate,
      required_certifications: validatedData.required_certifications || [],
      required_experience: validatedData.required_experience || null,
      urgency_level: validatedData.urgency_level,
      status: 'open' as const
    }
    
    // Create job in database
    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select(`
        *,
        golf_course_profiles(course_name, address)
      `)
      .single()
    
    if (error) {
      console.error('Database insertion error:', error)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }
    
    // TODO: Trigger notifications to matching professionals
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}