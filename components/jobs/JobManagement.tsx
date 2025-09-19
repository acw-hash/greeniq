'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, DollarSign, Camera, MessageSquare, Play, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { FileUpload } from '@/components/ui/FileUpload'

interface JobManagementProps {
  jobId: string
  initialJob?: any
}

export function JobManagement({ jobId, initialJob }: JobManagementProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [updateForm, setUpdateForm] = useState({
    update_type: 'progress',
    title: '',
    description: '',
    photos: [] as string[]
  })
  const [completionNotes, setCompletionNotes] = useState('')

  // Fetch job details
  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) throw new Error('Failed to fetch job')
      return response.json()
    },
    initialData: initialJob
  })

  // Fetch job updates
  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ['job-updates', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/updates`)
      if (!response.ok) throw new Error('Failed to fetch updates')
      return response.json()
    }
  })

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      })
      if (!response.ok) throw new Error('Failed to start job')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['job-updates', jobId] })
    }
  })

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          completion_notes: completionNotes
        })
      })
      if (!response.ok) throw new Error('Failed to complete job')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['job-updates', jobId] })
      router.push('/dashboard/jobs?completed=true')
    }
  })

  // Create update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/jobs/${jobId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      if (!response.ok) throw new Error('Failed to create update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-updates', jobId] })
      setUpdateForm({
        update_type: 'progress',
        title: '',
        description: '',
        photos: []
      })
    }
  })

  const handleStartJob = () => {
    if (window.confirm('Are you ready to start this job?')) {
      startJobMutation.mutate()
    }
  }

  const handleCompleteJob = () => {
    if (window.confirm('Are you sure you want to mark this job as completed?')) {
      completeJobMutation.mutate()
    }
  }

  const handleCreateUpdate = () => {
    if (!updateForm.title.trim()) {
      alert('Please enter a title for the update')
      return
    }
    createUpdateMutation.mutate(updateForm)
  }

  const canStart = job?.status === 'in_progress' && !updates?.some(u => u.update_type === 'started')
  const canComplete = job?.status === 'in_progress' && updates?.some(u => u.update_type === 'started')
  const isCompleted = job?.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Job</h1>
          <p className="text-muted-foreground">{job?.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={job?.status === 'completed' ? 'default' : 'secondary'}>
            {job?.status}
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/messages/${jobId}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Golf Course
          </Button>
        </div>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {job?.profiles?.golf_course_profiles?.course_name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">${job?.hourly_rate}/hour</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(job?.start_date), 'PPP')}
              </span>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{job?.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex gap-4">
          {canStart && (
            <Button 
              onClick={handleStartJob}
              disabled={startJobMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {startJobMutation.isPending ? 'Starting...' : 'Start Job'}
            </Button>
          )}
          
          {canComplete && (
            <Button 
              onClick={handleCompleteJob}
              disabled={completeJobMutation.isPending}
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {completeJobMutation.isPending ? 'Completing...' : 'Complete Job'}
            </Button>
          )}
        </div>
      )}

      {/* Completion Notes (when completing) */}
      {canComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any final notes about the completed work..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Progress Updates */}
      {!isCompleted && updates?.some(u => u.update_type === 'started') && (
        <Card>
          <CardHeader>
            <CardTitle>Add Progress Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Update Title</Label>
              <Input
                id="title"
                value={updateForm.title}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of progress..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={updateForm.description}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of work completed..."
              />
            </div>
            
            <div>
              <Label>Photos</Label>
              <FileUpload
                bucket="job-photos"
                path={`${jobId}/`}
                accept={{ 'image/*': [] }}
                maxFiles={5}
                onUpload={(urls) => setUpdateForm(prev => ({ ...prev, photos: urls }))}
              />
            </div>
            
            <Button 
              onClick={handleCreateUpdate}
              disabled={createUpdateMutation.isPending}
            >
              <Camera className="h-4 w-4 mr-2" />
              {createUpdateMutation.isPending ? 'Adding Update...' : 'Add Update'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Updates Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Job Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {updatesLoading ? (
            <div>Loading updates...</div>
          ) : updates?.length === 0 ? (
            <p className="text-muted-foreground">No updates yet</p>
          ) : (
            <div className="space-y-4">
              {updates?.map((update, index) => (
                <div key={update.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{update.title}</h4>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(update.created_at), 'PPp')}
                    </span>
                  </div>
                  
                  {update.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {update.description}
                    </p>
                  )}
                  
                  {update.photos?.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {update.photos.map((photo, photoIndex) => (
                        <img
                          key={photoIndex}
                          src={photo}
                          alt={`Update ${photoIndex + 1}`}
                          className="w-20 h-20 object-cover rounded cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}