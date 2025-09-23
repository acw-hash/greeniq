'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/lib/utils/toast'

interface JobApplicationsListProps {
  jobId: string
  initialJob: any
}

export function JobApplicationsList({ jobId, initialJob }: JobApplicationsListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null)

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string, status: 'accepted_by_course' | 'rejected' }) => {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update application')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      
      if (variables.status === 'accepted_by_course') {
        toast({
          title: "Application Accepted",
          description: "The application has been accepted. The professional will be notified to confirm.",
        })
      } else {
        toast({
          title: "Application Rejected",
          description: "The application has been rejected.",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive"
      })
    }
  })

  const handleStatusUpdate = async (applicationId: string, status: 'accepted_by_course' | 'rejected') => {
    const action = status === 'accepted_by_course' ? 'accept' : 'reject'
    if (window.confirm(`Are you sure you want to ${action} this application?`)) {
      await updateApplicationMutation.mutateAsync({ applicationId, status })
    }
  }

  const handleViewApplication = (applicationId: string) => {
    router.push(`/applications/${applicationId}`)
  }

  const pendingApplications = initialJob.applications?.filter((app: any) => app.status === 'pending') || []
  const acceptedApplications = initialJob.applications?.filter((app: any) => 
    app.status === 'accepted_by_course' || app.status === 'accepted_by_professional'
  ) || []
  const rejectedApplications = initialJob.applications?.filter((app: any) => app.status === 'rejected') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Job Applications</h1>
            <p className="text-muted-foreground">
              Review applications for: {initialJob.title}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          <Users className="h-4 w-4 mr-1" />
          {initialJob.applications?.length || 0} applications
        </Badge>
      </div>

      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">${initialJob.hourly_rate}/hour</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(initialJob.start_date), 'PPP')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {initialJob.profiles?.golf_course_profiles?.course_name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">{pendingApplications.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Accepted</span>
            </div>
            <p className="text-2xl font-bold">{acceptedApplications.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold">{rejectedApplications.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Applications ({pendingApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingApplications.map((application: any) => (
              <div key={application.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {application.profiles?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {application.profiles?.full_name}
                        </h3>
                        <Badge variant="outline">
                          {application.profiles?.professional_profiles?.experience_level}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {application.profiles?.professional_profiles?.rating || 'No rating'} 
                            ({application.profiles?.professional_profiles?.total_jobs || 0} jobs)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            ${application.proposed_rate || application.profiles?.professional_profiles?.hourly_rate}/hour
                            {application.proposed_rate !== initialJob.hourly_rate && (
                              <span className="text-muted-foreground ml-1">
                                (Job: ${initialJob.hourly_rate}/hr)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {application.message && (
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            "{application.message}"
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Applied {format(new Date(application.applied_at), 'PPP')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewApplication(application.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(application.id, 'accepted_by_course')}
                        disabled={updateApplicationMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                        disabled={updateApplicationMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Accepted Applications */}
      {acceptedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Accepted Applications ({acceptedApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {acceptedApplications.map((application: any) => (
              <div key={application.id} className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {application.profiles?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {application.profiles?.full_name}
                        </h3>
                        <Badge className={
                          application.status === 'accepted_by_course' ? 'bg-yellow-600' : 'bg-green-600'
                        }>
                          {application.status === 'accepted_by_course' ? 'Accepted by Course' : 'Accepted by Professional'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            ${application.proposed_rate || application.profiles?.professional_profiles?.hourly_rate}/hour
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {application.status === 'accepted_by_course' 
                              ? 'Waiting for professional to accept' 
                              : `Accepted ${format(new Date(application.applied_at), 'PPP')}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {application.status === 'accepted_by_professional' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/messages/${jobId}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/jobs/${jobId}/progress`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Progress
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Waiting for professional to accept
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rejected Applications */}
      {rejectedApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejected Applications ({rejectedApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejectedApplications.map((application: any) => (
              <div key={application.id} className="border rounded-lg p-4 bg-red-50">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {application.profiles?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {application.profiles?.full_name}
                      </h3>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Rejected {format(new Date(application.applied_at), 'PPP')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Applications */}
      {initialJob.applications?.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No applications yet</h3>
                <p className="text-muted-foreground">
                  No one has applied to this job yet. Make sure your job posting is visible and attractive to professionals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
