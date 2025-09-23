import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('job_updates')
      .select(`
        *,
        professional_profiles!inner(full_name)
      `)
      .eq('job_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch job updates' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { update_type, milestone, content, photo_urls } = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the professional for this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        applications!inner(professional_id)
      `)
      .eq('id', params.id)
      .eq('applications.professional_id', user.id)
      .eq('applications.status', 'confirmed')
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 })
    }

    // Create job update
    const { data: update, error: updateError } = await supabase
      .from('job_updates')
      .insert({
        job_id: params.id,
        professional_id: user.id,
        update_type,
        milestone,
        content,
        photo_urls
      })
      .select()
      .single()

    if (updateError) throw updateError

    // Update job status if milestone update
    if (update_type === 'milestone' && milestone) {
      const { error: statusError } = await supabase
        .from('jobs')
        .update({ status: milestone === 'completed' ? 'completed' : 'in_progress' })
        .eq('id', params.id)

      if (statusError) throw statusError
    }

    // Create notification for golf course
    await supabase
      .from('notifications')
      .insert({
        user_id: job.course_id,
        type: 'job_update',
        title: 'Job Update',
        message: milestone ? `Job milestone: ${milestone}` : 'New job update available',
        metadata: { job_id: params.id, update_id: update.id }
      })

    return NextResponse.json(update)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create job update' },
      { status: 500 }
    )
  }
}