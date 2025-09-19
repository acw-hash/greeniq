import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobSchema, jobSearchSchema } from '@/lib/validations/jobs'
import { z } from 'zod'

// Professional matching function
async function notifyMatchingProfessionals(jobId: string, jobData: any, supabase: any) {
  try {
    // Get job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) return

    // Find matching professionals based on:
    // - Location (within travel radius)
    // - Specializations
    // - Required certifications
    // - Experience level
    
    let query = supabase
      .from('profiles')
      .select(`
        id, 
        professional_profiles (
          specializations,
          certifications,
          experience_level,
          travel_radius,
          location
        )
      `)
      .eq('user_type', 'professional')
      .not('professional_profiles', 'is', null)

    // Apply filters for better matching
    if (jobData.required_experience) {
      // Match experience level or higher
      const experienceLevels = ['entry', 'intermediate', 'expert']
      const requiredIndex = experienceLevels.indexOf(jobData.required_experience)
      const validLevels = experienceLevels.slice(requiredIndex)
      
      query = query.in('professional_profiles.experience_level', validLevels)
    }

    const { data: matchingProfessionals } = await query

    if (matchingProfessionals?.length) {
      // Create notifications for matching professionals
      const notifications = matchingProfessionals.map((prof: any) => ({
        user_id: prof.id,
        type: 'new_job',
        title: 'New Job Available',
        message: `A new ${jobData.job_type} job has been posted near you for $${jobData.hourly_rate}/hour.`,
        metadata: {
          job_id: jobId,
          job_type: jobData.job_type,
          hourly_rate: jobData.hourly_rate,
          urgency_level: jobData.urgency_level,
          location: jobData.location
        },
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('notifications')
        .insert(notifications)

      console.log(`Created ${notifications.length} notifications for job ${jobId}`)
    }
  } catch (error) {
    console.error('Error in notifyMatchingProfessionals:', error)
    throw error
  }
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const maxRequests = 10 // max 10 jobs per hour
  
  const userLimit = rateLimitStore.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  return true
}

// GET /api/jobs - List jobs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = {
      search: searchParams.get('search') || undefined,
      job_type: searchParams.get('job_type') || undefined,
      min_rate: searchParams.get('min_rate') ? Number(searchParams.get('min_rate')) : undefined,
      max_rate: searchParams.get('max_rate') ? Number(searchParams.get('max_rate')) : undefined,
      location: searchParams.get('lat') && searchParams.get('lng') ? {
        lat: Number(searchParams.get('lat')),
        lng: Number(searchParams.get('lng')),
        address: searchParams.get('address') || ''
      } : undefined,
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : 25,
      urgency_level: searchParams.get('urgency_level') || undefined,
      required_experience: searchParams.get('required_experience') || undefined,
      required_certifications: searchParams.get('required_certifications')?.split(',') || undefined,
      status: searchParams.get('status') || 'open',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    }

    // Validate search parameters
    const validatedSearch = jobSearchSchema.parse(searchData)

    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        *,
        profiles!jobs_course_id_fkey (
          id,
          full_name,
          email,
          avatar_url,
          golf_course_profiles (
            course_name,
            course_type,
            address
          )
        ),
        applications (
          count
        )
      `)
      .eq('status', validatedSearch.status)

    // Apply filters
    if (validatedSearch.search) {
      query = query.or(`title.ilike.%${validatedSearch.search}%,description.ilike.%${validatedSearch.search}%`)
    }

    if (validatedSearch.job_type) {
      query = query.eq('job_type', validatedSearch.job_type)
    }

    if (validatedSearch.min_rate) {
      query = query.gte('hourly_rate', validatedSearch.min_rate)
    }

    if (validatedSearch.max_rate) {
      query = query.lte('hourly_rate', validatedSearch.max_rate)
    }

    if (validatedSearch.urgency_level) {
      query = query.eq('urgency_level', validatedSearch.urgency_level)
    }

    if (validatedSearch.required_experience) {
      query = query.eq('required_experience', validatedSearch.required_experience)
    }

    if (validatedSearch.required_certifications?.length) {
      query = query.overlaps('required_certifications', validatedSearch.required_certifications)
    }

    // Location-based filtering (simplified - in production, use PostGIS for proper distance calculation)
    if (validatedSearch.location) {
      // For now, we'll do a simple bounding box search
      // In production, implement proper PostGIS distance queries
      const lat = validatedSearch.location.lat
      const lng = validatedSearch.location.lng
      const radius = validatedSearch.radius
      
      // Approximate degrees per mile (rough calculation)
      const latDegrees = radius / 69
      const lngDegrees = radius / (69 * Math.cos(lat * Math.PI / 180))
      
      query = query
        .gte('location', `(${lng - lngDegrees},${lat - latDegrees})`)
        .lte('location', `(${lng + lngDegrees},${lat + latDegrees})`)
    }

    // Pagination
    const offset = (validatedSearch.page - 1) * validatedSearch.limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + validatedSearch.limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page: validatedSearch.page,
        limit: validatedSearch.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedSearch.limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/jobs:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid search parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/jobs - Create new job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Maximum 10 jobs per hour.' 
      }, { status: 429 })
    }

    // Get user profile to verify they're a golf course
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type, golf_course_profiles(*)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_type !== 'golf_course') {
      return NextResponse.json({ 
        error: 'Only golf courses can create jobs' 
      }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = jobSchema.parse(body)

    // Convert location to PostGIS point format
    const locationPoint = `(${validatedData.location.lng},${validatedData.location.lat})`

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        course_id: profile.id,
        title: validatedData.title,
        description: validatedData.description,
        job_type: validatedData.job_type,
        location: locationPoint,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        hourly_rate: validatedData.hourly_rate,
        required_certifications: validatedData.required_certifications,
        required_experience: validatedData.required_experience,
        urgency_level: validatedData.urgency_level,
        estimated_duration: validatedData.estimated_duration,
        special_equipment: validatedData.special_equipment
      })
      .select(`
        *,
        profiles!jobs_course_id_fkey (
          id,
          full_name,
          email,
          avatar_url,
          golf_course_profiles (
            course_name,
            course_type,
            address
          )
        )
      `)
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    // Notify matching professionals
    try {
      await notifyMatchingProfessionals(job.id, validatedData, supabase)
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError)
      // Don't fail the job creation if notifications fail
    }

    return NextResponse.json({ job }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/jobs:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}