import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { JobConversation } from '@/components/messages/JobConversation'

export default async function JobMessagesPage({ 
  params 
}: { 
  params: { jobId: string } 
}) {
  const supabase = createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }

    // Get job conversation details
    const { data: conversation, error } = await supabase
      .from('job_conversations')
      .select(`
        *,
        jobs (
          id,
          title,
          status,
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
          golf_course_profiles (
            course_name
          )
        ),
        profiles!job_conversations_professional_id_fkey (
          id,
          full_name,
          professional_profiles (
            experience_level
          )
        )
      `)
      .eq('job_id', params.jobId)
      .single()

    if (error || !conversation) {
      notFound()
    }

    // Verify user is part of this conversation
    const isParticipant = 
      user.id === conversation.course_id || 
      user.id === conversation.professional_id

    if (!isParticipant) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={<div>Loading conversation...</div>}>
          <JobConversation 
            jobId={params.jobId} 
            conversationId={conversation.id}
            initialConversation={conversation}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading job conversation:', error)
    notFound()
  }
}
