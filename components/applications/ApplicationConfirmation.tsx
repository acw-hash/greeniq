'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Application, Job } from '@/types/jobs'

interface ApplicationConfirmationProps {
  application: Application & {
    jobs: Job & {
      golf_course_profiles: {
        course_name: string
      }
    }
  }
}

export function ApplicationConfirmation({ application }: ApplicationConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const confirmMutation = useMutation({
    mutationFn: async (action: 'confirm' | 'deny') => {
      const response = await fetch(`/api/applications/${application.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (!response.ok) throw new Error('Failed to process confirmation')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'active'] })
    }
  })

  const handleConfirmation = async (action: 'confirm' | 'deny') => {
    setIsLoading(true)
    try {
      await confirmMutation.mutateAsync(action)
    } catch (error) {
      console.error('Confirmation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (application.status !== 'accepted') {
    return null
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Job Acceptance Pending</CardTitle>
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Awaiting Your Response
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">{application.jobs.title}</h4>
            <p className="text-sm text-muted-foreground">
              {application.jobs.golf_course_profiles.course_name}
            </p>
            <p className="text-sm mt-2">
              Your application has been accepted! Please confirm if you want to take this job.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => handleConfirmation('confirm')}
              disabled={isLoading}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Job
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConfirmation('deny')}
              disabled={isLoading}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline Job
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
