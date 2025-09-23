'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/FileUpload'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface JobUpdateFormProps {
  jobId: string
  onSuccess?: () => void
}

export function JobUpdateForm({ jobId, onSuccess }: JobUpdateFormProps) {
  const [updateType, setUpdateType] = useState<'milestone' | 'text' | 'photo'>('text')
  const [milestone, setMilestone] = useState('')
  const [content, setContent] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/jobs/${jobId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'active'] })
      setContent('')
      setPhotoUrls([])
      setMilestone('')
      onSuccess?.()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content && updateType === 'text') return
    if (!milestone && updateType === 'milestone') return
    if (photoUrls.length === 0 && updateType === 'photo') return

    await updateMutation.mutateAsync({
      update_type: updateType,
      milestone: updateType === 'milestone' ? milestone : undefined,
      content: content || undefined,
      photo_urls: photoUrls.length > 0 ? photoUrls : undefined
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Job Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select value={updateType} onValueChange={(value: any) => setUpdateType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Update type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Update</SelectItem>
                <SelectItem value="milestone">Milestone Update</SelectItem>
                <SelectItem value="photo">Photo Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updateType === 'milestone' && (
            <div>
              <Select value={milestone} onValueChange={setMilestone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="awaiting_review">Awaiting Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Textarea
              placeholder="Add details about your progress..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>

          {(updateType === 'photo' || updateType === 'text') && (
            <div>
              <FileUpload
                bucket="job-updates"
                path={`${jobId}/`}
                accept={{ 'image/*': [] }}
                maxFiles={5}
                onUpload={setPhotoUrls}
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? 'Adding Update...' : 'Add Update'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
