import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, completion_notes } = body

    // Verify user is the assigned professional for this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        applications!inner (
          professional_id,
          status
        )
      `)
      .eq('id', params.id)
      .eq('applications.professional_id', user.id)
      .eq('applications.status', 'accepted_by_professional')
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Update job status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status,
        completion_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Create automatic job update
    const updateTitle = status === 'completed' ? 'Job Completed' : 'Job Started'
    const updateDescription = status === 'completed' 
      ? `Job has been marked as completed. ${completion_notes || ''}`
      : 'Job has been started by the professional.'

    const { error: jobUpdateError } = await supabase
      .from('job_updates')
      .insert({
        job_id: params.id,
        professional_id: user.id,
        update_type: status === 'completed' ? 'completed' : 'started',
        title: updateTitle,
        description: updateDescription
      })

    if (jobUpdateError) {
      console.error('Error creating job update:', jobUpdateError)
    }

    // Send notification to golf course
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: job.course_id,
        type: 'job_status_update',
        title: `Job ${status}`,
        message: `Your job has been ${status} by the professional.`,
        metadata: {
          job_id: params.id,
          status,
          completion_notes
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: `Job ${status} successfully`
    })

  } catch (error) {
    console.error('Error updating job status:', error)
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    )
  }
}