import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateApplicationSchema, type UpdateApplicationData } from '@/lib/validations/jobs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    // Validate Supabase client
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client not properly initialized')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get application details
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          *,
          profiles!jobs_course_id_fkey (
            id,
            full_name,
            golf_course_profiles (
              course_name,
              course_type,
              address
            )
          )
        ),
        profiles!applications_professional_id_fkey (
          id,
          full_name,
          email,
          phone,
          professional_profiles (
            bio,
            experience_level,
            specializations,
            equipment_skills,
            hourly_rate,
            rating,
            total_jobs
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' }, 
        { status: 404 }
      )
    }

    // Check if user has permission to view this application
    const canView = 
      application.professional_id === user.id || // Professional who applied
      application.jobs.course_id === user.id      // Golf course who posted job

    if (!canView) {
      return NextResponse.json(
        { error: 'Not authorized to view this application' }, 
        { status: 403 }
      )
    }

    return NextResponse.json(application)

  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Application Accept Debug - Starting')
    console.log('Application ID:', params.id)
    
    // Validate Supabase client
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client not properly initialized')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get and validate request body
    let body
    try {
      body = await request.json()
      console.log('📝 Request body:', body)
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { status } = body

    // Validate status
    if (!status) {
      console.log('❌ Missing status in request body')
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    if (!['accepted', 'rejected'].includes(status)) {
      console.log('❌ Invalid status:', status)
      return NextResponse.json({ error: 'Invalid status. Must be "accepted" or "rejected"' }, { status: 400 })
    }
    console.log('✅ Status validated:', status)

    // Get application with job details
    console.log('🔍 Fetching application details...')
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner (
          course_id,
          title,
          id
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.log('❌ Application fetch error:', fetchError)
      return NextResponse.json({ 
        error: 'Application not found', 
        details: fetchError.message 
      }, { status: 404 })
    }

    if (!application) {
      console.log('❌ Application not found')
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    console.log('✅ Application found:', application.id)
    console.log('✅ Job details:', application.jobs)

    // Verify user owns the job
    if (application.jobs.course_id !== user.id) {
      console.log('❌ Unauthorized - User:', user.id, 'Course ID:', application.jobs.course_id)
      return NextResponse.json({ error: 'Not authorized to update this application' }, { status: 403 })
    }
    console.log('✅ User authorized to update application')

    // Update application status
    console.log('🔄 Updating application status...')
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.log('❌ Application update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update application', 
        details: updateError.message 
      }, { status: 500 })
    }
    console.log('✅ Application updated successfully')

    if (status === 'accepted') {
      console.log('🔄 Processing acceptance actions...')
      
      // 1. Reject all other applications for this job
      console.log('🔄 Rejecting other applications...')
      const { error: rejectError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('job_id', application.job_id)
        .neq('id', params.id)

      if (rejectError) {
        console.log('⚠️ Error rejecting other applications:', rejectError)
        // Don't fail the main request for this
      } else {
        console.log('✅ Other applications rejected')
      }

      // 2. Update job status
      console.log('🔄 Updating job status...')
      const { error: jobUpdateError } = await supabase
        .from('jobs')
        .update({ 
          status: 'in_progress',
          submission_status: 'not_started',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.job_id)

      if (jobUpdateError) {
        console.log('⚠️ Error updating job status:', jobUpdateError)
        // Don't fail the main request for this
      } else {
        console.log('✅ Job status updated')
      }

      // 3. CREATE AUTOMATIC CONVERSATION
      console.log('🔄 Creating conversation...')
      const { data: conversation, error: conversationError } = await supabase
        .from('job_conversations')
        .upsert({
          job_id: application.job_id,
          course_id: application.jobs.course_id,
          professional_id: application.professional_id
        }, {
          onConflict: 'job_id'
        })
        .select()
        .single()

      if (conversationError) {
        console.log('⚠️ Error creating conversation:', conversationError)
        // Don't fail the main request for this
      } else {
        console.log('✅ Conversation created:', conversation.id)
        
        // Send welcome message
        console.log('🔄 Sending welcome message...')
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            content: `Congratulations! Your application has been accepted for "${application.jobs.title}". You can now start the job when ready. Please keep us updated on your progress.`,
            message_type: 'text'
          })

        if (messageError) {
          console.log('⚠️ Error sending welcome message:', messageError)
        } else {
          console.log('✅ Welcome message sent')
        }
      }

      // 4. CREATE NOTIFICATION FOR PROFESSIONAL
      console.log('🔄 Creating notification...')
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: application.professional_id,
          type: 'application_accepted',
          title: 'Application Accepted! 🎉',
          message: `Your application for "${application.jobs.title}" has been accepted! You can now start the job.`,
          metadata: {
            job_id: application.job_id,
            application_id: params.id
          }
        })

      if (notificationError) {
        console.log('⚠️ Error creating notification:', notificationError)
        // Don't fail the main request for this
      } else {
        console.log('✅ Notification created')
      }
    }

    console.log('🎉 Application acceptance completed successfully')
    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: `Application ${status} successfully`
    })

  } catch (error) {
    console.error('💥 Unexpected error in application acceptance:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

async function notifyProfessionalOfStatusUpdate(professionalId: string, jobId: string, status: string) {
  // TODO: Implement notification system
  console.log(`Application ${status} for professional ${professionalId} on job ${jobId}`)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    // Validate Supabase client
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client not properly initialized')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get application details
    const { data: applicationData } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!applications_job_id_fkey (
          course_id,
          title,
          status
        )
      `)
      .eq('id', params.id)
      .single()
      
    const application = applicationData as {
      id: string
      professional_id: string | null
      job_id: string | null
      message: string | null
      proposed_rate: number | null
      status: string | null
      applied_at: string | null
      jobs: {
        course_id: string | null
      } | null
    } | null
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    // Validate request body
    const body = await request.json()
    const validatedData = updateApplicationSchema.parse(body) as UpdateApplicationData
    
    // Only golf course can update application status
    if (validatedData.status && application.jobs?.course_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update application
    const { data, error } = await supabase
      .from('applications')
      .update(validatedData)
      .eq('id', params.id)
      .select(`
        *,
        jobs!applications_job_id_fkey (
          course_id,
          title,
          status
        )
      `)
      .single()
    
    if (error) throw error
    
    // If application is accepted by course, reject other applications but keep job open
    if (validatedData.status === 'accepted_by_course' && application.job_id) {
      // Reject other pending applications for this job
      await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('job_id', application.job_id)
        .neq('id', params.id)
        .eq('status', 'pending')
      
      // Note: Job status remains 'open' until professional accepts
    }
    
    // TODO: Send notification to professional
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Application update error:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    // Validate Supabase client
    if (!supabase || !supabase.auth) {
      console.error('❌ Supabase client not properly initialized')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify application ownership (only professional can delete their own application)
    const { data: applicationData } = await supabase
      .from('applications')
      .select('professional_id, status')
      .eq('id', params.id)
      .single()
      
    const application = applicationData as {
      professional_id: string | null
      status: string | null
    } | null
    
    if (!application || application.professional_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Only allow deletion of pending applications
    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Cannot delete non-pending applications' }, { status: 400 })
    }
    
    // Delete application
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({ message: 'Application deleted successfully' })
  } catch (error) {
    console.error('Application deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}
