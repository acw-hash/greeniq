'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUpdateApplication } from '@/lib/hooks/useJobs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Clock, DollarSign, MessageSquare, User, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface ApplicationCardProps {
  application: {
    id: string
    message: string
    proposed_rate: number
    status: 'pending' | 'accepted_by_course' | 'accepted_by_professional' | 'rejected'
    applied_at: string
    job_id: string
    jobs?: {
      id: string
      title: string
      description: string
      hourly_rate: number
      start_date: string
      end_date?: string
      status: string
      job_type: string
      profiles?: {
        full_name: string
        avatar_url?: string
        golf_course_profiles?: {
          course_name: string
          address: string
        }
      }
    }
    profiles?: {
      full_name: string
      avatar_url?: string
      professional_profiles?: {
        experience_level?: string
        rating?: number
        total_jobs?: number
        specializations?: string[]
      }
    }
  }
  viewMode?: 'professional' | 'golf_course'
  onStatusUpdate?: (id: string, status: 'accepted_by_course' | 'rejected') => void
  onAcceptJob?: (applicationId: string) => void
}

export function ApplicationCard({ application, viewMode = 'professional', onStatusUpdate, onAcceptJob }: ApplicationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { mutate: updateApplication, isPending } = useUpdateApplication()
  const router = useRouter()

  const handleStatusUpdate = async (status: 'accepted_by_course' | 'rejected') => {
    setIsUpdating(true)
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(application.id, status)
      } else {
        updateApplication({ id: application.id, status })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted_by_course':
        return 'secondary'
      case 'accepted_by_professional':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'accepted_by_course':
        return 'Accepted by Course'
      case 'accepted_by_professional':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      default:
        return 'Pending'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Professional view - shows job information
  if (viewMode === 'professional') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Link href={`/jobs/${application.job_id}`}>
                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                  {application.jobs?.title || 'Job Title Not Available'}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground mb-2">
                {application.jobs?.profiles?.golf_course_profiles?.course_name || 'Golf Course'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Your rate: ${application.proposed_rate}/hr</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(application.applied_at))} ago</span>
                </div>
              </div>
            </div>
            <Badge variant={getStatusVariant(application.status)}>
              {getStatusDisplay(application.status)}
            </Badge>
          </div>
          
          {application.message && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Your Message:</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {application.message}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Job posted rate: ${application.jobs?.hourly_rate}/hr
              {application.jobs?.start_date && (
                <span className="ml-4">
                  Starts: {new Date(application.jobs.start_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/applications/${application.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Link href={`/jobs/${application.job_id}`}>
                <Button variant="outline" size="sm">View Job</Button>
              </Link>
              {application.status === 'accepted_by_course' && (
                <Button 
                  size="sm"
                  onClick={() => onAcceptJob?.(application.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Accept Job
                </Button>
              )}
              {application.status === 'accepted_by_professional' && (
                <Button 
                  size="sm"
                  onClick={() => router.push(`/dashboard/jobs/${application.job_id}/manage`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Manage Job
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Golf course view - shows professional information
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">
                  {application.profiles?.full_name || 'Professional'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {application.profiles?.professional_profiles?.experience_level || 'Entry'} Level • 
                  {application.profiles?.professional_profiles?.rating ? 
                    ` ${application.profiles.professional_profiles.rating}⭐` : 
                    ' New Professional'
                  }
                </p>
              </div>
            </div>
            
            {application.profiles?.professional_profiles?.specializations && 
             application.profiles.professional_profiles.specializations.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Specializations:</p>
                <div className="flex flex-wrap gap-1">
                  {application.profiles.professional_profiles.specializations.map((spec: string) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Badge variant={getStatusVariant(application.status)}>
            {getStatusDisplay(application.status)}
          </Badge>
        </div>
        
        <div className="mb-4">
          <h5 className="text-sm font-medium mb-2">Application Message:</h5>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
            {application.message}
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                ${application.proposed_rate}/hour
                {application.proposed_rate !== application.jobs?.hourly_rate && (
                  <span className="text-muted-foreground ml-1">
                    (Job rate: ${application.jobs?.hourly_rate}/hr)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {application.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push(`/applications/${application.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            </div>
          )}
          
          {application.status === 'accepted_by_course' && (
            <div className="text-sm text-muted-foreground">
              Waiting for professional to accept the job
            </div>
          )}
          
          {application.status === 'accepted_by_professional' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push(`/dashboard/messages/${application.job_id}`)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Message Professional
              </Button>
              <Button 
                size="sm"
                onClick={() => router.push(`/dashboard/jobs/${application.job_id}`)}
              >
                View Job Progress
              </Button>
            </div>
          )}
          
          {application.status === 'rejected' && (
            <div className="text-sm text-muted-foreground">
              Application declined
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}