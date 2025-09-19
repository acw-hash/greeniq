'use client'

import { useState } from 'react'
import { useJob, useApplications, useUpdateApplication } from '@/lib/hooks/useJobs'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, DollarSign, Clock, User, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ApplicationCard } from '@/components/applications/ApplicationCard'

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth()
  const { data: job, isLoading } = useJob(params.id)
  const { data: applications } = useApplications(params.id)
  const updateApplication = useUpdateApplication()
  const searchParams = useSearchParams()
  const justApplied = searchParams.get('applied') === 'true'

  if (isLoading) return <div>Loading...</div>
  if (!job) return <div>Job not found</div>

  const userApplication = applications?.find(app => app.professional_id === user?.id)
  const canApply = profile?.user_type === 'professional' && !userApplication && job.status === 'open'
  const isOwner = profile?.user_type === 'golf_course' && job.course_id === user?.id

  const handleStatusUpdate = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateApplication.mutateAsync({ id: applicationId, status })
      // Success message will be handled by the mutation
    } catch (error: any) {
      console.error('Failed to update application:', error)
      // TODO: Show error toast
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {justApplied && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Application submitted successfully! You'll be notified when the golf course reviews your application.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Job Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                  <p className="text-lg text-muted-foreground">
                    {job.profiles?.golf_course_profiles?.course_name}
                  </p>
                </div>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                {job.required_certifications?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Required Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.required_certifications.map((cert: string) => (
                        <Badge key={cert} variant="outline">
                          {cert.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.required_experience && (
                  <div>
                    <h3 className="font-semibold mb-2">Experience Level</h3>
                    <Badge variant="secondary">{job.required_experience}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Applications Section (Golf Course Only) */}
          {isOwner && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Applications ({applications?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <ApplicationCard 
                        key={application.id} 
                        application={application}
                        viewMode="golf_course"
                        onStatusUpdate={handleStatusUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No applications yet.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold">${job.hourly_rate}/hour</p>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold">
                    {new Date(job.start_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold">2.5 miles away</p>
                  <p className="text-sm text-muted-foreground">Distance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Status Card */}
          {userApplication && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Application</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={
                    userApplication.status === 'accepted' ? 'default' :
                    userApplication.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {userApplication.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Applied {new Date(userApplication.applied_at).toLocaleDateString()}
                  </p>
                  {userApplication.proposed_rate !== job.hourly_rate && (
                    <p className="text-sm">
                      Your rate: ${userApplication.proposed_rate}/hour
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {canApply && (
              <Link href={`/jobs/${job.id}/apply`} className="block">
                <Button className="w-full" size="lg">
                  Apply for this Job
                </Button>
              </Link>
            )}
            
            {isOwner && job.status === 'open' && (
              <Link href={`/jobs/${job.id}/edit`}>
                <Button variant="outline" className="w-full">
                  Edit Job
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
