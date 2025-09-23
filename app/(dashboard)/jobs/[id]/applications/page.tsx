'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { JobApplicationsList } from '@/components/applications/JobApplicationsList'
import { useAuthStore } from '@/lib/stores/authStore'

export default function JobApplicationsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  const { user, profile } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['job', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }
      return response.json()
    },
    enabled: !!user
  })

  const job = jobData?.job

  const { data: applications } = useQuery({
    queryKey: ['applications', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${params.id}/applications`)
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      return response.json()
    },
    enabled: !!user
  })

  if (!user) return null

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-8">Loading applications...</div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-8 text-red-600">
          Error loading job: {error?.message || 'Job not found'}
        </div>
      </div>
    )
  }

  // Check if user is the golf course owner
  if (job.course_id !== user.id) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-8 text-red-600">
          You don't have permission to view these applications
        </div>
      </div>
    )
  }

  // Combine job data with applications
  const jobWithApplications = {
    ...job,
    applications: applications || []
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <JobApplicationsList jobId={params.id} initialJob={jobWithApplications} />
    </div>
  )
}
