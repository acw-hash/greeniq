'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, MapPin, Calendar, Camera } from 'lucide-react'
import { JobProgressUpdates } from './JobProgressUpdates'
import { JobUpdateForm } from './JobUpdateForm'
import { JobWithDetails } from '@/types/jobs'
import Link from 'next/link'

interface ActiveJobCardProps {
  job: JobWithDetails
  isHistory?: boolean
}

export function ActiveJobCard({ job, isHistory = false }: ActiveJobCardProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'awaiting_review': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const latestUpdate = job.job_updates?.[job.job_updates.length - 1]

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{job.golf_course_profiles?.course_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(job.start_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latest Update Preview */}
        {latestUpdate && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {job.professional_profiles?.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {job.professional_profiles?.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(latestUpdate.created_at).toLocaleDateString()}
                  </span>
                </div>
                {latestUpdate.milestone && (
                  <Badge variant="outline" className="mb-2">
                    {latestUpdate.milestone.replace('_', ' ')}
                  </Badge>
                )}
                {latestUpdate.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {latestUpdate.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/dashboard/messages/${job.id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUpdateForm(!showUpdateForm)}
          >
            <Camera className="h-4 w-4 mr-2" />
            {showUpdateForm ? 'Cancel' : 'Add Update'}
          </Button>

          <Link href={`/dashboard/jobs/active/${job.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>

        {/* Update Form */}
        {showUpdateForm && !isHistory && (
          <JobUpdateForm 
            jobId={job.id} 
            onSuccess={() => setShowUpdateForm(false)} 
          />
        )}

        {/* Progress Updates */}
        <JobProgressUpdates 
          jobId={job.id} 
          updates={job.job_updates || []} 
          showAll={false}
        />
      </CardContent>
    </Card>
  )
}
