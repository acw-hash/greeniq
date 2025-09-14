import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createJobSchema, jobFiltersSchema } from '@/lib/validations/jobs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const filters = {
      job_type: searchParams.get('job_type') || undefined,
      min_rate: searchParams.get('min_rate') ? parseFloat(searchParams.get('min_rate')!) : undefined,
      max_rate: searchParams.get('max_rate') ? parseFloat(searchParams.get('max_rate')!) : undefined,
      max_distance: searchParams.get('max_distance') ? parseInt(searchParams.get('max_distance')!) : undefined,
      location: searchParams.get('location') || undefined,
      urgency_level: searchParams.get('urgency_level') as any || undefined,
      required_experience: searchParams.get('required_experience') as any || undefined,
      status: searchParams.get('status') as any || 'open',
      search: searchParams.get('search') || undefined,
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50
    
    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        *,
        course_profile:profiles!course_id(
          id,
          full_name,
          email,
          phone
        ),
        golf_course_profile:golf_course_profiles!course_id(
          course_name,
          course_type,
          address
        )
      `, { count: 'exact' })
      .eq('status', filters.status || 'open')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters.job_type) {
      query = query.eq('job_type', filters.job_type)
    }
    
    if (filters.min_rate) {
      query = query.gte('hourly_rate', filters.min_rate)
    }
    
    if (filters.max_rate) {
      query = query.lte('hourly_rate', filters.max_rate)
    }

    if (filters.urgency_level) {
      query = query.eq('urgency_level', filters.urgency_level)
    }

    if (filters.required_experience) {
      query = query.eq('required_experience', filters.required_experience)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,job_type.ilike.%${filters.search}%`)
    }
    
    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data: jobs, error, count } = await query
    
    if (error) {
      console.error('Jobs query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs from database' },
        { status: 500 }
      )
    }

    // Handle empty results
    if (!jobs || jobs.length === 0) {
      return NextResponse.json([])
    }

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        try {
          const { count: applicationCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)

          return {
            ...job,
            applications_count: applicationCount || 0
          }
        } catch (error) {
          console.error(`Error fetching application count for job ${job.id}:`, error)
          return {
            ...job,
            applications_count: 0
          }
        }
      })
    )
    
    return NextResponse.json(jobsWithCounts)
  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
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
    
    if (profile?.user_type !== 'golf_course') {
      return NextResponse.json({ error: 'Only golf courses can post jobs' }, { status: 403 })
    }
    
    // Validate request body
    const body = await request.json()
    const validation = createJobSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data
    
    // Convert location to PostGIS point
    const locationPoint = `POINT(${validatedData.location.lng} ${validatedData.location.lat})`
    
    // Create job
    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert({
        course_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        job_type: validatedData.job_type,
        location: locationPoint,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date || null,
        hourly_rate: validatedData.hourly_rate,
        required_certifications: validatedData.required_certifications || [],
        required_experience: validatedData.required_experience || null,
        urgency_level: validatedData.urgency_level || 'normal'
      })
      .select(`
        *,
        course_profile:profiles!course_id(
          id,
          full_name,
          email,
          phone
        ),
        golf_course_profile:golf_course_profiles!course_id(
          course_name,
          course_type,
          address
        )
      `)
      .single()
    
    if (error) {
      console.error('Job creation error:', error)
      throw error
    }
    
    // TODO: Trigger job matching and notifications
    // await notifyMatchingProfessionals(newJob.id)
    
    return NextResponse.json({
      message: 'Job created successfully',
      job: newJob
    }, { status: 201 })
  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
