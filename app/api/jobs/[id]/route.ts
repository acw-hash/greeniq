import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobUpdateSchema } from '@/lib/validations/jobs'
import { z } from 'zod'

// GET /api/jobs/[id] - Get single job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate job ID
    const jobId = z.string().uuid().parse(params.id)

    // Fetch job with related data
    const { data: job, error } = await supabase
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
            address,
            description,
            facilities
          )
        ),
        applications (
          id,
          professional_id,
          message,
          proposed_rate,
          status,
          applied_at,
          profiles!applications_professional_id_fkey (
            id,
            full_name,
            avatar_url,
            professional_profiles (
              experience_level,
              specializations,
              rating,
              total_jobs
            )
          )
        )
      `)
      .eq('id', jobId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      console.error('Error fetching job:', error)
      return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    }

    // Check if user can view this job
    // Golf courses can view their own jobs, professionals can view all open jobs
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type === 'golf_course' && job.course_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (profile?.user_type === 'professional' && job.status !== 'open') {
      return NextResponse.json({ error: 'Job is not available' }, { status: 403 })
    }

    return NextResponse.json({ job })

  } catch (error) {
    console.error('Error in GET /api/jobs/[id]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/jobs/[id] - Update job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate job ID
    const jobId = z.string().uuid().parse(params.id)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = jobUpdateSchema.parse({ ...body, id: jobId })

    // Check if job exists and user owns it
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('course_id, status')
      .eq('id', jobId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      console.error('Error fetching job:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    }

    if (existingJob.course_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't allow editing completed or cancelled jobs
    if (existingJob.status === 'completed' || existingJob.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot edit completed or cancelled jobs' 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update provided fields
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.job_type) updateData.job_type = validatedData.job_type
    if (validatedData.location) {
      updateData.location = `(${validatedData.location.lng},${validatedData.location.lat})`
    }
    if (validatedData.start_date) updateData.start_date = validatedData.start_date
    if (validatedData.end_date !== undefined) updateData.end_date = validatedData.end_date
    if (validatedData.hourly_rate) updateData.hourly_rate = validatedData.hourly_rate
    if (validatedData.required_certifications) updateData.required_certifications = validatedData.required_certifications
    if (validatedData.required_experience) updateData.required_experience = validatedData.required_experience
    if (validatedData.urgency_level) updateData.urgency_level = validatedData.urgency_level
    if (validatedData.status) updateData.status = validatedData.status

    // Update job
    const { data: job, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
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

    if (updateError) {
      console.error('Error updating job:', updateError)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    // If status changed to in_progress, notify applicants
    if (validatedData.status === 'in_progress') {
      try {
        const { data: applications } = await supabase
          .from('applications')
          .select('professional_id')
          .eq('job_id', jobId)
          .eq('status', 'accepted')

        if (applications?.length) {
          const notifications = applications.map(app => ({
            user_id: app.professional_id,
            type: 'job_started',
            title: 'Job Started',
            message: `The job "${job.title}" has started.`,
            metadata: {
              job_id: jobId,
              job_title: job.title
            }
          }))

          await supabase
            .from('notifications')
            .insert(notifications)
        }
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError)
      }
    }

    return NextResponse.json({ job })

  } catch (error) {
    console.error('Error in PUT /api/jobs/[id]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate job ID
    const jobId = z.string().uuid().parse(params.id)

    // Check if job exists and user owns it
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('course_id, status, title')
      .eq('id', jobId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      console.error('Error fetching job:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    }

    if (existingJob.course_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't allow deleting jobs that are in progress or completed
    if (existingJob.status === 'in_progress' || existingJob.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot delete jobs that are in progress or completed' 
      }, { status: 400 })
    }

    // Delete job (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (deleteError) {
      console.error('Error deleting job:', deleteError)
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    // Notify applicants that job was cancelled
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select('professional_id')
        .eq('job_id', jobId)

      if (applications?.length) {
        const notifications = applications.map(app => ({
          user_id: app.professional_id,
          type: 'job_cancelled',
          title: 'Job Cancelled',
          message: `The job "${existingJob.title}" has been cancelled.`,
          metadata: {
            job_id: jobId,
            job_title: existingJob.title
          }
        }))

        await supabase
          .from('notifications')
          .insert(notifications)
      }
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError)
    }

    return NextResponse.json({ message: 'Job deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/jobs/[id]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}