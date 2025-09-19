import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobSearchSchema } from '@/lib/validations/jobs'
import { z } from 'zod'

// GET /api/jobs/search - Advanced job search with PostGIS
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

    // Build base query
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
        )
      `)
      .eq('status', validatedSearch.status)

    // Apply text search
    if (validatedSearch.search) {
      query = query.or(`title.ilike.%${validatedSearch.search}%,description.ilike.%${validatedSearch.search}%`)
    }

    // Apply filters
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

    // Location-based filtering with PostGIS distance calculation
    if (validatedSearch.location) {
      const { lat, lng } = validatedSearch.location
      const radius = validatedSearch.radius || 25
      
      // Use PostGIS ST_DWithin for accurate distance calculation
      // Convert radius from miles to meters (1 mile = 1609.34 meters)
      const radiusMeters = radius * 1609.34
      
      // Create a point from the search location
      const searchPoint = `SRID=4326;POINT(${lng} ${lat})`
      
      // Use ST_DWithin for distance filtering
      query = query.filter('location', 'st_dwithin', `${searchPoint},${radiusMeters}`)
    }

    // Get user's profile for personalized results
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('professional_profiles(*)')
      .eq('id', user.id)
      .single()

    // If user is a professional, prioritize jobs matching their skills
    if (userProfile?.professional_profiles) {
      const profProfile = userProfile.professional_profiles
      
      // Add scoring based on user's specializations and experience
      // This is a simplified approach - in production, you'd want more sophisticated matching
      if ((profProfile as any).specializations?.length) {
        // Jobs matching user's specializations get priority
        query = query.order('job_type', { ascending: true })
      }
      
      if ((profProfile as any).experience_level) {
        // Filter out jobs requiring higher experience than user has
        const experienceLevels = ['entry', 'intermediate', 'expert']
        const userLevelIndex = experienceLevels.indexOf((profProfile as any).experience_level)
        
        if (userLevelIndex >= 0) {
          const allowedLevels = experienceLevels.slice(0, userLevelIndex + 1)
          query = query.in('required_experience', allowedLevels)
        }
      }
    }

    // Pagination
    const offset = (validatedSearch.page - 1) * validatedSearch.limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + validatedSearch.limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Error searching jobs:', error)
      return NextResponse.json({ error: 'Failed to search jobs' }, { status: 500 })
    }

    // Calculate distances for location-based results
    let jobsWithDistance = jobs || []
    if (validatedSearch.location && jobs?.length) {
      jobsWithDistance = jobs.map(job => {
        if (job.location) {
          // Parse PostGIS point format (lng,lat)
          const [lng, lat] = job.location.replace(/[()]/g, '').split(',').map(Number)
          
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            validatedSearch.location!.lat,
            validatedSearch.location!.lng,
            lat,
            lng
          )
          
          return { ...job, distance: Math.round(distance * 10) / 10 } // Round to 1 decimal
        }
        return job
      })
      
      // Sort by distance
      jobsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    // Get job statistics for the search
    const { data: stats } = await supabase
      .from('jobs')
      .select('job_type, urgency_level, hourly_rate')
      .eq('status', 'open')

    const searchStats = {
      totalJobs: count || 0,
      averageRate: stats?.length ? 
        Math.round(stats.reduce((sum, job) => sum + Number(job.hourly_rate), 0) / stats.length * 100) / 100 : 0,
      jobTypes: stats?.reduce((acc, job) => {
        acc[job.job_type] = (acc[job.job_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      urgencyLevels: stats?.reduce((acc, job) => {
        acc[job.urgency_level] = (acc[job.urgency_level] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }

    return NextResponse.json({
      jobs: jobsWithDistance,
      pagination: {
        page: validatedSearch.page,
        limit: validatedSearch.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedSearch.limit)
      },
      stats: searchStats,
      searchParams: validatedSearch
    })

  } catch (error) {
    console.error('Error in GET /api/jobs/search:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid search parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
