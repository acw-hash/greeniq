import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { action } = await request.json() // 'confirm' or 'deny'
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs(id, course_id, title)
      `)
      .eq('id', params.id)
      .eq('professional_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (action === 'confirm') {
      // Update application status to confirmed
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // Update job status to confirmed
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'confirmed' })
        .eq('id', application.jobs.id)

      if (jobError) throw jobError

      // Create initial job update
      const { error: updateCreateError } = await supabase
        .from('job_updates')
        .insert({
          job_id: application.jobs.id,
          professional_id: user.id,
          update_type: 'milestone',
          milestone: 'started',
          content: 'Job confirmed and ready to begin'
        })

      if (updateCreateError) throw updateCreateError

      // Create notification for golf course
      await supabase
        .from('notifications')
        .insert({
          user_id: application.jobs.course_id,
          type: 'job_confirmed',
          title: 'Job Confirmed',
          message: `Professional has confirmed the job: ${application.jobs.title}`,
          metadata: { job_id: application.jobs.id, application_id: params.id }
        })

    } else if (action === 'deny') {
      // Update application status to denied
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          status: 'denied',
          denied_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      // Set job back to open and remove other accepted applications
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'open' })
        .eq('id', application.jobs.id)

      if (jobError) throw jobError

      // Create notification for golf course
      await supabase
        .from('notifications')
        .insert({
          user_id: application.jobs.course_id,
          type: 'job_denied',
          title: 'Job Declined',
          message: `Professional declined the job: ${application.jobs.title}`,
          metadata: { job_id: application.jobs.id, application_id: params.id }
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Application confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to process application confirmation' },
      { status: 500 }
    )
  }
}
