"use client"

import { MapPin, Calendar, DollarSign, Clock, Building, User, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Database } from '@/types'

type Job = Database['public']['Tables']['jobs']['Row'] & {
  course_profile?: Database['public']['Tables']['profiles']['Row']
  golf_course_profile?: Database['public']['Tables']['golf_course_profiles']['Row']
  applications_count?: number
}

interface JobCardProps {
  job: Job
  onApply?: (jobId: string) => void
  onViewDetails?: (jobId: string) => void
  showApplicationButton?: boolean
  isApplied?: boolean
  className?: string
}

export function JobCard({
  job,
  onApply,
  onViewDetails,
  showApplicationButton = true,
  isApplied = false,
  className
}: JobCardProps) {
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

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'emergency' || urgency === 'high') {
      return <AlertTriangle className="h-3 w-3" />
    }
    return null
  }

  const formatDistance = (location: any) => {
    // TODO: Calculate actual distance when user location is available
    // For now, return placeholder
    return "Distance TBD"
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-2">
              {job.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {job.course_profile && (
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>{job.course_profile.full_name}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{formatDistance(job.location)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={getUrgencyColor(job.urgency_level || 'normal')} className="flex items-center space-x-1">
              {getUrgencyIcon(job.urgency_level || 'normal')}
              <span className="capitalize">{job.urgency_level || 'normal'}</span>
            </Badge>
            <div className="text-right">
              <div className="font-bold text-green-700 dark:text-green-400 text-lg">${job.hourly_rate || 0}/hr</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Job Type and Description */}
        <div>
          <Badge variant="secondary" className="mb-2">
            {formatJobType(job.job_type || 'general')}
          </Badge>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.description || 'No description provided'}
          </p>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Start Date</div>
              <div className="text-muted-foreground">
                {job.start_date ? new Date(job.start_date).toLocaleDateString() : 'TBD'}
              </div>
            </div>
          </div>
          
          {job.end_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">End Date</div>
                <div className="text-muted-foreground">
                  {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'TBD'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Requirements */}
        {(job.required_experience || (job.required_certifications && job.required_certifications.length > 0)) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Requirements</h4>
            <div className="flex flex-wrap gap-1">
              {job.required_experience && (
                <Badge variant="outline" className="text-xs">
                  {job.required_experience.charAt(0).toUpperCase() + job.required_experience.slice(1)} Level
                </Badge>
              )}
              {job.required_certifications?.slice(0, 3).map((cert) => (
                <Badge key={cert} variant="outline" className="text-xs">
                  {cert.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
              {job.required_certifications && job.required_certifications.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{job.required_certifications?.length ? job.required_certifications.length - 3 : 0} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Application Count */}
        {typeof job.applications_count === 'number' && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              {job.applications_count} {job.applications_count === 1 ? 'application' : 'applications'}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            Posted {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : 'Unknown date'}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(job.id)}
            >
              View Details
            </Button>
            {showApplicationButton && !isApplied && (
              <Button
                size="sm"
                onClick={() => onApply?.(job.id)}
              >
                Apply Now
              </Button>
            )}
            {isApplied && (
              <Badge variant="secondary" className="px-3 py-1">
                Applied
              </Badge>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
