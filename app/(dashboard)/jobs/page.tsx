"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MapPin, List, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { JobCard } from '@/components/jobs/JobCard'
import { useJobs, useJobApplication } from '@/lib/hooks/useJobs'
import { useAuthStore } from '@/lib/stores/authStore'
import { useJobStore } from '@/lib/stores/jobStore'
import { useDebounce } from 'use-debounce'
import type { Job } from '@/types/jobs'

export default function JobsPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { filters, searchTerm, viewMode, setSearchTerm, setViewMode } = useJobStore()
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [debouncedSearchTerm] = useDebounce(localSearchTerm, 300)
  
  const { data: jobs, isLoading, error } = useJobs({ 
    ...filters, 
    search: debouncedSearchTerm 
  })
  const applyToJob = useJobApplication()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm)
  }, [debouncedSearchTerm, setSearchTerm])

  if (!user) return null

  const handleCreateJob = () => {
    if (profile?.user_type === 'golf_course') {
      router.push('/jobs/create')
    }
  }

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  const handleApplyToJob = async (jobId: string) => {
    if (profile?.user_type === 'professional') {
      try {
        await applyToJob.mutateAsync({
          job_id: jobId,
          message: 'I am interested in this position and believe my skills are a great fit.',
        })
      } catch (error) {
        console.error('Failed to apply to job:', error)
      }
    }
  }

  const canCreateJobs = profile?.user_type === 'golf_course'
  const canApplyToJobs = profile?.user_type === 'professional'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {canCreateJobs ? 'Manage Jobs' : 'Find Jobs'}
            </h1>
            <p className="text-muted-foreground">
              {canCreateJobs 
                ? 'Post and manage your golf course maintenance jobs'
                : 'Discover golf course maintenance opportunities near you'
              }
            </p>
          </div>
          {canCreateJobs && (
            <Button onClick={handleCreateJob} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Post Job</span>
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, type, or location..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  disabled
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters Button */}
              <Button variant="outline" size="sm" disabled>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <Badge key={key} variant="secondary" className="px-3 py-1">
                  {key.replace('_', ' ')}: {value}
                </Badge>
              )
            )}
          </div>
        )}

        {/* Jobs List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Failed to load jobs</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error loading the job listings.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job: Job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={canApplyToJobs ? handleApplyToJob : undefined}
                onViewDetails={handleViewJob}
                showApplicationButton={canApplyToJobs}
                isApplied={false} // TODO: Check if user has already applied
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    {localSearchTerm 
                      ? `No jobs match your search for "${localSearchTerm}". Try adjusting your search terms or filters.`
                      : canCreateJobs 
                        ? 'You haven\'t posted any jobs yet. Create your first job posting to get started.'
                        : 'No jobs are currently available. Check back later for new opportunities.'
                    }
                  </p>
                  {localSearchTerm && (
                    <p className="text-sm text-muted-foreground">
                      Try searching for different keywords or clearing your filters.
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {canCreateJobs ? (
                    <Button onClick={handleCreateJob}>
                      <Plus className="h-4 w-4 mr-2" />
                      Post Your First Job
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocalSearchTerm('')}
                      disabled={!localSearchTerm}
                    >
                      Clear Search
                    </Button>
                  )}
                  {localSearchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocalSearchTerm('')}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats for Golf Courses */}
        {canCreateJobs && jobs && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.filter((job: Job) => job.status === 'open').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.reduce((sum: number, job: Job) => sum + (job.applications?.length || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
