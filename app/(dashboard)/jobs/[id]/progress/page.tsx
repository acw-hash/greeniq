import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { JobProgress } from '@/components/jobs/JobProgress'

export default async function JobProgressPage({ 
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

    // Get job details with permissions check
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
            course_type
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !job) {
      notFound()
    }

    // Check if user has permission (golf course owner or assigned professional)
    const hasPermission = 
      job.course_id === user.id || // Golf course owner
      job.applications.some(app => app.professional_id === user.id && app.status === 'accepted') // Assigned professional

    if (!hasPermission) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={<div>Loading job progress...</div>}>
          <JobProgress jobId={params.id} initialJob={job} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading job progress:', error)
    notFound()
  }
}
