import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateApplicationSchema, type UpdateApplicationData } from '@/lib/validations/jobs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner(course_id)
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      throw error
    }
    
    // Type assertion for the query result
    const application = data as {
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
    }
    
    // Verify user can access this application
    const canAccess = 
      application.professional_id === user.id || 
      application.jobs?.course_id === user.id
    
    if (!canAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Application fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  try {
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
        jobs!inner(course_id)
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
        jobs!inner(course_id)
      `)
      .single()
    
    if (error) throw error
    
    // If application is accepted, close the job
    if (validatedData.status === 'accepted' && application.job_id) {
      await supabase
        .from('jobs')
        .update({ status: 'in_progress' } as any)
        .eq('id', application.job_id)
      
      // Reject other pending applications for this job
      await supabase
        .from('applications')
        .update({ status: 'rejected' } as any)
        .eq('job_id', application.job_id)
        .neq('id', params.id)
        .eq('status', 'pending')
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
