"use client"

import { User, Calendar, DollarSign, MessageSquare, Check, X, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row'] & {
  professional_profile?: Database['public']['Tables']['professional_profiles']['Row'] & {
    profile?: Database['public']['Tables']['profiles']['Row']
  }
  job?: Database['public']['Tables']['jobs']['Row'] & {
    golf_course_profile?: Database['public']['Tables']['golf_course_profiles']['Row']
  }
}

interface ApplicationCardProps {
  application: Application
  viewMode?: 'professional' | 'golf_course'
  onAccept?: (applicationId: string) => void
  onReject?: (applicationId: string) => void
  onViewDetails?: (applicationId: string) => void
  onWithdraw?: (applicationId: string) => void
  isLoading?: boolean
  className?: string
}

export function ApplicationCard({
  application,
  viewMode = 'professional',
  onAccept,
  onReject,
  onViewDetails,
  onWithdraw,
  isLoading = false,
  className
}: ApplicationCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4" />
      case 'rejected':
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default' // Green
      case 'rejected':
        return 'destructive' // Red
      default:
        return 'secondary' // Yellow/Orange
    }
  }

  const formatRate = (rate: number | null, jobRate: number) => {
    if (!rate || rate === jobRate) {
      return `$${jobRate}/hr (offered rate)`
    }
    return `$${rate}/hr (proposed)`
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {viewMode === 'professional' && application.job && (
              <div>
                <h3 className="font-semibold text-lg">{application.job.title}</h3>
                {application.job.golf_course_profile && (
                  <p className="text-sm text-muted-foreground">
                    {application.job.golf_course_profile.course_name}
                  </p>
                )}
              </div>
            )}
            
            {viewMode === 'golf_course' && application.professional_profile?.profile && (
              <div>
                <h3 className="font-semibold text-lg">
                  {application.professional_profile.profile.full_name}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {application.professional_profile.experience_level} Level Professional
                </p>
              </div>
            )}
          </div>
          
          <Badge 
            variant={getStatusColor(application.status)}
            className="flex items-center space-x-1"
          >
            {getStatusIcon(application.status)}
            <span className="capitalize">{application.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Professional Details (for golf course view) */}
        {viewMode === 'golf_course' && application.professional_profile && (
          <div className="space-y-3">
            {application.professional_profile.specializations && application.professional_profile.specializations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1">
                  {application.professional_profile.specializations.slice(0, 3).map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                  {application.professional_profile.specializations.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{application.professional_profile.specializations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {application.professional_profile.rating > 0 && (
              <div className="flex items-center space-x-4 text-sm">
                <div>
                  <span className="font-medium">Rating:</span> {application.professional_profile.rating.toFixed(1)}/5
                </div>
                <div>
                  <span className="font-medium">Jobs completed:</span> {application.professional_profile.total_jobs}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Message */}
        {application.message && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">{application.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rate Information */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              {viewMode === 'professional' && application.job
                ? formatRate(application.proposed_rate, application.job.hourly_rate)
                : application.proposed_rate
                ? `$${application.proposed_rate}/hr (proposed)`
                : 'Rate negotiable'
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(application.id)}
          >
            View Details
          </Button>

          <div className="flex space-x-2">
            {/* Golf Course Actions */}
            {viewMode === 'golf_course' && application.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject?.(application.id)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAccept?.(application.id)}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </>
            )}

            {/* Professional Actions */}
            {viewMode === 'professional' && application.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWithdraw?.(application.id)}
                disabled={isLoading}
              >
                Withdraw
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
