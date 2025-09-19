import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all conversations for this user
    const { data: conversations, error } = await supabase
      .from('job_conversations')
      .select(`
        *,
        jobs (
          title,
          status,
          submission_status
        ),
        course:profiles!job_conversations_course_id_fkey (
          full_name,
          golf_course_profiles (
            course_name
          )
        ),
        professional:profiles!job_conversations_professional_id_fkey (
          full_name,
          professional_profiles (
            experience_level
          )
        ),
        latest_message:messages (
          content,
          created_at,
          sender_id
        )
      `)
      .or(`course_id.eq.${user.id},professional_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process conversations to get latest message
    const processedConversations = (conversations || []).map(conv => ({
      ...conv,
      latest_message: conv.latest_message?.[0] || null
    }))

    return NextResponse.json(processedConversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Message sending functionality - Coming Soon',
    status: 'development',
  }, { status: 501 })
}
