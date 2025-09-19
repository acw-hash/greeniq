import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get job updates with user details
    const { data: updates, error } = await supabase
      .from('job_updates')
      .select(`
        *,
        profiles!job_updates_professional_id_fkey (
          full_name
        )
      `)
      .eq('job_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(updates || [])
  } catch (error) {
    console.error('Error fetching job updates:', error)
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 })
  }
}

export async function POST(
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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify user has permission to update this job
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
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if user is the assigned professional
    const isAssignedProfessional = job.applications.some(
      app => app.professional_id === user.id && app.status === 'accepted'
    )

    if (!isAssignedProfessional) {
      return NextResponse.json({ error: 'Not authorized to update this job' }, { status: 403 })
    }

    // Create job update
    const { data: update, error: updateError } = await supabase
      .from('job_updates')
      .insert({
        job_id: params.id,
        professional_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        profiles!job_updates_professional_id_fkey (
          full_name
        )
      `)
      .single()

    if (updateError) throw updateError

    return NextResponse.json(update)
  } catch (error) {
    console.error('Error creating job update:', error)
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}