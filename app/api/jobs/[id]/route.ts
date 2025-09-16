import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateJobSchema } from '@/lib/validations/jobs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        course_profile:profiles!course_id(
          id,
          full_name,
          email,
          phone
        ),
        golf_course_profile:profiles!course_id(
          golf_course_profiles(
            course_name,
            course_type,
            address,
            description,
            facilities
          )
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      throw error
    }

    // Get applications count
    const { count: applicationCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', params.id)

    // Get applications with professional details (for job owner)
    const { data: { user } } = await supabase.auth.getUser()
    let applications = []
    
    if (user && job.course_id === user.id) {
      const { data: applicationData } = await supabase
        .from('applications')
        .select(`
          *,
          professional_profile:professional_profiles!inner(
            *,
            profile:profiles!profile_id(
              full_name,
              email,
              phone
            )
          )
        `)
        .eq('job_id', params.id)
        .order('applied_at', { ascending: false })
      
      applications = applicationData || []
    }
    
    return NextResponse.json({
      ...job,
      applications_count: applicationCount || 0,
      applications: applications
    })
  } catch (error) {
    console.error('Job fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify job ownership
    const { data: job } = await supabase
      .from('jobs')
      .select('course_id')
      .eq('id', params.id)
      .single()
    
    if (!job || job.course_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Validate request body
    const body = await request.json()
    const validation = updateJobSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data
    
    // Handle location update if provided
    let updateData: any = { ...validatedData }
    if (validatedData.location) {
      updateData.location = `POINT(${validatedData.location.lng} ${validatedData.location.lat})`
    }
    
    // Update job
    const { data: updatedJob, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        course_profile:profiles!course_id(
          id,
          full_name,
          email,
          phone
        ),
        golf_course_profile:profiles!course_id(
          golf_course_profiles(
            course_name,
            course_type,
            address
          )
        )
      `)
      .single()
    
    if (error) {
      console.error('Job update error:', error)
      throw error
    }
    
    return NextResponse.json({
      message: 'Job updated successfully',
      job: updatedJob
    })
  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify job ownership
    const { data: job } = await supabase
      .from('jobs')
      .select('course_id, status')
      .eq('id', params.id)
      .single()
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    if (job.course_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if job can be deleted (only if no accepted applications)
    const { data: acceptedApplications } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', params.id)
      .eq('status', 'accepted')

    if (acceptedApplications && acceptedApplications.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete job with accepted applications' },
        { status: 400 }
      )
    }
    
    // Delete job (cascade will handle applications and messages)
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      console.error('Job deletion error:', error)
      throw error
    }
    
    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('Job deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}
