'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  DollarSign, 
  MapPin, 
  User, 
  Building, 
  MessageSquare, 
  Upload, 
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/lib/utils/toast'

interface JobProgressProps {
  jobId: string
  initialJob: any
}

export function JobProgress({ jobId, initialJob }: JobProgressProps) {
  const { profile } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [newUpdate, setNewUpdate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isProfessional = profile?.user_type === 'professional'
  const isGolfCourse = profile?.user_type === 'golf_course'

  // Fetch job updates
  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ['job-updates', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/updates`)
      if (!response.ok) throw new Error('Failed to fetch updates')
      return response.json()
    }
  })

  // Submit new update mutation
  const submitUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/jobs/${jobId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!response.ok) throw new Error('Failed to submit update')
      return response.json()
    },
    onSuccess: () => {
      setNewUpdate('')
      queryClient.invalidateQueries({ queryKey: ['job-updates', jobId] })
      toast({
        title: 'Update submitted',
        description: 'Your progress update has been shared.'
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit update. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const handleSubmitUpdate = async () => {
    if (!newUpdate.trim()) return
    
    setIsSubmitting(true)
    try {
      await submitUpdateMutation.mutateAsync(newUpdate)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMessage = () => {
    router.push(`/dashboard/messages/${jobId}`)
  }

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{initialJob.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {isProfessional && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{initialJob.profiles?.golf_course_profiles?.course_name}</span>
                  </div>
                )}
                
                {isGolfCourse && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Professional: {initialJob.applications?.[0]?.profiles?.full_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${initialJob.hourly_rate}/hr</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started {format(new Date(initialJob.start_date), 'PPP')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={
                initialJob.submission_status === 'approved' ? 'default' :
                initialJob.submission_status === 'submitted' ? 'secondary' :
                initialJob.submission_status === 'in_progress' ? 'outline' :
                'secondary'
              }>
                {initialJob.submission_status === 'not_started' ? 'Ready to Start' :
                 initialJob.submission_status === 'in_progress' ? 'In Progress' :
                 initialJob.submission_status === 'submitted' ? 'Awaiting Review' :
                 initialJob.submission_status === 'approved' ? 'Completed' :
                 initialJob.submission_status}
              </Badge>
              
              <Button variant="outline" onClick={handleMessage}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground">{initialJob.description}</p>
        </CardContent>
      </Card>

      {/* Progress Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Progress Updates
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Submit new update (for professionals) */}
          {isProfessional && initialJob.submission_status !== 'approved' && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label htmlFor="update">Add Progress Update</Label>
              <Textarea
                id="update"
                placeholder="Share your progress, challenges, or any updates..."
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                className="mt-2"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={handleSubmitUpdate}
                  disabled={!newUpdate.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Update'}
                </Button>
              </div>
            </div>
          )}

          {/* Updates list */}
          {updatesLoading ? (
            <div className="text-center py-4">Loading updates...</div>
          ) : updates?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No progress updates yet.
            </div>
          ) : (
            <div className="space-y-4">
              {updates?.map((update: any) => (
                <div key={update.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{update.profiles?.full_name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(update.created_at), 'PPP p')}
                    </span>
                  </div>
                  <p className="text-sm">{update.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        
        {isGolfCourse && initialJob.submission_status === 'submitted' && (
          <Button 
            onClick={() => router.push(`/dashboard/jobs/${jobId}/review`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Review Work
          </Button>
        )}
        
        {isProfessional && initialJob.submission_status === 'in_progress' && (
          <Button 
            onClick={() => router.push(`/dashboard/jobs/${jobId}/manage`)}
          >
            Manage Job
          </Button>
        )}
      </div>
    </div>
  )
}
