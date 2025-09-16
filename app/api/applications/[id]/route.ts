import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateApplicationSchema } from '@/lib/validations/jobs'

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
        jobs!inner(
          *,
          profiles!course_id(
            *,
            golf_course_profiles(course_name, address)
          )
        ),
        profiles!professional_id(
          full_name,
          email,
          phone,
          professional_profiles(*)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      throw error
    }
    
    // Verify user can access this application
    const canAccess = 
      data.professional_id === user.id || 
      data.jobs?.course_id === user.id
    
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
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner(course_id)
      `)
      .eq('id', params.id)
      .single()
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    // Validate request body
    const body = await request.json()
    const validatedData = updateApplicationSchema.parse(body)
    
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
        jobs!inner(
          title,
          profiles!course_id(
            golf_course_profiles(course_name)
          )
        ),
        profiles!professional_id(
          full_name,
          professional_profiles(*)
        )
      `)
      .single()
    
    if (error) throw error
    
    // If application is accepted, close the job
    if (validatedData.status === 'accepted') {
      await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', application.job_id)
      
      // Reject other pending applications for this job
      await supabase
        .from('applications')
        .update({ status: 'rejected' })
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
    const { data: application } = await supabase
      .from('applications')
      .select('professional_id, status')
      .eq('id', params.id)
      .single()
    
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
