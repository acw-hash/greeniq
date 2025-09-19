import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { JobManagement } from '@/components/jobs/JobManagement'

export default async function JobManagePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }

    // Verify this is the assigned professional who has accepted the job
    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        applications!inner (
          professional_id,
          status
        ),
        profiles!jobs_course_id_fkey (
          full_name,
          golf_course_profiles (
            course_name,
            course_type,
            address
          )
        )
      `)
      .eq('id', params.id)
      .eq('applications.professional_id', user.id)
      .eq('applications.status', 'accepted_by_professional')
      .single()

    if (error || !job) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={<div>Loading job management...</div>}>
          <JobManagement jobId={params.id} initialJob={job} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading job management:', error)
    notFound()
  }
}