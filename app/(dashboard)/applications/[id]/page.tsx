import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'

export default async function ApplicationPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      notFound()
    }

    // Get application details directly from Supabase instead of making an HTTP request
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          *,
          profiles!jobs_course_id_fkey (
            id,
            full_name,
            golf_course_profiles (
              course_name,
              course_type,
              address
            )
          )
        ),
        profiles!applications_professional_id_fkey (
          id,
          full_name,
          email,
          phone,
          professional_profiles (
            bio,
            experience_level,
            specializations,
            equipment_skills,
            hourly_rate,
            rating,
            total_jobs
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !application) {
      notFound()
    }

    // Check if user has permission to view this application
    const canView = 
      application.professional_id === user.id || // Professional who applied
      application.jobs.course_id === user.id      // Golf course who posted job

    if (!canView) {
      notFound()
    }


    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={<div>Loading application...</div>}>
          <ApplicationDetail applicationId={params.id} initialData={application} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading application:', error)
    notFound()
  }
}
