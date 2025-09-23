'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { MapPin, Clock, DollarSign, Star, Briefcase } from 'lucide-react'
import { format } from 'date-fns'

interface ApplicationDetailProps {
  applicationId: string
  initialData?: any
}

export function ApplicationDetail({ applicationId, initialData }: ApplicationDetailProps) {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch application')
      }
      return response.json()
    },
    initialData
  })

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ status }: { status: 'accepted_by_course' | 'rejected' }) => {
      console.log('🔍 Frontend: Updating application status:', status)
      
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || 'Failed to update application')
      }
      
      const data = await response.json()
      console.log('✅ Success:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      router.push('/applications?success=' + data.application.status)
    },
    onError: (error) => {
      console.error('Update error:', error)
    }
  })

  const handleStatusUpdate = async (status: 'accepted_by_course' | 'rejected') => {
    const action = status === 'accepted_by_course' ? 'accept' : 'reject'
    if (window.confirm(`Are you sure you want to ${action} this application?`)) {
      setIsUpdating(true)
      try {
        await updateApplicationMutation.mutateAsync({ status })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading application details...</div>
  }

  if (!application) {
    return <div className="text-center p-8">Application not found</div>
  }

  const isGolfCourse = profile?.user_type === 'golf_course'
  const isProfessional = profile?.user_type === 'professional'
  const canUpdateStatus = isGolfCourse && application.status === 'pending'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Details</h1>
          <p className="text-muted-foreground">
            Application for: {application.jobs?.title}
          </p>
        </div>
        <Badge 
          variant={
            application.status === 'accepted_by_course' || application.status === 'accepted_by_professional' ? 'default' : 
            application.status === 'rejected' ? 'destructive' : 
            'secondary'
          }
        >
          {application.status === 'accepted_by_course' ? 'Accepted by Course' :
           application.status === 'accepted_by_professional' ? 'Accepted by Professional' :
           application.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{application.jobs?.title}</h3>
              <p className="text-sm text-muted-foreground">
                {application.jobs?.job_type}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {application.jobs?.profiles?.golf_course_profiles?.course_name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">${application.jobs?.hourly_rate}/hour</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(application.jobs?.start_date), 'PPP')}
                </span>
              </div>
            </div>

            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Job Description</h4>
              <p className="text-sm text-muted-foreground">
                {application.jobs?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {application.profiles?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              Professional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">
                {application.profiles?.full_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {application.profiles?.professional_profiles?.experience_level} Level
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {application.profiles?.professional_profiles?.rating || 'No rating'} 
                  ({application.profiles?.professional_profiles?.total_jobs || 0} jobs completed)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  ${application.proposed_rate || application.profiles?.professional_profiles?.hourly_rate}/hour
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Bio</h4>
              <p className="text-sm text-muted-foreground">
                {application.profiles?.professional_profiles?.bio || 'No bio provided'}
              </p>
            </div>

            {application.profiles?.professional_profiles?.specializations?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1">
                  {application.profiles.professional_profiles.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Message */}
      {application.message && (
        <Card>
          <CardHeader>
            <CardTitle>Application Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{application.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canUpdateStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Review Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => handleStatusUpdate('accepted_by_course')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? 'Accepting...' : 'Accept Application'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
              >
                {isUpdating ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => router.back()}>
          Back to Applications
        </Button>
      </div>
    </div>
  )
}
