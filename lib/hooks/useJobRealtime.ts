'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { jobKeys } from './useJobs'
import { useJobStore } from '@/lib/stores/jobStore'
import { Job } from '@/lib/stores/jobStore'
import { toast } from '@/lib/utils/toast'

interface UseJobRealtimeProps {
  jobId?: string
  enabled?: boolean
}

export const useJobRealtime = ({ jobId, enabled = true }: UseJobRealtimeProps = {}) => {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const subscriptionRef = useRef<any>(null)
  const { updateJob: updateJobStore, addJob, removeJob } = useJobStore()

  useEffect(() => {
    if (!enabled) return

    // Subscribe to job changes
    const channel = supabase
      .channel('job-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: jobId ? `id=eq.${jobId}` : undefined
        },
        (payload) => {
          console.log('Job realtime update:', payload)
          
          const job = payload.new as Job
          const oldJob = payload.old as Job

          switch (payload.eventType) {
            case 'INSERT':
              // New job created
              addJob(job)
              queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
              queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() })
              
              // Show notification for new jobs (only for professionals)
              toast.success('New job posted!')
              break

            case 'UPDATE':
              // Job updated
              updateJobStore(job.id, job)
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
              queryClient.invalidateQueries({ queryKey: jobKeys.detail(job.id) })
              queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() })
              
              // Show notification for status changes
              if (oldJob.status !== job.status) {
                toast.info('Job status updated')
              }
              break

            case 'DELETE':
              // Job deleted
              removeJob(job.id)
              queryClient.removeQueries({ queryKey: jobKeys.detail(job.id) })
              queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
              queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() })
              
              toast.info('Job removed')
              break
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: jobId ? `job_id=eq.${jobId}` : undefined
        },
        (payload) => {
          console.log('Application realtime update:', payload)
          
          // Invalidate job details to refresh applications
          if (jobId) {
            queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
          }
          
          // Show notification for new applications (only for job owners)
          if (payload.eventType === 'INSERT') {
            toast.success('New application received!')
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [enabled, jobId, queryClient, supabase, updateJobStore, addJob, removeJob])

  return {
    isConnected: subscriptionRef.current?.state === 'joined'
  }
}

// Hook for job list real-time updates
export const useJobListRealtime = (enabled = true) => {
  return useJobRealtime({ enabled })
}

// Hook for specific job real-time updates
export const useJobDetailRealtime = (jobId: string, enabled = true) => {
  return useJobRealtime({ jobId, enabled })
}

// Hook for job notifications
export const useJobNotifications = () => {
  const supabase = createClient()
  const { addJob } = useJobStore()

  useEffect(() => {
    // Subscribe to notifications for new jobs
    const channel = supabase
      .channel('job-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        (payload) => {
          const notification = payload.new
          
          if (notification.type === 'new_job') {
            toast.info(notification.title)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, addJob])
}

// Hook for job search real-time updates
export const useJobSearchRealtime = (filters: any) => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('job-search-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.open'
        },
        (payload) => {
          // Invalidate search results when jobs change
          queryClient.invalidateQueries({ queryKey: jobKeys.search(filters) })
          queryClient.invalidateQueries({ queryKey: jobKeys.lists() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters, queryClient, supabase])
}
