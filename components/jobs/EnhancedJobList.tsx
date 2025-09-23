'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EnhancedJobCard } from './JobCard'
import { JobStatusFilter } from './JobStatusFilter'
import { JobWithApplicationStatus } from '@/types/jobs'
import { useCreateApplication } from '@/lib/hooks/useJobs'
import { toast } from '@/lib/utils/toast'

type FilterStatus = 'all' | 'not_applied' | 'applied'

interface EnhancedJobListProps {
  initialJobs: JobWithApplicationStatus[]
  onJobView?: (job: JobWithApplicationStatus) => void
  onJobSave?: (job: JobWithApplicationStatus) => void
  onJobShare?: (job: JobWithApplicationStatus) => void
  onJobManage?: (job: JobWithApplicationStatus) => void
  onJobAccept?: (job: JobWithApplicationStatus) => void
  userType?: 'professional' | 'golf_course'
  className?: string
}

export function EnhancedJobList({ 
  initialJobs, 
  onJobView,
  onJobSave,
  onJobShare,
  onJobManage,
  onJobAccept,
  userType,
  className 
}: EnhancedJobListProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const supabase = createClient()
  const createApplication = useCreateApplication()
  
  // Filter jobs based on application status
  const filteredJobs = useMemo(() => {
    switch (statusFilter) {
      case 'applied':
        return jobs.filter(job => job.hasApplied)
      case 'not_applied':
        return jobs.filter(job => !job.hasApplied)
      default:
        return jobs
    }
  }, [jobs, statusFilter])

  // Calculate counts for filter badges
  const appliedCount = useMemo(() => 
    jobs.filter(job => job.hasApplied).length, [jobs]
  )
  const notAppliedCount = useMemo(() => 
    jobs.filter(job => !job.hasApplied).length, [jobs]
  )

  const handleApply = async (jobId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to apply for jobs')
        return
      }

      // Get the job to extract professional_id
      const job = jobs.find(j => j.id === jobId)
      if (!job) {
        toast.error('Job not found')
        return
      }

      // Create application
      await createApplication.mutateAsync({
        job_id: jobId,
        professional_id: user.id,
        message: 'I am interested in this position and would like to apply.',
        proposed_rate: job.hourly_rate
      })

      // Update local state optimistically
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === jobId 
            ? { 
                ...j, 
                hasApplied: true, 
                userApplication: {
                  id: 'temp-id',
                  job_id: jobId,
                  professional_id: user.id,
                  status: 'pending',
                  message: 'I am interested in this position and would like to apply.',
                  proposed_rate: job.hourly_rate,
                  applied_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }
            : j
        )
      )

      toast.success('Application submitted successfully!')
    } catch (error) {
      console.error('Error applying to job:', error)
      toast.error('Failed to submit application. Please try again.')
    }
  }

  useEffect(() => {
    // Real-time subscription for job updates
    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.open'
        },
        async (payload) => {
          // Refetch jobs to get updated application status
          // This ensures real-time updates include application data
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // For now, we'll just log the update
            // In a full implementation, you'd refetch the jobs with application status
            console.log('Job updated:', payload)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <JobStatusFilter
        onFilterChange={setStatusFilter}
        currentFilter={statusFilter}
        appliedCount={appliedCount}
        notAppliedCount={notAppliedCount}
      />
      
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {statusFilter === 'applied' && 'You haven\'t applied to any jobs yet.'}
            {statusFilter === 'not_applied' && 'No available jobs to apply for.'}
            {statusFilter === 'all' && 'No jobs available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <EnhancedJobCard 
              key={job.id} 
              job={job}
              onApply={handleApply}
              onView={onJobView}
              onSave={onJobSave}
              onShare={onJobShare}
              onManage={onJobManage}
              onAcceptJob={onJobAccept}
              userType={userType}
            />
          ))}
        </div>
      )}
    </div>
  )
}
