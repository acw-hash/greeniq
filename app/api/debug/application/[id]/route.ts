import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    console.log('🔍 Debug application:', params.id)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('User:', user?.id, 'Auth error:', authError)
    
    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner (
          course_id,
          title,
          id,
          status
        )
      `)
      .eq('id', params.id)
      .single()
    
    console.log('Application:', application)
    console.log('Application error:', appError)
    
    // Check if job_conversations table exists
    const { data: conversationsTable } = await supabase
      .from('job_conversations')
      .select('*')
      .limit(1)
    
    console.log('Job conversations table accessible:', !!conversationsTable)
    
    // Check if messages table exists
    const { data: messagesTable } = await supabase
      .from('messages')
      .select('*')
      .limit(1)
    
    console.log('Messages table accessible:', !!messagesTable)
    
    // Check if notifications table exists
    const { data: notificationsTable } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)
    
    console.log('Notifications table accessible:', !!notificationsTable)
    
    return NextResponse.json({
      user: user?.id,
      application,
      appError,
      authError,
      tables: {
        job_conversations: !!conversationsTable,
        messages: !!messagesTable,
        notifications: !!notificationsTable
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
