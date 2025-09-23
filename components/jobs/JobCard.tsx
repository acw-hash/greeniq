'use client'

import { useState } from 'react'
import { Job } from '@/lib/stores/jobStore'
import { JobWithApplicationStatus } from '@/types/jobs'
import { jobTypeDisplayNames, urgencyLevelDisplayNames, statusDisplayNames } from '@/lib/validations/jobs'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPinIcon, 
  ClockIcon, 
  DollarSignIcon, 
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface JobCardProps {
  job: Job | JobWithApplicationStatus
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onView?: (job: Job) => void
  onApply?: (job: Job) => void
  onSave?: (job: Job) => void
  onShare?: (job: Job) => void
  onManage?: (job: Job) => void
  onAcceptJob?: (job: Job) => void
  application?: { status: string }
  userType?: 'professional' | 'golf_course'
  className?: string
  showApplyButton?: boolean
}

interface EnhancedJobCardProps {
  job: JobWithApplicationStatus
  onApply?: (jobId: string) => void
  showApplyButton?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onView?: (job: JobWithApplicationStatus) => void
  onSave?: (job: JobWithApplicationStatus) => void
  onShare?: (job: JobWithApplicationStatus) => void
  onManage?: (job: JobWithApplicationStatus) => void
  onAcceptJob?: (job: JobWithApplicationStatus) => void
  userType?: 'professional' | 'golf_course'
  className?: string
}

const urgencyColors = {
  normal: 'bg-gray-100 text-gray-800',
  high: 'bg-yellow-100 text-yellow-800',
  emergency: 'bg-red-100 text-red-800'
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusIcons = {
  open: CheckCircleIcon,
  in_progress: PlayCircleIcon,
  completed: CheckCircleIcon,
  cancelled: XCircleIcon
}

export default function JobCard({ 
  job, 
  variant = 'default', 
  showActions = true,
  onView,
  onApply,
  onSave,
  onShare,
  onManage,
  onAcceptJob,
  application,
  userType,
  className 
}: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  
  const StatusIcon = statusIcons[job.status]
  
  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.(job)
  }
  
  const handleLike = () => {
    setIsLiked(!isLiked)
  }
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: job.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
    onShare?.(job)
  }

  if (variant === 'compact') {
    return (
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                <Badge className={urgencyColors[job.urgency_level]} variant="secondary">
                  {urgencyLevelDisplayNames[job.urgency_level]}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSignIcon className="h-3 w-3" />
                  <span>${job.hourly_rate}/hr</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span className="truncate">{job.location.address}</span>
                </div>
                {job.distance && (
                  <span>{job.distance}mi</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <StatusIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn("hover:shadow-lg transition-shadow", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold">{job.title}</h2>
                <Badge className={urgencyColors[job.urgency_level]} variant="secondary">
                  {urgencyLevelDisplayNames[job.urgency_level]}
                </Badge>
                <Badge className={statusColors[job.status]} variant="secondary">
                  {statusDisplayNames[job.status]}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <DollarSignIcon className="h-4 w-4" />
                  <span className="font-semibold">${job.hourly_rate}/hour</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{job.location.address}</span>
                </div>
                {job.distance && (
                  <span>{job.distance} miles away</span>
                )}
              </div>
            </div>
            
            {job.profiles && (
              <div className="text-right">
                <p className="text-sm font-medium">{job.profiles.full_name}</p>
                {job.profiles.golf_course_profiles && (
                  <p className="text-xs text-gray-500">
                    {job.profiles.golf_course_profiles.course_name}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Job Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {job.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Job Type</h4>
              <p className="text-sm text-gray-600">{jobTypeDisplayNames[job.job_type]}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-1">Start Date</h4>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <CalendarIcon className="h-3 w-3" />
                <span>{new Date(job.start_date).toLocaleDateString()}</span>
              </div>
            </div>
            
            {job.required_experience && (
              <div>
                <h4 className="font-medium text-sm mb-1">Experience Required</h4>
                <p className="text-sm text-gray-600">{job.required_experience}</p>
              </div>
            )}
            
            {job.required_certifications.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Certifications</h4>
                <div className="flex flex-wrap gap-1">
                  {job.required_certifications.slice(0, 2).map((cert) => (
                    <Badge key={cert} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                  {job.required_certifications.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{job.required_certifications.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ClockIcon className="h-3 w-3" />
              <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  className={cn(isSaved && "bg-blue-50 border-blue-200")}
                >
                  <HeartIcon className={cn("h-3 w-3", isSaved && "fill-red-500 text-red-500")} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onView?.(job)}
                >
                  <EyeIcon className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                {job.status === 'open' && userType === 'professional' && (
                  <Button
                    size="sm"
                    onClick={() => onApply?.(job)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply Now
                  </Button>
                )}
                {userType === 'professional' && application?.status === 'accepted_by_course' && (
                  <Button
                    size="sm"
                    onClick={() => onAcceptJob?.(job)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept Job
                  </Button>
                )}
                {userType === 'professional' && application?.status === 'accepted_by_professional' && (
                  <Button
                    size="sm"
                    onClick={() => onManage?.(job)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Manage Job
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{job.title}</h3>
              <Badge className={urgencyColors[job.urgency_level]} variant="secondary">
                {urgencyLevelDisplayNames[job.urgency_level]}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <DollarSignIcon className="h-4 w-4" />
                <span className="font-semibold">${job.hourly_rate}/hr</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                <span className="truncate">{job.location.address}</span>
              </div>
              {job.distance && (
                <span>{job.distance}mi</span>
              )}
            </div>
          </div>
          
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {job.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ClockIcon className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                className={cn("h-8 w-8 p-0", isSaved && "text-red-500")}
              >
                <HeartIcon className={cn("h-3 w-3", isSaved && "fill-current")} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleShare}
                className="h-8 w-8 p-0"
              >
                <ShareIcon className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => onView?.(job)}
              >
                View
              </Button>
              {userType === 'professional' && application?.status === 'accepted_by_course' && (
                <Button
                  size="sm"
                  onClick={() => onAcceptJob?.(job)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Accept Job
                </Button>
              )}
              {userType === 'professional' && application?.status === 'accepted_by_professional' && (
                <Button
                  size="sm"
                  onClick={() => onManage?.(job)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Manage
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced JobCard with application status support
export function EnhancedJobCard({ 
  job, 
  onApply, 
  showApplyButton = true,
  variant = 'default',
  showActions = true,
  onView,
  onSave,
  onShare,
  onManage,
  onAcceptJob,
  userType,
  className 
}: EnhancedJobCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  
  const getApplicationStatusBadge = () => {
    if (!job.hasApplied) return null
    
    const status = job.userApplication?.status
    const variant = status === 'accepted' ? 'default' : 
                   status === 'rejected' ? 'destructive' : 'secondary'
    
    return (
      <Badge variant={variant} className="absolute top-2 right-2">
        {status === 'pending' && 'Applied'}
        {status === 'accepted' && 'Accepted'}
        {status === 'rejected' && 'Rejected'}
      </Badge>
    )
  }

  const renderActionButton = () => {
    if (!showApplyButton) return null
    
    if (job.hasApplied) {
      const status = job.userApplication?.status
      if (status === 'accepted') {
        return (
          <Button size="sm" variant="default" disabled>
            Accepted
          </Button>
        )
      }
      if (status === 'rejected') {
        return (
          <Button size="sm" variant="outline" disabled>
            Rejected
          </Button>
        )
      }
      return (
        <Button size="sm" variant="secondary" disabled>
          Application Pending
        </Button>
      )
    }
    
    return (
      <Button 
        size="sm" 
        onClick={() => onApply?.(job.id)}
      >
        Apply Now
      </Button>
    )
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.(job)
  }
  
  const handleLike = () => {
    setIsLiked(!isLiked)
  }
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: job.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
    onShare?.(job)
  }

  if (variant === 'compact') {
    return (
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer relative", className)}>
        {getApplicationStatusBadge()}
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                <Badge className={urgencyColors[job.urgency_level]} variant="secondary">
                  {urgencyLevelDisplayNames[job.urgency_level]}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSignIcon className="h-3 w-3" />
                  <span>${job.hourly_rate}/hr</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span className="truncate">{job.location.address}</span>
                </div>
                {job.distance && (
                  <span>{job.distance}mi</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn("hover:shadow-md transition-shadow cursor-pointer relative h-full flex flex-col", className)}>
      {getApplicationStatusBadge()}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{job.title}</h3>
              <Badge className={urgencyColors[job.urgency_level]} variant="secondary">
                {urgencyLevelDisplayNames[job.urgency_level]}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <DollarSignIcon className="h-4 w-4" />
                <span className="font-semibold">${job.hourly_rate}/hr</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                <span className="truncate">{job.location.address}</span>
              </div>
              {job.distance && (
                <span>{job.distance}mi</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1">
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {job.description}
        </p>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className={cn("h-8 w-8 p-0", isSaved && "text-red-500")}
            >
              <HeartIcon className={cn("h-3 w-3", isSaved && "fill-current")} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleShare}
              className="h-8 w-8 p-0"
            >
              <ShareIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => onView?.(job)}
            >
              View
            </Button>
            {renderActionButton()}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}