'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ActiveJobCard } from './ActiveJobCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JobWithDetails } from '@/types/jobs'

interface ActiveJobsListProps {
  initialJobs: JobWithDetails[]
}

export function ActiveJobsList({ initialJobs }: ActiveJobsListProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const supabase = createClient()

  const activeJobs = jobs.filter(job => 
    ['confirmed', 'in_progress', 'awaiting_review'].includes(job.status)
  )
  
  const completedJobs = jobs.filter(job => job.status === 'completed')

  useEffect(() => {
    // Real-time subscription for job updates
    const channel = supabase
      .channel('active-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        async () => {
          // Refetch active jobs
          const response = await fetch('/api/jobs/active')
          if (response.ok) {
            const updatedJobs = await response.json()
            setJobs(updatedJobs)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Tabs defaultValue="active" className="space-y-6">
      <TabsList>
        <TabsTrigger value="active">
          Active Jobs ({activeJobs.length})
        </TabsTrigger>
        <TabsTrigger value="history">
          Job History ({completedJobs.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        {activeJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active jobs</p>
          </div>
        ) : (
          activeJobs.map((job) => (
            <ActiveJobCard key={job.id} job={job} />
          ))
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {completedJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No completed jobs</p>
          </div>
        ) : (
          completedJobs.map((job) => (
            <ActiveJobCard key={job.id} job={job} isHistory />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}
