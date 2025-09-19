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

    // Get conversation details
    const { data: conversation, error } = await supabase
      .from('job_conversations')
      .select(`
        *,
        jobs (
          id,
          title,
          status,
          hourly_rate,
          start_date,
          profiles!jobs_course_id_fkey (
            full_name,
            golf_course_profiles (
              course_name
            )
          )
        ),
        profiles!job_conversations_course_id_fkey (
          id,
          full_name,
          avatar_url,
          golf_course_profiles (
            course_name
          )
        ),
        profiles!job_conversations_professional_id_fkey (
          id,
          full_name,
          avatar_url,
          professional_profiles (
            experience_level
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user is part of this conversation
    const isParticipant = 
      user.id === conversation.course_id || 
      user.id === conversation.professional_id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to view this conversation' },
        { status: 403 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
