"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JobForm } from '@/components/jobs/JobForm'
import { useCreateJob } from '@/lib/hooks/useJobs'
import { useAuthStore } from '@/lib/stores/authStore'
import type { CreateJobInput } from '@/lib/validations/jobs'

export default function CreateJobPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const createJob = useCreateJob()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (profile?.user_type !== 'golf_course') {
      router.push('/dashboard')
      return
    }
  }, [user, profile, router])

  if (!user || profile?.user_type !== 'golf_course') {
    return null
  }

  const handleSubmit = async (data: CreateJobInput) => {
    try {
      await createJob.mutateAsync(data)
      router.push('/jobs')
    } catch (error) {
      console.error('Failed to create job:', error)
    }
  }

  const handleBack = () => {
    router.push('/jobs')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Post a New Job</h1>
          <p className="text-muted-foreground">
            Create a job posting to find qualified golf course maintenance professionals
          </p>
        </div>

        {/* Job Form */}
        <JobForm
          onSubmit={handleSubmit}
          isLoading={createJob.isPending}
          mode="create"
        />

        {/* Tips Card */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Tips for a Great Job Posting
            </h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li>• <strong>Be specific:</strong> Clearly describe what needs to be done and any special requirements</li>
              <li>• <strong>Set fair rates:</strong> Competitive hourly rates attract more qualified professionals</li>
              <li>• <strong>Include location details:</strong> Help professionals understand travel requirements</li>
              <li>• <strong>Specify urgency:</strong> Emergency jobs get priority visibility but may cost more</li>
              <li>• <strong>List requirements:</strong> Include any necessary certifications or experience levels</li>
              <li>• <strong>Add context:</strong> Mention if it's for a tournament, seasonal work, or special event</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
