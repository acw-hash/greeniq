'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useJob } from '@/lib/hooks/useJobs'
import JobForm from '@/components/jobs/JobForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeftIcon, 
  AlertCircleIcon,
  SaveIcon,
  EyeIcon,
  TrashIcon
} from 'lucide-react'

interface EditJobPageProps {
  params: { id: string }
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { data: jobData, isLoading: isLoadingJob, error: jobError } = useJob(params.id)
  const job = jobData?.job

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            golf_course_profiles (*)
          `)
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          setError('Profile not found. Please complete your profile first.')
          return
        }

        if (profile.user_type !== 'golf_course') {
          setError('Only golf courses can edit jobs.')
          return
        }

        setProfile(profile)
      } catch (err) {
        console.error('Error checking user:', err)
        setError('An error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  // Check if user owns the job
  useEffect(() => {
    if (job && profile && job.course_id !== profile.id) {
      setError('You do not have permission to edit this job.')
    }
  }, [job, profile])

  const handleSuccess = () => {
    router.push(`/jobs/${params.id}`)
  }

  const handleCancel = () => {
    router.back()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone and will cancel all pending applications.')) {
      return
    }
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/jobs')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete job. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleView = () => {
    router.push(`/jobs/${params.id}`)
  }

  if (isLoading || isLoadingJob) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error || jobError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {error || 'Job not found or you do not have permission to edit it.'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-4">The job you're trying to edit doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/jobs')}>
            Browse All Jobs
          </Button>
        </div>
      </div>
    )
  }

  // Don't allow editing completed or cancelled jobs
  if (job.status === 'completed' || job.status === 'cancelled') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This job cannot be edited because it is {job.status}.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push(`/jobs/${params.id}`)} variant="outline">
            <EyeIcon className="h-4 w-4 mr-2" />
            View Job
          </Button>
        </div>
      </div>
    )
  }

  // Convert job data to form format
  const initialFormData = {
    title: job.title,
    description: job.description,
    job_type: job.job_type,
    location: {
      lat: job.location.lat,
      lng: job.location.lng,
      address: job.location.address
    },
    start_date: job.start_date,
    end_date: job.end_date,
    hourly_rate: job.hourly_rate,
    required_certifications: job.required_certifications,
    required_experience: job.required_experience,
    urgency_level: job.urgency_level
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Job</h1>
              <p className="text-gray-600">
                Update your job posting details
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleView}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2">
            <JobForm
              initialData={initialFormData}
              jobId={params.id}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>

          {/* Sidebar with job info and warnings */}
          <div className="space-y-6">
            {/* Current job status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-800' :
                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applications</span>
                  <span className="font-semibold">{job.applications?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Editing warnings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-amber-800">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-2">Before making changes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Changes will be visible to all applicants</li>
                    <li>• Rate changes may affect pending applications</li>
                    <li>• Date changes should be communicated to applicants</li>
                    <li>• Job will be re-promoted to matching professionals</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Job posted</span>
                    <span className="text-gray-500 ml-auto">2 days ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>3 applications received</span>
                    <span className="text-gray-500 ml-auto">1 day ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Job viewed 15 times</span>
                    <span className="text-gray-500 ml-auto">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Duplicate Job
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Pause Applications
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Share Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
