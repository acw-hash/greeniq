'use client'

import { useState } from 'react'
import { useJobs } from '@/lib/hooks/useJobs'
import { useAuthStore } from '@/lib/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, MapPin, Clock, DollarSign, Users, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function MyJobsPage() {
  const { user, profile } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all')
  
  // Get golf course's jobs
  const { data: jobsData, isLoading } = useJobs({
    course_id: user?.id,
    status: statusFilter === 'all' ? undefined : statusFilter,
    radius: 25,
    page: 1,
    limit: 20
  })

  const jobs = jobsData?.jobs || []

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  const jobStats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground">Manage your posted maintenance jobs</p>
        </div>
        <Link href="/jobs/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{jobStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Open Jobs</p>
                <p className="text-2xl font-bold">{jobStats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{jobStats.in_progress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{jobStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Tabs */}
      <Tabs value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
        <TabsList>
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {jobs && jobs.length > 0 ? (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all' 
                    ? "You haven't posted any jobs yet." 
                    : `No ${statusFilter.replace('_', ' ')} jobs found.`}
                </p>
                <Link href="/jobs/create">
                  <Button>Post Your First Job</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JobCard({ job }: { job: any }) {
  const isGolfCourse = true // This is in MyJobsPage which is for golf courses
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link href={`/jobs/${job.id}`}>
              <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                {job.title}
              </h3>
            </Link>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>${job.hourly_rate}/hr</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(job.created_at))} ago</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{job.applications?.length || 0} applications</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              job.status === 'open' ? 'default' :
              job.status === 'in_progress' ? 'secondary' :
              job.status === 'completed' ? 'outline' : 'destructive'
            }>
              {job.status.replace('_', ' ')}
            </Badge>
            {job.urgency_level === 'high' && (
              <Badge variant="destructive">Urgent</Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {job.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Link href={`/jobs/${job.id}`}>
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
            {job.status === 'open' && (
              <Link href={`/jobs/${job.id}/edit`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
            )}
          </div>
          
          {/* Golf Course Actions - CORRECTED LOGIC */}
          {isGolfCourse && (
            <>
              {/* For jobs that are still open and have applications */}
              {job.status === 'open' && (job.applications?.length > 0) && (
                <Link href={`/jobs/${job.id}/applications`}>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Review Applications ({job.applications.length})
                  </Button>
                </Link>
              )}
              
              {/* For jobs that are in progress */}
              {job.status === 'in_progress' && (
                <Link href={`/jobs/${job.id}/progress`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                </Link>
              )}
              
              {/* For jobs submitted for review */}
              {job.submission_status === 'submitted' && (
                <Link href={`/jobs/${job.id}/review`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Review Work
                  </Button>
                </Link>
              )}
              
              {/* For completed jobs */}
              {job.submission_status === 'approved' && (
                <Link href={`/jobs/${job.id}/review`}>
                  <Button variant="outline" size="sm">
                    View & Rate
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
