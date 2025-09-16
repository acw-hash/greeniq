"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  Building, 
  User,
  AlertTriangle,
  FileText,
  Edit,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationForm } from '@/components/applications/ApplicationForm'
import { ApplicationList } from '@/components/applications/ApplicationList'
import { useJob, useJobApplication, useUpdateApplication } from '@/lib/hooks/useJobs'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatDistanceToNow } from 'date-fns'

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, profile } = useAuthStore()
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  
  const jobId = params.id as string
  const { data: job, isLoading, error } = useJob(jobId)
  const applyToJob = useJobApplication()
  const updateApplication = useUpdateApplication()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  const handleBack = () => {
    router.back()
  }

  const handleApplyToJob = async (applicationData: any) => {
    try {
      await applyToJob.mutateAsync(applicationData)
      setShowApplicationForm(false)
    } catch (error) {
      console.error('Failed to apply to job:', error)
    }
  }

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        status: 'accepted'
      })
    } catch (error) {
      console.error('Failed to accept application:', error)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        status: 'rejected'
      })
    } catch (error) {
      console.error('Failed to reject application:', error)
    }
  }

  const handleEditJob = () => {
    router.push(`/jobs/${jobId}/edit`)
  }

  const handleDeleteJob = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this job? This action cannot be undone.'
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      router.push('/jobs')
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Job not found</h3>
                <p className="text-muted-foreground">
                  The job you're looking for doesn't exist or has been removed.
                </p>
              </div>
              <Button onClick={handleBack}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isJobOwner = job.course_id === user.id
  const canApply = profile?.user_type === 'professional' && !isJobOwner && job.status === 'open'
  const canManage = isJobOwner

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'destructive'
      case 'high':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          {canManage && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleEditJob}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteJob}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={getUrgencyColor(job.urgency_level)} className="capitalize">
                    {job.urgency_level}
                  </Badge>
                  <Badge variant="secondary">
                    {formatJobType(job.job_type)}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {job.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                
                {job.golf_course_profile && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{job.golf_course_profile.course_name}</span>
                    <span>•</span>
                    <span className="capitalize">{job.golf_course_profile.course_type} Course</span>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  ${job.hourly_rate}/hr
                </div>
                {job.applications_count !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    {job.applications_count} {job.applications_count === 1 ? 'application' : 'applications'}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Start Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(job.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {job.end_date && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">End Date</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(job.end_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {job.golf_course_profile?.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">
                      {job.golf_course_profile.address}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Posted</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {(job.required_experience || job.required_certifications.length > 0) && (
              <div>
                <h3 className="font-semibold mb-3">Requirements</h3>
                <div className="space-y-3">
                  {job.required_experience && (
                    <div>
                      <div className="text-sm font-medium">Experience Level</div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {job.required_experience} Level
                      </Badge>
                    </div>
                  )}
                  
                  {job.required_certifications.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Required Certifications</div>
                      <div className="flex flex-wrap gap-2">
                        {job.required_certifications.map((cert: string) => (
                          <Badge key={cert} variant="outline">
                            {cert.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Course Information */}
            {job.golf_course_profile && (
              <div>
                <h3 className="font-semibold mb-3">About the Course</h3>
                <div className="space-y-3">
                  {job.golf_course_profile.description && (
                    <p className="text-sm text-muted-foreground">
                      {job.golf_course_profile.description}
                    </p>
                  )}
                  
                  {job.golf_course_profile.facilities && Object.keys(job.golf_course_profile.facilities as object).length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Course Facilities</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(job.golf_course_profile.facilities as Record<string, any>)
                          .filter(([_, value]) => value === true)
                          .map(([key]: [string, any]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Apply Button */}
            {canApply && !showApplicationForm && (
              <div className="pt-4 border-t">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto"
                  onClick={() => setShowApplicationForm(true)}
                >
                  Apply for This Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Form */}
        {showApplicationForm && canApply && (
          <ApplicationForm
            jobId={job.id}
            jobTitle={job.title}
            jobRate={job.hourly_rate}
            onSubmit={handleApplyToJob}
            onCancel={() => setShowApplicationForm(false)}
            isLoading={applyToJob.isPending}
          />
        )}

        {/* Applications (for job owners) */}
        {canManage && job.applications && job.applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Applications ({job.applications.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationList
                applications={job.applications}
                viewMode="golf_course"
                onAccept={handleAcceptApplication}
                onReject={handleRejectApplication}
                actionLoading={updateApplication.isPending}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
