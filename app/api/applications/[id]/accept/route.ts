import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the application details
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner (
          id,
          title,
          course_id,
          status
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' }, 
        { status: 404 }
      )
    }

    // Verify this is the professional's application
    if (application.professional_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to accept this application' }, 
        { status: 403 }
      )
    }

    // Verify application is accepted by course
    if (application.status !== 'accepted_by_course') {
      return NextResponse.json(
        { error: 'Application must be accepted by the golf course first' }, 
        { status: 400 }
      )
    }

    // Update application status to accepted by professional
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({ 
        status: 'accepted_by_professional'
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Application update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application', details: updateError.message }, 
        { status: 500 }
      )
    }

    // Update job status to in_progress
    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'in_progress'
      })
      .eq('id', application.job_id)

    if (jobUpdateError) {
      console.error('Error updating job status:', jobUpdateError)
      // Don't fail the main request for this
    }

    // Create automatic conversation between golf course and professional
    const { data: conversation, error: conversationError } = await supabase
      .from('job_conversations')
      .insert({
        job_id: application.job_id,
        course_id: application.jobs.course_id,
        professional_id: application.professional_id
      })
      .select()
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      // Don't fail the main request
    } else {
      // Send initial welcome message from golf course
      const { error: welcomeMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: application.jobs.course_id,
          content: `Welcome! Your application has been accepted and you've confirmed the job. Please coordinate the job details and start when ready.`,
          message_type: 'text'
        })

      if (welcomeMessageError) {
        console.error('Error sending welcome message:', welcomeMessageError)
      }
    }

    // Create notification for the golf course
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: application.jobs.course_id,
        type: 'job_accepted',
        title: 'Job Accepted by Professional',
        message: `The professional has accepted the job "${application.jobs.title}". You can now communicate and track progress.`,
        metadata: {
          application_id: params.id,
          job_id: application.job_id,
          professional_id: application.professional_id
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the main request for this
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      conversation: conversation,
      message: 'Job accepted successfully'
    })

  } catch (error) {
    console.error('Accept job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
